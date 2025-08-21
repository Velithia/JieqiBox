// src/lib.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(clippy::uninlined_format_args)]

use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri::{AppHandle, Emitter};
use std::sync::{Arc, Mutex};
use tauri::async_runtime;
use std::process::Command;
use encoding_rs::GBK;
use std::path::Path;
use std::fs;
use base64::Engine;
#[cfg(target_os = "android")]
use std::os::unix::fs::PermissionsExt;

// -------------------------------------------------------------
// type definition for the engine process state
type EngineProcess = Arc<Mutex<Option<CommandChild>>>;
// -------------------------------------------------------------

/// Check if the engine file exists and is a file on Android.
/// This is a prerequisite for setting permissions and spawning.
#[cfg(target_os = "android")]
fn check_android_engine_file(path: &str) -> Result<(), String> {
    let engine_path = Path::new(path);
    
    // Check if file exists at the given path
    if !engine_path.exists() {
        return Err(format!("Engine file not found: {}", path));
    }
    
    // Check if the path points to a file, not a directory
    if let Ok(metadata) = fs::metadata(engine_path) {
        if !metadata.is_file() {
            return Err(format!("Path is not a file: {}", path));
        }
    } else {
        // This can happen if we lack permissions to read metadata
        return Err(format!("Cannot access engine file metadata: {}", path));
    }
    Ok(())
}

/// Copy a file from a user-accessible directory to the app's internal storage.
/// Used for the legacy engine scanning mechanism.
#[cfg(target_os = "android")]
fn copy_file_to_internal_storage(source_path_str: &str, app_handle: &AppHandle) -> Result<String, String> {
    let source_path = Path::new(source_path_str);
    if !source_path.exists() {
        let error_msg = format!("Source file not found: {}", source_path.display());
        let _ = app_handle.emit("engine-output", format!("[DEBUG] {}", error_msg));
        return Err(error_msg);
    }

    // Use dynamic bundle identifier for a robust internal storage path
    let bundle_identifier = &app_handle.config().identifier;
    let internal_dir = format!("/data/data/{}/files/engines", bundle_identifier);
    if let Err(e) = fs::create_dir_all(&internal_dir) {
        let error_msg = format!("Failed to create internal directory: {}", e);
        let _ = app_handle.emit("engine-output", format!("[DEBUG] {}", error_msg));
        return Err(error_msg);
    }

    // Generate destination path using the original filename
    let filename = source_path.file_name()
        .ok_or_else(|| "Invalid source path".to_string())?
        .to_str()
        .ok_or_else(|| "Invalid filename encoding".to_string())?;
    let dest_path_str = format!("{}/{}", internal_dir, filename);
    let dest_path = Path::new(&dest_path_str);

    let _ = app_handle.emit("engine-output", format!("[DEBUG] Copying file from {} to {}", source_path.display(), dest_path.display()));

    // Copy the file
    if let Err(e) = fs::copy(source_path, dest_path) {
        let error_msg = format!("Failed to copy file: {}", e);
        let _ = app_handle.emit("engine-output", format!("[DEBUG] {}", error_msg));
        return Err(error_msg);
    }

    let _ = app_handle.emit("engine-output", "[DEBUG] Setting executable permission...");
    
    // Set executable permissions (rwxr-xr-x) which is crucial on Android/Linux
    match fs::metadata(dest_path) {
        Ok(metadata) => {
            let mut permissions = metadata.permissions();
            // Set permissions to 0o755
            permissions.set_mode(0o755);   

            if let Err(e) = fs::set_permissions(dest_path, permissions) {
                let error_msg = format!("Failed to set executable permission: {}", e);
                let _ = app_handle.emit("engine-output", format!("[DEBUG] {}", error_msg));
                return Err(error_msg);
            }
        },
        Err(e) => {
            let error_msg = format!("Failed to get metadata for setting permissions: {}", e);
            let _ = app_handle.emit("engine-output", format!("[DEBUG] {}", error_msg));
            return Err(error_msg);
        }
    }
    
    let _ = app_handle.emit("engine-output", format!("[DEBUG] Successfully copied and made executable: {}", dest_path.display()));
    Ok(dest_path_str)
}

