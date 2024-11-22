use std::sync::Mutex;

use log::error;
use ob::Connection;
use redis::{RedisKeyValue, RedisManager};
use sqlite::SqliteManager;
use tauri::Manager;

mod ob;
mod redis;
mod sqlite;

#[derive(Default)]
struct AppState {
    sqlite_manager: SqliteManager,
    redis_manager: Mutex<RedisManager>,
}

fn init_database(sqlite_manager: &SqliteManager) -> Result<(), Box<dyn std::error::Error>> {
    sqlite_manager.init_table::<Connection>()?;
    Ok(())
}

#[tauri::command]
fn create_connection(
    app_handler: tauri::AppHandle,
    uri: String,
    name: String,
    color: String,
) -> Result<i64, String> {
    let state = app_handler.state::<AppState>();

    let connection = Connection {
        id: 0,
        uri_connection: uri,
        name,
        color,
    };

    state
        .sqlite_manager
        .insert(&connection)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_connection(app_handler: tauri::AppHandle, id: i64) -> Result<Option<Connection>, String> {
    let state = app_handler.state::<AppState>();

    state
        .sqlite_manager
        .get_by_id(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_connection(app_handler: tauri::AppHandle, entity: Connection) -> Result<(), String> {
    let state = app_handler.state::<AppState>();

    state
        .sqlite_manager
        .update(&entity)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_connection(app_handler: tauri::AppHandle, id: i64) -> Result<(), String> {
    let state = app_handler.state::<AppState>();

    state
        .sqlite_manager
        .delete::<Connection>(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn list_connection(app_handler: tauri::AppHandle) -> Result<Vec<Connection>, String> {
    let state = app_handler.state::<AppState>();

    state.sqlite_manager.list().map_err(|e| e.to_string())
}

#[tauri::command]
fn connect_redis(app_handler: tauri::AppHandle, id: i64, uri: String) -> Result<(), String> {
    let state = app_handler.state::<AppState>();
    let mut redis_manager = state.redis_manager.lock().unwrap();

    redis_manager.connect(id, &uri).map_err(|e| e.to_string())
}

#[tauri::command]
fn disconnect_redis(app_handler: tauri::AppHandle, id: i64) {
    let state = app_handler.state::<AppState>();
    let mut redis_manager = state.redis_manager.lock().unwrap();

    redis_manager.disconnect(id);
}

#[tauri::command]
fn get_redis_keys(
    app_handler: tauri::AppHandle,
    id: i64,
    pattern: String,
) -> Result<Vec<String>, String> {
    let state = app_handler.state::<AppState>();
    let redis_manager = state.redis_manager.lock().unwrap();

    redis_manager
        .get_keys(id, &pattern)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_redis_key_info(
    app_handler: tauri::AppHandle,
    id: i64,
    key: String,
) -> Result<Option<RedisKeyValue>, String> {
    let state = app_handler.state::<AppState>();
    let redis_manager = state.redis_manager.lock().unwrap();

    redis_manager
        .get_key_info(id, &key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_redis_key(
    app_handler: tauri::AppHandle,
    id: i64,
    key: String,
    value: String,
) -> Result<(), String> {
    let state = app_handler.state::<AppState>();
    let redis_manager = state.redis_manager.lock().unwrap();

    redis_manager
        .set_key(id, &key, &value)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_redis_key(app_handler: tauri::AppHandle, id: i64, key: String) -> Result<(), String> {
    let state = app_handler.state::<AppState>();
    let redis_manager = state.redis_manager.lock().unwrap();

    redis_manager
        .delete_key(id, &key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_redis_ttl(
    app_handler: tauri::AppHandle,
    id: i64,
    key: String,
    ttl: i64,
) -> Result<(), String> {
    let state = app_handler.state::<AppState>();
    let redis_manager = state.redis_manager.lock().unwrap();

    redis_manager
        .set_ttl(id, &key, ttl)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let sqlite_manager = SqliteManager::new().unwrap();
    let redis_manager = RedisManager::new();

    if let Err(e) = init_database(&sqlite_manager) {
        error!("Failed to initialize database: {}", e);
        std::process::exit(1);
    }

    tauri::Builder::default()
        .manage(AppState {
            sqlite_manager,
            redis_manager: Mutex::new(redis_manager),
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            create_connection,
            get_connection,
            update_connection,
            delete_connection,
            list_connection,
            connect_redis,
            disconnect_redis,
            get_redis_keys,
            get_redis_key_info,
            set_redis_key,
            delete_redis_key,
            set_redis_ttl
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
