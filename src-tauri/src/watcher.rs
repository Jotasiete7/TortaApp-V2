use notify::{Config, PollWatcher, RecursiveMode, Watcher};
use regex::Regex;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom, Write, Read};
use std::path::Path;
use std::sync::mpsc::{channel, Receiver};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use std::env;
use tauri::{AppHandle, Emitter, Manager};

// Import advanced parser
use crate::parser::AdvancedParser;

// --- LOGGING HELPER ---
fn log_debug(msg: &str) {
    let mut path = env::temp_dir();
    path.push("torta_trade_debug.txt");
    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "{}", msg);
    } else {
        println!("RUST LOG FAIL: {}", msg);
    }
}

// Re-export ParsedTrade from parser module
pub use crate::parser::ParsedTrade;

// Estrutura para o payload do evento em batch
#[derive(serde::Serialize, Clone)]
pub struct TradeBatch {
    trades: Vec<ParsedTrade>,
}

pub struct FileWatcher {
    path: String,
    last_pos: u64,
    regex: Regex,
    parser: AdvancedParser,
}

impl FileWatcher {
    pub fn new(path: String) -> Self {
        log_debug("🚀 Using ADVANCED parser with POLL WATCHER (200ms)!");
        
        Self {
            path,
            last_pos: 0,
            regex: Regex::new(r"^\[(\d{2}:\d{2}:\d{2})\]\s+<([^>]+)>\s+(.+)").unwrap(),
            parser: AdvancedParser::new(),
        }
    }

    fn parse_line(&self, line: &str) -> Option<ParsedTrade> {
        self.regex.captures(line).map(|cap| {
            let timestamp = cap[1].to_string();
            let nick = cap[2].to_string();
            let message = cap[3].to_string();
            
            self.parser.parse(timestamp, nick, message)
        })
    }