/// Save game notation to Android's external, user-accessible storage.
#[tauri::command]
async fn save_game_notation(content: String, filename: String, app: AppHandle) -> Result<String, String> {
    if !cfg!(target_os = "android") {
        return Err("This function is only available on Android".to_string());
    }

    // Use dynamic bundle identifier for external storage path
    let bundle_identifier = &app.config().identifier;
    let external_dir = format!("/storage/emulated/0/Android/data/{}/files/notations", bundle_identifier);
    
    // Create the "notations" directory if it doesn't exist
    if let Err(e) = fs::create_dir_all(&external_dir) {
        let error_msg = format!("Failed to create notations directory: {}", e);
        return Err(error_msg);
    }

    // Generate the full file path for the new notation file
    let file_path_str = format!("{}/{}", external_dir, filename);
    let file_path = Path::new(&file_path_str);

    // Write the provided content to the file
    if let Err(e) = fs::write(file_path, content) {
        let error_msg = format!("Failed to write notation file: {}", e);
        return Err(error_msg);
    }

    Ok(file_path_str)
}

/// Save chart image to Android's external, user-accessible storage.
#[tauri::command]
async fn save_chart_image(content: String, filename: String, app: AppHandle) -> Result<String, String> {
    if !cfg!(target_os = "android") {
        return Err("This function is only available on Android".to_string());
    }

    // Use dynamic bundle identifier for external storage path
    let bundle_identifier = &app.config().identifier;
    let external_dir = format!("/storage/emulated/0/Android/data/{}/files/charts", bundle_identifier);
    
    // Create the "charts" directory if it doesn't exist
    if let Err(e) = fs::create_dir_all(&external_dir) {
        let error_msg = format!("Failed to create charts directory: {}", e);
        return Err(error_msg);
    }

    // Decode base64 content
    let cleaned_content = content.replace("data:image/png;base64,", "");
    let decoded_content = match base64::engine::general_purpose::STANDARD.decode(&cleaned_content) {
        Ok(data) => data,
        Err(e) => return Err(format!("Failed to decode image data: {}", e)),
    };

    // Generate the full file path for the new chart image file
    let file_path_str = format!("{}/{}", external_dir, filename);
    let file_path = Path::new(&file_path_str);

    // Write the provided content to the file
    if let Err(e) = fs::write(file_path, decoded_content) {
        let error_msg = format!("Failed to write chart image file: {}", e);
        return Err(error_msg);
    }

    Ok(file_path_str)
}

/// Get the path to the configuration file, which varies by platform.
fn get_config_file_path(app: &AppHandle) -> Result<String, String> {
    if cfg!(target_os = "android") {
        // On Android, use the app's private internal data directory
        let bundle_identifier = &app.config().identifier;
        Ok(format!("/data/data/{}/files/config.ini", bundle_identifier))
    } else {
        // On desktop, for simplicity, use the same directory as the executable
        Ok("config.ini".to_string())
    }
}

/// Get the path to the autosave file, which varies by platform.
fn get_autosave_file_path(app: &AppHandle) -> Result<String, String> {
    if cfg!(target_os = "android") {
        // On Android, use the app's private internal data directory
        let bundle_identifier = &app.config().identifier;
        Ok(format!("/data/data/{}/files/Autosave.json", bundle_identifier))
    } else {
        // On desktop, use the same directory as the config file
        Ok("Autosave.json".to_string())
    }
}

/// Load configuration from the config file.
#[tauri::command]
async fn load_config(app: AppHandle) -> Result<String, String> {
    let config_path = get_config_file_path(&app)?;
    let path = Path::new(&config_path);
    
    if !path.exists() {
        // If the config file doesn't exist, return an empty string, which is valid
        return Ok(String::new());
    }
    
    match fs::read_to_string(path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read config file: {}", e)),
    }
}

