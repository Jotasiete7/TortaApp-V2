use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use regex::Regex;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::Path;
use std::sync::mpsc::channel;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

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
        // Format: [14:26:05] <PlayerName> Message...
        Self {
            regex: Regex::new(r"^\\[(\\d{2}:\\d{2}:\\d{2})\\]\\s+<([^>]+)>\\s+(.+)").unwrap(),
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

        if !path.exists() {
            return Err("File not found".to_string());
        }

        let (tx, rx) = channel();
        
        // Read last 10 lines for context, then position at end for new data
        match File::open(path) {
            Ok(mut file) => {
                // Read all lines first
                let reader = BufReader::new(&file);
                let all_lines: Vec<String> = reader.lines()
                    .filter_map(|l| l.ok())
                    .collect();
                
                // Get last 10 lines
                let recent_lines: Vec<&String> = all_lines.iter()
                    .rev()
                    .take(10)
                    .collect();
                
                // Parse and emit recent lines (in correct order)
                let parser = StandardLogParser::new();
                for line in recent_lines.iter().rev() {
                    if let Some(trade) = parser.parse(line) {
                        let _ = app_handle.emit("trade-event", trade);
                    }
                }
                
                // Now seek to end for monitoring new lines
                if let Ok(pos) = file.seek(SeekFrom::End(0)) {
                    self.last_pos = pos;
                    println!("Watcher started at position: {} (after reading last 10 lines)", pos);
                }
            }
            Err(e) => return Err(format!("Failed to open file: {}", e)),
        }

        // Setup Watcher
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
            // Keep watcher alive in this thread
            let _watcher = watcher; 
            
            for res in rx {
                match res {
                    Ok(event) => {
                        // Debounce or check event kind? 
                        // For now, on any event, try to read new lines
                        if let Ok(mut file) = File::open(&p_str) {
                            if let Ok(len) = file.metadata().map(|m| m.len()) {
                                if len < current_pos {
                                    // File truncated? Reset
                                    current_pos = 0;
                                }
                                
                                if len > current_pos {
                                    if file.seek(SeekFrom::Start(current_pos)).is_ok() {
                                        let reader = BufReader::new(file);
                                        for line in reader.lines() {
                                            if let Ok(l) = line {
                                                current_pos += l.len() as u64 + 1; // +1 for newline approximation (CRLF might need +2)
                                                // Actually seek gives exact pos, but here we estimate or read_line tells us?
                                                // Better: use `read_line` which includes newline chars to count bytes accurately
                                                // But for simplicity of logic, let's update current_pos = file.stream_position()
                                                
                                                if let Some(trade) = parser.parse(&l) {
                                                    let _ = app_handle.emit("trade-event", trade);
                                                }
                                            }
                                        }
                                        // Update exact position
                                        if let Ok(mut f_verify) = File::open(&p_str) {
                                             let _ = f_verify.seek(SeekFrom::Start(current_pos)); 
                                             // Accurate position tracking is hard with BufReader unless we track bytes read
                                             // Let's rely on metadata len for next iteration or just ReadToEnd logic
                                             current_pos = len; 
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => println!("Watch error: {:?}", e),
                }
            }
        });

        Ok(())
    }
}

// Managed State
pub struct WatcherState(pub Mutex<Option<FileWatcher>>);

#[tauri::command]
pub fn start_trade_watcher(path: String, state: tauri::State<WatcherState>, app: AppHandle) -> Result<(), String> {
    println!("🦀 RUST: start_trade_watcher called with path: {}", path);
    let mut watcher = FileWatcher::new(path);
    match watcher.start(app) {
        Ok(_) => println!("🦀 RUST: Watcher started successfully"),
        Err(e) => {
            println!("🦀 RUST: Watcher error: {}", e);
            return Err(e);
        }
    };
    
    // Save to state if we want to stop it later (not implemented yet)
    // *state.0.lock().unwrap() = Some(watcher); 
    
    Ok(())
}
