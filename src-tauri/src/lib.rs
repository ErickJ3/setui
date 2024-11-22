// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use sqlite::SqliteManager;
use tauri::Manager;

mod sqlite;
mod ob;

#[derive(Default)]
struct AppState {
    sqlite_manager: SqliteManager,
}

#[tauri::command]
fn greet(name: &str, app_handle: tauri::AppHandle) -> String {
    let state = app_handle.state::<AppState>();

    format!("Hello, {}! You've been greeted from Rust!", "erick")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            sqlite_manager: SqliteManager::new().unwrap(),
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