/// Save configuration content to the config file.
#[tauri::command]
async fn save_config(content: String, app: AppHandle) -> Result<(), String> {
    let config_path = get_config_file_path(&app)?;
    let path = Path::new(&config_path);
    
    // Ensure the parent directory exists before writing
    if let Some(parent) = path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return Err(format!("Failed to create config directory: {}", e));
        }
    }
    
    match fs::write(path, content) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write config file: {}", e)),
    }
}

/// Clear (delete) the configuration file.
#[tauri::command]
async fn clear_config(app: AppHandle) -> Result<(), String> {
    let config_path = get_config_file_path(&app)?;
    let path = Path::new(&config_path);
    
    if path.exists() {
        match fs::remove_file(path) {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to delete config file: {}", e)),
        }
    } else {
        Ok(()) // File doesn't exist, so there's nothing to do
    }
}

/// Save game notation to autosave file.
#[tauri::command]
async fn save_autosave(content: String, app: AppHandle) -> Result<(), String> {
    let autosave_path = get_autosave_file_path(&app)?;
    let path = Path::new(&autosave_path);
    
    // Ensure the parent directory exists before writing
    if let Some(parent) = path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return Err(format!("Failed to create autosave directory: {}", e));
        }
    }
    
    match fs::write(path, content) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write autosave file: {}", e)),
    }
}

/// Load game notation from autosave file.
#[tauri::command]
async fn load_autosave(app: AppHandle) -> Result<String, String> {
    let autosave_path = get_autosave_file_path(&app)?;
    let path = Path::new(&autosave_path);
    
    if !path.exists() {
        // If the autosave file doesn't exist, return an empty string
        return Ok(String::new());
    }
    
    match fs::read_to_string(path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read autosave file: {}", e)),
    }
}

/// Get the path to the user-accessible engine directory for manual placement.
#[cfg(target_os = "android")]
fn get_user_engine_directory() -> String {
    "/storage/emulated/0/jieqibox/engines".to_string()
}

/// Scans user-facing directories for engines, copies them to internal storage,
/// and then returns a list of all engines available in internal storage.
#[cfg(target_os = "android")]
fn sync_and_list_engines(app_handle: &AppHandle) -> Result<Vec<String>, String> {
    let bundle_identifier = &app_handle.config().identifier;
    let source_dirs = vec![
        get_user_engine_directory(),
        format!("/storage/emulated/0/Android/data/{}/files/engines", bundle_identifier),
    ];
    let internal_dir_str = format!("/data/data/{}/files/engines", bundle_identifier);
    
    let _ = app_handle.emit("engine-output", format!("[DEBUG] Syncing engines. Internal dir: {}. Source dirs: {:?}", internal_dir_str, source_dirs));
    
    // Ensure the internal engine directory exists
    if let Err(e) = fs::create_dir_all(&internal_dir_str) {
        let error_msg = format!("Failed to create internal directory '{}': {}", internal_dir_str, e);
        let _ = app_handle.emit("engine-output", format!("[DEBUG] {}", error_msg));
        return Err(error_msg);
    } else {
        let _ = app_handle.emit("engine-output", format!("[DEBUG] Internal directory created/exists: {}", internal_dir_str));
    }

    // Iterate over all possible source directories
    for user_dir in &source_dirs {
        let _ = app_handle.emit("engine-output", format!("[DEBUG] Checking source directory: {}", user_dir));
        let user_path = Path::new(user_dir);

        if !user_path.exists() {
            let _ = app_handle.emit("engine-output", format!("[DEBUG] Source directory does not exist, skipping: {}", user_dir));
            continue;
        }

        if let Ok(entries) = fs::read_dir(user_path) {
            for entry_result in entries {
                if let Ok(entry) = entry_result {
                    let path = entry.path();
                    if path.is_file() {
                        if let Err(e) = copy_file_to_internal_storage(path.to_str().unwrap_or(""), app_handle) {
                            let _ = app_handle.emit("engine-output", format!("[DEBUG] Failed to copy file {}: {}", path.display(), e));
                        }
                    }
                }
            }
        }
    }

    // List all files in the internal directory and return their full paths
    let mut available_engines = Vec::new();
    if let Ok(entries) = fs::read_dir(&internal_dir_str) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(path_str) = path.to_str() {
                    available_engines.push(path_str.to_string());
                }
            }
        }
    }
    
    let _ = app_handle.emit("engine-output", format!("[DEBUG] Available internal engines: {:?}", available_engines));
    Ok(available_engines)
}

