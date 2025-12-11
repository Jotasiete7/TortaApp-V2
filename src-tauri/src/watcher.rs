use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use regex::Regex;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom, Write};
use std::path::Path;
use std::sync::mpsc::channel;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, Manager};

// --- LOGGING HELPER ---
fn log_debug(msg: &str) {
    // Write to a safe, known location in the artifacts directory
    let path = r"C:\Users\Pichau\.gemini\antigravity\brain\866f9c0a-69ae-4634-9410-a60e94a3ea1e\trade_debug.txt";
    // Using OpenOptions to append
    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "{}", msg);
    } else {
        // Fallback to println if file write fails, though this often gets swallowed
        println!("RUST LOG FAIL: {}", msg);
    }
}

#[derive(Clone, serde::Serialize)]
pub struct ParsedTrade {
    pub timestamp: String,
    pub nick: String,
    pub message: String,
}

trait LogParser: Send + Sync {
    fn parse(&self, line: &str) -> Option<ParsedTrade>;
}

struct StandardLogParser {
    regex: Regex,
}

impl StandardLogParser {
    fn new() -> Self {
        Self {
            // FIXED REGEX: No double backslash at start.
            // r"^[" in Rust raw string matches a literal '['.
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
        Self {
            path,
            last_pos: 0,
            parser: Box::new(StandardLogParser::new()),
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
                let reader = BufReader::new(&file);
                let all_lines: Vec<String> = reader.lines().filter_map(|l| l.ok()).collect();
                
                // Read last 10 lines
                let recent: Vec<&String> = all_lines.iter().rev().take(10).collect();
                log_debug(&format!("Found {} total lines, reading last {}", all_lines.len(), recent.len()));

                let parser = StandardLogParser::new();
                // Iterate normally (oldest to newest among the recent) or reverse?
                // Logic: prevent spamming old trades.
                // Reversing 'recent' means we look at the very last line first.
                for line in recent.iter().rev() {
                    log_debug(&format!("Checking line: '{}'", line)); // LOG RAW LINE
                    if let Some(trade) = parser.parse(line) {
                         log_debug(&format!("Emitting initial trade: {}", trade.message));
                         let _ = app_handle.emit("trade-event", trade);
                    } else {
                         log_debug("Failed to parse this line!"); // LOG FAILURE
                    }
                }
                
                if let Ok(pos) = file.seek(SeekFrom::End(0)) {
                    self.last_pos = pos;
                    log_debug(&format!("Seeked to end: {}", pos));
                }
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
        let parser = Arc::new(StandardLogParser::new());
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
                                                // +1 is naive, but workable for now
                                                log_debug(&format!("Checking LIVE line: '{}'", l));
                                                
                                                if let Some(trade) = parser.parse(&l) {
                                                    log_debug(&format!("Emitting LIVE trade: {}", trade.message));
                                                    let _ = app_handle.emit("trade-event", trade);
                                                } else {
                                                    log_debug("Failed to parse LIVE line!");
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
    // Strip quotes just in case
    let clean = path.replace("\"", "");
    log_debug(&format!("COMMAND: start_trade_watcher called with '{}'", clean));
    
    let mut watcher = FileWatcher::new(clean);
    watcher.start(app)
}
