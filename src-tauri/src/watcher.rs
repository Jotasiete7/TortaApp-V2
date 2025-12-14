use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use regex::Regex;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom, Write};
use std::path::Path;
use std::sync::mpsc::channel;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, Manager};

// Import advanced parser
use crate::parser::AdvancedParser;

// FEATURE FLAG: Toggle between parsers
const USE_ADVANCED_PARSING: bool = false; // Set to true to enable

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

trait LogParser: Send + Sync {
    fn parse(&self, line: &str) -> Option<ParsedTrade>;
}

struct StandardLogParser {
    regex: Regex,
}

impl StandardLogParser {
    fn new() -> Self {
        Self {
            regex: Regex::new(r"^\[(\d{2}:\d{2}:\d{2})\]\s+<([^>]+)>\s+(.+)").unwrap(),
        }
    }
}

impl LogParser for StandardLogParser {
    fn parse(&self, line: &str) -> Option<ParsedTrade> {
        self.regex.captures(line).map(|cap| ParsedTrade {
            timestamp: cap[1].to_string(),
            nick: cap[2].to_string(),
            message: cap[3].to_string(),
            trade_type: None,
            item: None,
            quality: None,
            rarity: None,
            price_copper: None,
        })
    }
}

// Advanced parser wrapper
struct AdvancedLogParser {
    regex: Regex,
    parser: AdvancedParser,
}

impl AdvancedLogParser {
    fn new() -> Self {
        Self {
            regex: Regex::new(r"^\[(\d{2}:\d{2}:\d{2})\]\s+<([^>]+)>\s+(.+)").unwrap(),
            parser: AdvancedParser::new(),
        }
    }
}

impl LogParser for AdvancedLogParser {
    fn parse(&self, line: &str) -> Option<ParsedTrade> {
        self.regex.captures(line).map(|cap| {
            let timestamp = cap[1].to_string();
            let nick = cap[2].to_string();
            let message = cap[3].to_string();
            
            // Use advanced parser
            self.parser.parse(timestamp, nick, message)
        })
    }
}

pub struct FileWatcher {
    path: String,
    last_pos: u64,
    parser: Box<dyn LogParser>,
}

impl FileWatcher {
    pub fn new(path: String) -> Self {
        let parser: Box<dyn LogParser> = if USE_ADVANCED_PARSING {
            log_debug("ðŸš€ Using ADVANCED parser with tokenization");
            Box::new(AdvancedLogParser::new())
        } else {
            log_debug("ðŸ“ Using STANDARD parser (legacy)");
            Box::new(StandardLogParser::new())
        };
        
        Self {
            path,
            last_pos: 0,
            parser,
        }
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

                let parser_for_init = if USE_ADVANCED_PARSING {
                    Box::new(AdvancedLogParser::new()) as Box<dyn LogParser>
                } else {
                    Box::new(StandardLogParser::new()) as Box<dyn LogParser>
                };
                
                for line in recent.iter().rev() {
                    log_debug(&format!("Checking line: '{}'", line)); 
                    if let Some(trade) = parser_for_init.parse(line) {
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
        let parser_for_thread = if USE_ADVANCED_PARSING {
            Arc::new(AdvancedLogParser::new()) as Arc<dyn LogParser>
        } else {
            Arc::new(StandardLogParser::new()) as Arc<dyn LogParser>
        };
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
                                                
                                                if let Some(trade) = parser_for_thread.parse(&l) {
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