/// Explicitly kills the currently running engine process, if any.
#[tauri::command]
async fn kill_engine(process_state: tauri::State<'_, EngineProcess>) -> Result<(), String> {
    if let Some(child) = process_state.lock().unwrap().take() {
        let _ = child.kill();
    }
    Ok(())
}

/// Spawns a new engine process with a given path and arguments.
#[tauri::command]
async fn spawn_engine(
    path: String,
    args: Vec<String>,
    app: AppHandle,
    process_state: tauri::State<'_, EngineProcess>,
) -> Result<(), String> {
    if cfg!(target_os = "android") {
        let _ = app.emit("engine-output", format!("[DEBUG] Spawning engine: Path={}, Args={:?}", path, args));
    }
    
    // The path must be an absolute, accessible file path
    let final_path = path;

    #[cfg(target_os = "android")]
    {
        if let Err(e) = check_android_engine_file(&final_path) {
            let _ = app.emit("engine-output", format!("[DEBUG] Engine file validation failed: {}", e));
            return Err(e);
        }
        let _ = app.emit("engine-output", "[DEBUG] Engine file validation passed.");
    }
    
    // Ensure any previous engine process is terminated before starting a new one
    kill_engine(process_state.clone()).await.ok();
    
    // The engine's working directory should be its parent directory
    let engine_dir = Path::new(&final_path)
        .parent()
        .ok_or_else(|| "Failed to get engine directory".to_string())?
        .to_str()
        .ok_or_else(|| "Failed to convert engine directory to string".to_string())?;
    
    // Spawn the new process
    let (mut rx, child) = match app.shell().command(&final_path)
        .args(args)
        .current_dir(engine_dir)
        .spawn() 
    {
        Ok(result) => result,
        Err(e) => {
            let error_msg = format!("Failed to spawn engine: {}", e);
            if cfg!(target_os = "android") {
                let _ = app.emit("engine-output", format!("[DEBUG] {}", error_msg));
            }
            return Err(error_msg);
        }
    };

    // Store the new child process in the shared state
    *process_state.lock().unwrap() = Some(child);
    
    // Spawn an async task to listen for the engine's stdout/stderr
    let app_clone = app.clone();
    async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stdout(buf) | CommandEvent::Stderr(buf) = event {
                // Decode output using GBK for Windows, UTF-8 for others
                let text = if cfg!(target_os = "windows") {
                    let (cow, ..) = GBK.decode(&buf);
                    cow.into_owned()
                } else {
                    String::from_utf8_lossy(&buf).into_owned()
                };
                let _ = app_clone.emit("engine-output", text);
            }
        }
    });

    Ok(())
}

/// Sends a command string to the running engine process.
#[tauri::command]
async fn send_to_engine(
    command: String,
    process_state: tauri::State<'_, EngineProcess>,
) -> Result<(), String> {
    if let Some(child) = process_state.lock().unwrap().as_mut() {
        child
            .write(format!("{}\n", command).as_bytes())
            .map_err(|e| format!("Failed to write to engine: {}", e))?;
        Ok(())
    } else {
        Err("Engine not running.".into())
    }
}

/// Get the path to a directory where users can manually place engines.
#[cfg(target_os = "android")]
#[tauri::command]
async fn get_default_android_engine_path() -> Result<String, String> {
    Ok(get_user_engine_directory())
}

/// Check file permissions on Android.
#[cfg(target_os = "android")]
#[tauri::command]
async fn check_android_file_permissions(path: String) -> Result<bool, String> {
    if let Ok(metadata) = fs::metadata(Path::new(&path)) {
        Ok(metadata.is_file())
    } else {
        Ok(false)
    }
}

/// Get the app's bundle identifier (package name).
#[cfg(target_os = "android")]
#[tauri::command]
async fn get_bundle_identifier(app: AppHandle) -> Result<String, String> {
    Ok(app.config().identifier.clone())
}

