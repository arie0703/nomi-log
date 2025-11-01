mod db;
mod models;
mod error;
mod commands;

use db::Database;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // ログプラグインの設定
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // データベースの初期化
      let app_dir = app.path().app_data_dir().expect("Failed to get app data directory");
      std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");
      
      let db_path = app_dir.join("nomi-log.db");
      let database = Database::new(db_path).expect("Failed to initialize database");
      
      app.manage(Mutex::new(database));

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::get_posts,
      commands::create_post,
      commands::update_post,
      commands::delete_post,
      commands::get_categories,
      commands::create_category,
      commands::delete_category,
      commands::get_beverages,
      commands::get_beverages_by_category,
      commands::create_beverage,
      commands::update_beverage,
      commands::delete_beverage,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
