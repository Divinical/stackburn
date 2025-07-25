// src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod burn_score;
mod scanners;

use tauri::Manager;

fn init_plugins() -> tauri::Builder<tauri::Wry> {
    println!("Initializing Tauri plugins...");
    let mut builder = tauri::Builder::default();

    // Initialize shell plugin
    match std::panic::catch_unwind(|| tauri_plugin_shell::init()) {
        Ok(plugin) => {
            println!("✓ Shell plugin initialized successfully");
            builder = builder.plugin(plugin);
        }
        Err(e) => {
            eprintln!("✗ Shell plugin failed to initialize: {:?}", e);
            eprintln!("  App will continue without shell functionality");
        }
    }

    // Initialize fs plugin
    match std::panic::catch_unwind(|| tauri_plugin_fs::init()) {
        Ok(plugin) => {
            println!("✓ File system plugin initialized successfully");
            builder = builder.plugin(plugin);
        }
        Err(e) => {
            eprintln!("✗ File system plugin failed to initialize: {:?}", e);
            eprintln!("  App will continue with limited file access");
        }
    }

    // Initialize dialog plugin
    match std::panic::catch_unwind(|| tauri_plugin_dialog::init()) {
        Ok(plugin) => {
            println!("✓ Dialog plugin initialized successfully");
            builder = builder.plugin(plugin);
        }
        Err(e) => {
            eprintln!("✗ Dialog plugin failed to initialize: {:?}", e);
            eprintln!("  App will continue without native dialogs");
        }
    }

    // Initialize http plugin
    match std::panic::catch_unwind(|| tauri_plugin_http::init()) {
        Ok(plugin) => {
            println!("✓ HTTP plugin initialized successfully");
            builder = builder.plugin(plugin);
        }
        Err(e) => {
            eprintln!("✗ HTTP plugin failed to initialize: {:?}", e);
            eprintln!("  App will continue without HTTP client functionality");
        }
    }

    println!("Plugin initialization complete");
    builder
}

fn main() {
    println!("=== TAURI MINIMAL TEST ===");

    init_plugins()
        .setup(|app| {
            println!("=== TAURI V2 DEBUG SETUP ===");
            
            // Safely get current directory
            match std::env::current_dir() {
                Ok(dir) => println!("Current directory: {:?}", dir),
                Err(e) => eprintln!("Failed to get current directory: {}", e),
            }
            
            // Safely get app data directory
            match app.path().app_data_dir() {
                Ok(dir) => println!("App data directory: {:?}", dir),
                Err(e) => eprintln!("Failed to get app data directory: {}", e),
            }
            
            // Check if dist files exist and can be read
            let dist_path = std::path::Path::new("../dist");
            println!("Dist directory exists: {}", dist_path.exists());
            if dist_path.exists() {
                match std::fs::read_dir(dist_path) {
                    Ok(entries) => {
                        let files: Result<Vec<_>, _> = entries.collect();
                        match files {
                            Ok(files) => {
                                let names: Vec<_> = files.iter().map(|e| e.file_name()).collect();
                                println!("Dist contents: {:?}", names);
                            }
                            Err(e) => eprintln!("Failed to read dist directory contents: {}", e),
                        }
                    }
                    Err(e) => eprintln!("Failed to open dist directory: {}", e),
                }
                
                // Check if index.html can be read
                let index_path = dist_path.join("index.html");
                if index_path.exists() {
                    println!("index.html exists: {}", index_path.display());
                    match std::fs::read_to_string(&index_path) {
                        Ok(content) => println!("index.html content length: {} chars", content.len()),
                        Err(e) => eprintln!("Failed to read index.html: {}", e),
                    }
                } else {
                    eprintln!("WARNING: index.html not found at {:?}", index_path);
                }
            } else {
                eprintln!("WARNING: Dist directory not found at {:?}", dist_path);
                eprintln!("  Make sure to run 'npm run build' before starting the Tauri app");
            }

            // Try to get the window and enable dev tools
            match app.get_webview_window("main") {
                Some(window) => {
                    println!("Window found: {:?}", window.label());
                    match window.url() {
                        Ok(url) => println!("Window URL: {:?}", url),
                        Err(e) => eprintln!("Failed to get window URL: {}", e),
                    }
                    
                    #[cfg(debug_assertions)]
                    {
                        println!("Opening dev tools...");
                        window.open_devtools();
                    }
                }
                None => {
                    eprintln!("WARNING: No main window found!");
                    eprintln!("  This may indicate a frontend loading issue");
                }
            }

            println!("=== TAURI V2 DEBUG SETUP COMPLETE ===");
            println!("Setup complete - letting Tauri handle frontend loading");
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            eprintln!("✗ CRITICAL: Tauri application failed to start: {:?}", e);
            eprintln!("  This is likely due to:");
            eprintln!("  - Missing or corrupted frontend files");
            eprintln!("  - Plugin initialization failures");
            eprintln!("  - System compatibility issues");
            std::process::exit(1);
        });
}