/// Scan for engines available for the app to use.
#[cfg(target_os = "android")]
#[tauri::command]
async fn scan_android_engines(app: AppHandle) -> Result<Vec<String>, String> {
    sync_and_list_engines(&app)
}

/// Emits an event to the Android native side to request a file via SAF.
#[cfg(target_os = "android")]
#[tauri::command]
async fn request_saf_file_selection(name: String, args: String, has_nnue: bool, app: AppHandle) -> Result<(), String> {
    // This command's only job is to forward the request to the native layer
    let _ = app.emit("request-saf-file-selection", serde_json::json!({
        "name": name,
        "args": args,
        "has_nnue": has_nnue
    }));
    Ok(())
}

/// Handles the result from the SAF file picker, after the native code has
/// copied the selected file to a temporary, accessible location.
#[cfg(target_os = "android")]
#[tauri::command]
async fn handle_saf_file_result(
    temp_file_path: String, // IMPORTANT: This must be a real file path, not a content:// URI
    filename: String,
    name: String,
    args: String,
    has_nnue: bool,
    app: AppHandle,
) -> Result<(), String> {
    let _ = app.emit("engine-output", format!("[DEBUG] SAF result for engine '{}': TempPath={}, Filename={}", name, temp_file_path, filename));

    if temp_file_path.is_empty() {
        return Err("SAF file processing failed: temporary path is empty.".to_string());
    }

    // Generate a unique identifier for this specific engine instance to be used as the directory name.
    // This prevents conflicts if an engine file and a desired directory have the same name,
    // and also allows adding the same engine multiple times.
    let engine_instance_id = format!("{}_{}", name, chrono::Utc::now().timestamp_millis());

    // Define the final destination directory for the engine using the unique ID.
    let bundle_identifier = &app.config().identifier;
    let engine_base_dir = format!("/data/data/{}/files/engines/{}", bundle_identifier, &engine_instance_id);

    // Create the engine-specific directory
    if let Err(e) = fs::create_dir_all(&engine_base_dir) {
        let error_msg = format!("Failed to create final engine directory: {}", e);
        let _ = app.emit("engine-output", format!("[DEBUG] {}", error_msg));
        return Err(error_msg);
    }
    
    // Define the final path for the engine executable
    let final_path_str = format!("{}/{}", engine_base_dir, &filename);

    // Move the file from the temporary location to the final destination
    if let Err(e) = fs::rename(&temp_file_path, &final_path_str) {
        let error_msg = format!("Failed to move engine file from temp to final destination: {}", e);
        let _ = app.emit("engine-output", format!("[DEBUG] {}", error_msg));
        // Fallback to copy if rename fails (e.g., cross-device link)
        if let Err(copy_err) = fs::copy(&temp_file_path, &final_path_str) {
             let copy_error_msg = format!("Fallback copy also failed: {}", copy_err);
             let _ = app.emit("engine-output", format!("[DEBUG] {}", copy_error_msg));
             return Err(copy_error_msg);
        } else {
            // Copy succeeded, remove the original temp file
            let _ = fs::remove_file(&temp_file_path);
        }
    }

    // Set executable permission on the final file
    let final_path = Path::new(&final_path_str);
    let mut perms = fs::metadata(final_path).map_err(|e| e.to_string())?.permissions();
    perms.set_mode(0o755);
    fs::set_permissions(final_path, perms).map_err(|e| e.to_string())?;

    // Handle NNUE file if requested
    if has_nnue {
        let _ = app.emit("engine-output", "[DEBUG] Engine requires NNUE file, requesting file selection...");
        
        // Request NNUE file selection from the frontend
        let nnue_request_data = serde_json::json!({
            "engine_name": name,
            "engine_path": final_path_str,
            "args": args,
            "engine_instance_id": engine_instance_id
        });
        
        // Store the engine data temporarily and request NNUE file
        app.emit("request-nnue-file", nnue_request_data).map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create the ManagedEngine object to send back to the frontend
    let new_engine_data = serde_json::json!({
        "id": format!("engine_{}", chrono::Utc::now().timestamp_millis()),
        "name": name,
        "path": final_path_str,
        "args": args
    });

    // Notify the frontend that the engine has been successfully added
    app.emit("android-engine-added", new_engine_data).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Handle NNUE file result from SAF file selection
#[cfg(target_os = "android")]
#[tauri::command]
async fn handle_nnue_file_result(
    temp_file_path: String,
    filename: String,
    engine_name: String,
    engine_path: String,
    args: String,
    engine_instance_id: String,
    app: AppHandle,
) -> Result<(), String> {
    let _ = app.emit("engine-output", format!("[DEBUG] NNUE file result for engine '{}': TempPath={}, Filename={}", engine_name, temp_file_path, filename));

    if temp_file_path.is_empty() {
        return Err("NNUE file processing failed: temporary path is empty.".to_string());
    }

    // Get the engine directory path
    let bundle_identifier = &app.config().identifier;
    let engine_base_dir = format!("/data/data/{}/files/engines/{}", bundle_identifier, &engine_instance_id);

    // Define the final path for the NNUE file in the same directory as the engine
    let final_nnue_path_str = format!("{}/{}", engine_base_dir, &filename);

    // Move the NNUE file from the temporary location to the final destination
    if let Err(e) = fs::rename(&temp_file_path, &final_nnue_path_str) {
        let error_msg = format!("Failed to move NNUE file from temp to final destination: {}", e);
        let _ = app.emit("engine-output", format!("[DEBUG] {}", error_msg));
        // Fallback to copy if rename fails (e.g., cross-device link)
        if let Err(copy_err) = fs::copy(&temp_file_path, &final_nnue_path_str) {
             let copy_error_msg = format!("Fallback copy also failed: {}", copy_err);
             let _ = app.emit("engine-output", format!("[DEBUG] {}", copy_error_msg));
             return Err(copy_error_msg);
        } else {
            // Copy succeeded, remove the original temp file
            let _ = fs::remove_file(&temp_file_path);
        }
    }

    let _ = app.emit("engine-output", format!("[DEBUG] NNUE file successfully copied to: {}", final_nnue_path_str));

    // Create the ManagedEngine object to send back to the frontend
    let new_engine_data = serde_json::json!({
        "id": format!("engine_{}", chrono::Utc::now().timestamp_millis()),
        "name": engine_name,
        "path": engine_path,
        "args": args
    });

    // Notify the frontend that the engine has been successfully added
    app.emit("android-engine-added", new_engine_data).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Opens a URL in the system's default browser.
#[tauri::command]
async fn open_external_url(url: String, app: AppHandle) -> Result<(), String> {
    let result = if cfg!(target_os = "windows") {
        Command::new("cmd").args(["/C", "start", &url]).spawn()
    } else if cfg!(target_os = "macos") {
        Command::new("open").arg(&url).spawn()
    } else if cfg!(target_os = "android") {
        // On Android, delegate to the native layer
        let _ = app.emit("open-external-url", url);
        return Ok(());
    } else {
        // Linux
        Command::new("xdg-open").arg(&url).spawn()
    };

    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open URL: {}", e))
    }
}

// The main entry point for the Tauri application.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Arc::new(Mutex::new(None)) as EngineProcess)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            spawn_engine, 
            kill_engine,
            send_to_engine, 
            open_external_url,
            save_game_notation,
            save_chart_image,
            load_config,
            save_config,
            clear_config,
            save_autosave,
            load_autosave,
            // Android-specific commands
            #[cfg(target_os = "android")]
            get_bundle_identifier,
            #[cfg(target_os = "android")]
            get_default_android_engine_path,
            #[cfg(target_os = "android")]
            check_android_file_permissions,
            #[cfg(target_os = "android")]
            scan_android_engines,
            #[cfg(target_os = "android")]
            request_saf_file_selection,
            #[cfg(target_os = "android")]
            handle_saf_file_result,
            #[cfg(target_os = "android")]
            handle_nnue_file_result
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}