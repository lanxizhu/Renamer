mod global_shortcut;
// mod menu;
mod single_instance;
mod splash_screen;
mod theme;
mod tray;
mod window;
mod window_state;

use std::sync::Mutex;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // This should be called as early in the execution of the app as possible
    #[cfg(debug_assertions)] // only enable instrumentation in development builds
    let devtools = tauri_plugin_devtools::init();

    let mut builder = tauri::Builder::default();

    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(devtools);
    }

    builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // menu::init(app).unwrap();
            tray::init(app).unwrap();
            // splash_screen::init(app).unwrap();
            global_shortcut::init(app).unwrap();
            theme::init(app);

            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let handle = app.handle().clone();
                let window = handle.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(window_state::build())
        .plugin(single_instance::init())
        .plugin(global_shortcut::build())
        .manage(Mutex::new(splash_screen::SetupState {
            frontend_task: false,
            backend_task: false,
        }))
        .on_window_event(window::event)
        .invoke_handler(tauri::generate_handler![greet, splash_screen::set_complete])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
