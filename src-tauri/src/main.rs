#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod watcher;
mod parser;
mod price;

use std::fs::File;
use std::io::Read;
use std::sync::Mutex;
use tauri::Manager;

#[tauri::command]
fn check_file_access(path: String) -> Result<bool, String> {
    match File::open(&path) {
        Ok(mut file) => {
            let mut buffer = [0; 1];
            match file.read(&mut buffer) {
                Ok(_) => Ok(true),
                Err(e) => Err(format!("File exists but cannot be read: {}", e)),
            }
        }
        Err(e) => Err(format!("Cannot open file: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app.get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .manage(watcher::WatcherState(Mutex::new(None)))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            check_file_access,
            watcher::start_trade_watcher
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
