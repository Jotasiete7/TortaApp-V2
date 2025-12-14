use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use regex::Regex;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom, Write};
use std::path::Path;
use std::sync::mpsc::channel;
use std::sync::Mutex;
use std::thread;
use tauri::{AppHandle, Emitter, Manager};

// Import advanced parser
use crate::parser::AdvancedParser;

// --- LOGGING HELPER ---
fn log_debug(msg: &str) {
    let path = r"C:\Users\Pichau\.gemini\antigravity\brain\866f9c0a-69ae-4634-9410-a60e94a3ea1e\trade_debug.txt";
    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "{}", msg);
    } else {
        println!("RUST LOG FAIL: {}", msg);
    }
}

// Re-export ParsedTrade from parser module
pub use crate::parser::ParsedTrade;

pub struct FileWatcher {
    path: String,
    last_pos: u64,
    regex: Regex,
    parser: AdvancedParser,
}

impl FileWatcher {
    pub fn new(path: String) -> Self {
        log_debug("🚀 Using ADVANCED parser - the only mode!");
        
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

                for line in recent.iter().rev() {
                    log_debug(&format!("Checking line: '{}'", line)); 
                    if let Some(trade) = self.parse_line(line) {
                         log_debug(&format!("Emitting initial trade: {}", trade.message));
                         let _ = app_handle.emit("trade-event", trade);
                    }
                }
                
                self.last_pos = len; 
                log_debug(&format!("Initial scan done. last_pos set to: {}", self.last_pos));
            }
            Err(e) => {
                log_debug(&format!("File open error: {}", e));
                return Err(format!("Failed to open file: {}", e))
            },
        }

        let mut watcher = match RecommendedWatcher::new(tx, Config::default()) {
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

        thread::spawn(move || {
            let _watcher = watcher; 
            log_debug("Watcher thread running...");
            
            for res in rx {
                match res {
                    Ok(event) => {
                        log_debug(&format!("FS Event: {:?}", event));
                         if let Ok(mut file) = File::open(&p_str) {
                            if let Ok(len) = file.metadata().map(|m| m.len()) {
                                if len > current_pos {
                                    if file.seek(SeekFrom::Start(current_pos)).is_ok() {
                                        let reader = BufReader::new(file);
                                        for line in reader.lines() {
                                            if let Ok(l) = line {
                                                current_pos += l.len() as u64 + 1;
                                                log_debug(&format!("Checking LIVE line: '{}'", l));
                                                
                                                if let Some(caps) = regex.captures(&l) {
                                                    let timestamp = caps[1].to_string();
                                                    let nick = caps[2].to_string();
                                                    let message = caps[3].to_string();
                                                    let trade = parser.parse(timestamp, nick, message);
                                                    
                                                    log_debug(&format!("Emitting LIVE trade: {}", trade.message));
                                                    let _ = app_handle.emit("trade-event", trade);
                                                }
                                            }
                                        }
                                        current_pos = len; 
                                    }
                                }
                            }
                         }
                    }
                    Err(e) => log_debug(&format!("Watch error: {:?}", e)),
                }
            }
        });

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