    pub fn start(&mut self, app_handle: AppHandle) -> Result<(), String> {
        let path_str = self.path.clone();
        let path = Path::new(&path_str);
        
        log_debug(&format!("FileWatcher::start for path: {:?}", path));

        if !path.exists() {
            log_debug("File does not exist!");
            return Err("File not found".to_string());
        }

        let (tx, rx) = channel();
        
        // --- INICIALIZAÇÃO E LEITURA INICIAL (MANTIDA) ---
        match File::open(path) {
            Ok(mut file) => {
                let metadata = file.metadata().map_err(|e| format!("Failed to get metadata: {}", e))?;
                let len = metadata.len();
                let chunk_size = 5000; 
                
                let start_pos = if len > chunk_size { len - chunk_size } else { 0 };
                
                if let Err(e) = file.seek(SeekFrom::Start(start_pos)) {
                    log_debug(&format!("Seek error: {}", e));
                    return Err(format!("Seek error: {}", e));
                }

                let reader = BufReader::new(&file);
                let mut lines: Vec<String> = reader.lines().filter_map(|l| l.ok()).collect();
                
                if start_pos > 0 && lines.len() > 1 {
                    lines.remove(0);
                }

                let recent: Vec<&String> = lines.iter().rev().take(10).collect();
                
                log_debug(&format!("File len: {}, Start pos: {}, Lines read: {}, Init output: {}", len, start_pos, lines.len(), recent.len()));

                // Emissão inicial em batch para evitar sobrecarga
                let initial_trades: Vec<ParsedTrade> = recent.iter().rev().filter_map(|line| {
                    self.parse_line(line)
                }).collect();

                if !initial_trades.is_empty() {
                    log_debug(&format!("Emitting initial batch of {} trades.", initial_trades.len()));
                    let _ = app_handle.emit("trade-batch-event", TradeBatch { trades: initial_trades });
                }
                
                self.last_pos = len; 
                log_debug(&format!("Initial scan done. last_pos set to: {}", self.last_pos));
            }
            Err(e) => {
                log_debug(&format!("File open error: {}", e));
                return Err(format!("Failed to open file: {}", e))
            },
        }
        // --- FIM DA LEITURA INICIAL ---

        // USE POLL WATCHER INSTEAD OF RECOMMENDED WATCHER
        let config = Config::default()
            .with_poll_interval(Duration::from_millis(200));

        let mut watcher = match PollWatcher::new(tx, config) {
            Ok(w) => w,
            Err(e) => return Err(format!("Failed to create watcher: {}", e)),
        };

        if let Err(e) = watcher.watch(path, RecursiveMode::NonRecursive) {
            return Err(format!("Failed to watch file: {}", e));
        }

        let mut current_pos = self.last_pos;
        let regex = self.regex.clone();
        let parser = AdvancedParser::new();
        let p_str = path_str.clone();

        // --- THREAD DE PROCESSAMENTO DE EVENTOS (COM BATCHING) ---
        thread::spawn(move || {
            let _watcher = watcher; 
            log_debug("Watcher thread running (POLL MODE)...");
            
            // Canal para receber eventos do FS e do timer de debounce
            let (tx_process, rx_process) = channel();
            
            // Thread para receber eventos do FS e enviá-los para o processador
            let tx_clone = tx_process.clone();
            thread::spawn(move || {
                for res in rx {
                    if let Ok(event) = res {
                        // Passa tudo, mas com PollWatcher, eventos são gerados periodicamente se houver mudança
                        log_debug(&format!("POLL EVENT: {:?}", event));
                        let _ = tx_clone.send(event);
                    }
                }
            });

            // Variáveis para o debounce e batching
            let mut last_event_time = std::time::Instant::now();
            let debounce_duration = Duration::from_millis(50); 
            let batch_duration = Duration::from_millis(100); 
            let mut trade_batch: Vec<ParsedTrade> = Vec::new();

            loop {
                // Tenta receber um evento do FS com timeout de 10ms
                match rx_process.recv_timeout(Duration::from_millis(10)) {
                    Ok(_event) => {
                        // Evento de modificação recebido. Aplica debounce.
                        if last_event_time.elapsed() < debounce_duration {
                            thread::sleep(debounce_duration - last_event_time.elapsed());
                        }
                        last_event_time = std::time::Instant::now();

                        // Lógica de leitura do log (mantida)
                        if let Ok(mut file) = File::open(&p_str) {
                            if let Ok(len) = file.metadata().map(|m| m.len()) {
                                if len > current_pos {
                                    if file.seek(SeekFrom::Start(current_pos)).is_ok() {
                                        let mut buffer = Vec::new(); 
                                        if let Ok(bytes_read) = file.read_to_end(&mut buffer) { 
                                             if bytes_read > 0 {
                                                let content = String::from_utf8_lossy(&buffer);
                                                
                                                for line in content.lines() {
                                                    if line.trim().is_empty() { continue; }
                                                    log_debug(&format!("Checking LIVE line: '{}'", line));
                                                    
                                                    if let Some(caps) = regex.captures(line) {
                                                        let timestamp = caps[1].to_string();
                                                        let nick = caps[2].to_string();
                                                        let message = caps[3].to_string();
                                                        let trade = parser.parse(timestamp, nick, message);
                                                        
                                                        trade_batch.push(trade);
                                                    }
                                                }
                                                current_pos += bytes_read as u64; 
                                             }
                                        }
                                    }
                                } else if len < current_pos {
                                     // Truncated check
                                     current_pos = len;
                                }
                            }
                        }
                    },
                    Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                        // Timeout: Verifica se há trades no batch para enviar
                        if !trade_batch.is_empty() && last_event_time.elapsed() >= batch_duration {
                            log_debug(&format!("Emitting batch of {} trades after timeout.", trade_batch.len()));
                            let _ = app_handle.emit("trade-batch-event", TradeBatch { trades: trade_batch.clone() });
                            trade_batch.clear();
                        }
                    },
                    Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                        log_debug("FS Watcher disconnected. Exiting thread.");
                        break;
                    }
                }
            }
        });
        // --- FIM DA THREAD DE PROCESSAMENTO ---

        Ok(())
    }
}

pub struct WatcherState(pub Mutex<Option<FileWatcher>>);

#[tauri::command]
pub fn start_trade_watcher(path: String, _state: tauri::State<WatcherState>, app: AppHandle) -> Result<(), String> {
    let clean = path.replace("\"", "");
    log_debug(&format!("COMMAND: start_trade_watcher called with '{}'", clean));
    
    let mut watcher = FileWatcher::new(clean);
    watcher.start(app)
}
