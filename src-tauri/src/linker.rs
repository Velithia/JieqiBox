// src-tauri/src/linker.rs
use tauri::AppHandle;
use std::{thread, time};
use enigo::{Enigo, MouseControllable, MouseButton}; 
use base64::{Engine as _, engine::general_purpose::STANDARD};
use std::io::Cursor;
use xcap::Window;
// image 0.25+
use image::{DynamicImage, Rgba, GenericImageView, ExtendedColorType}; 
use image::imageops::FilterType;
use std::cmp;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use once_cell::sync::OnceCell;

// ★★★ 优化：直接存 Raw RGB 数据，不存 JPEG ★★★
pub struct LatestCapture {
    pub buffer: Vec<u8>, // 存的是纯像素 RGBRGB...
    pub width: u32,
    pub height: u32,
    pub ts: Instant,
}

static LATEST_CAPTURE: OnceCell<Arc<Mutex<Option<LatestCapture>>>> = OnceCell::new();

fn get_latest_container() -> Arc<Mutex<Option<LatestCapture>>> {
    LATEST_CAPTURE
        .get_or_init(|| Arc::new(Mutex::new(None)))
        .clone()
}

/// 初始化后台抓取器：主进程启动时调用一次
#[tauri::command]
pub async fn init_capturer(window_id: u32, fps: u32) -> Result<(), String> {
    let container = get_latest_container();

    // 防止重复启动
    {
        let guard = container.lock().map_err(|e| e.to_string())?;
        if guard.is_some() {
            return Ok(());
        }
    }

    let window_id_clone = window_id;
    let container_clone = container.clone();
    
    thread::spawn(move || {
        let interval_ms = if fps == 0 { 50 } else { 1000 / fps } as u64; // 默认 20FPS (50ms)
        let mut last_log = Instant::now();

        loop {
            let start = Instant::now();
            
            // 查找并截图
            let mut captured = false;
            if let Ok(windows) = Window::all() {
                for window in windows {
                    if window.id() == window_id_clone {
                        if let Ok(image_buffer) = window.capture_image() {
                            let img = DynamicImage::ImageRgba8(image_buffer);
                            
                            let scaled = img.resize_exact(640, 640, FilterType::Triangle);
                            
                            let rgb_img = scaled.to_rgb8();
                            let width = rgb_img.width();
                            let height = rgb_img.height();
                            
                            // 4. 获取 Raw Bytes
                            let raw_pixels = rgb_img.into_raw();

                            let latest = LatestCapture {
                                buffer: raw_pixels,
                                width,
                                height,
                                ts: Instant::now(),
                            };

                            if let Ok(mut guard) = container_clone.lock() {
                                *guard = Some(latest);
                            }
                            captured = true;
                        }
                    }
                }
            }

            if last_log.elapsed().as_secs() > 5 {
                if !captured {
                    println!("[Rust Capturer] 警告：未找到窗口 {}", window_id_clone);
                } else {
                    println!("[Rust Capturer] 正在运行 (FPS目标: {})", fps);
                }
                last_log = Instant::now();
            }

            // 精确控制 FPS
            let elapsed = start.elapsed();
            if elapsed.as_millis() < interval_ms as u128 {
                thread::sleep(Duration::from_millis(interval_ms) - elapsed);
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn get_latest_capture_raw() -> Result<String, String> {
    let container = get_latest_container();
    if let Ok(guard) = container.lock() {
        if let Some(latest) = &*guard {
            let b64 = STANDARD.encode(&latest.buffer);
            return Ok(b64);
        }
    }
    Err("no capture yet".to_string())
}

// ---------------- 以下是辅助结构体和旧接口 (保持兼容) ----------------

#[derive(serde::Serialize, Clone)]
pub struct WindowInfo {
    id: u32,
    name: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    is_minimized: bool,
}

#[derive(serde::Serialize)]
pub struct CaptureResult {
    image_base64: String,
    width: u32,
    height: u32,
}

#[tauri::command]
pub async fn list_windows() -> Result<Vec<WindowInfo>, String> {
    let windows = Window::all().map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for window in windows {
        result.push(WindowInfo {
            id: window.id(),
            name: window.title().to_string(),
            x: window.x(),
            y: window.y(),
            width: window.width(),
            height: window.height(),
            is_minimized: window.is_minimized(),
        });
    }
    Ok(result)
}

#[tauri::command]
pub async fn get_window_info(window_id: u32) -> Result<WindowInfo, String> {
    let windows = Window::all().map_err(|e| e.to_string())?;
    for window in windows {
        if window.id() == window_id {
            return Ok(WindowInfo {
                id: window.id(),
                name: window.title().to_string(),
                x: window.x(),
                y: window.y(),
                width: window.width(),
                height: window.height(),
                is_minimized: window.is_minimized(),
            });
        }
    }
    Err("Window not found".to_string())
}

#[tauri::command]
pub async fn rust_log(msg: String) {
    println!("[Rust Log] {}", msg);
}

// 保留这个接口给 UI 显示用 (依然用 Base64/PNG)
#[tauri::command]
pub async fn capture_window(window_id: u32) -> Result<CaptureResult, String> {
    let windows = Window::all().map_err(|e| e.to_string())?;
    for window in windows {
        if window.id() == window_id {
            let image_buffer = window.capture_image().map_err(|e| e.to_string())?;
            let dynamic_image = DynamicImage::ImageRgba8(image_buffer);
            let width = dynamic_image.width();
            let height = dynamic_image.height();
            let rgb_image = dynamic_image.to_rgb8();
            let mut buffer = Vec::new();
            let mut cursor = Cursor::new(&mut buffer);
            rgb_image.write_to(&mut cursor, image::ImageFormat::Png).map_err(|e| e.to_string())?;
            let base64_string = STANDARD.encode(&buffer);
            return Ok(CaptureResult {
                image_base64: base64_string,
                width,
                height,
            });
        }
    }
    Err("Window not found".to_string())
}

#[tauri::command]
pub async fn simulate_move(from_x: i32, from_y: i32, to_x: i32, to_y: i32, click_delay_ms: u64, move_delay_ms: u64) -> Result<(), String> {
    println!("[Rust Linker] 模拟移动: ({}, {}) -> ({}, {})", from_x, from_y, to_x, to_y);
    let mut enigo = Enigo::new();
    enigo.mouse_move_to(from_x, from_y);
    thread::sleep(time::Duration::from_millis(20));
    enigo.mouse_down(MouseButton::Left);
    if click_delay_ms > 0 { thread::sleep(time::Duration::from_millis(click_delay_ms)); }
    enigo.mouse_up(MouseButton::Left);
    if move_delay_ms > 0 { thread::sleep(time::Duration::from_millis(move_delay_ms)); }
    enigo.mouse_move_to(to_x, to_y);
    thread::sleep(time::Duration::from_millis(20));
    enigo.mouse_down(MouseButton::Left);
    if click_delay_ms > 0 { thread::sleep(time::Duration::from_millis(click_delay_ms)); }
    enigo.mouse_up(MouseButton::Left);
    Ok(())
}

#[tauri::command]
pub async fn simulate_click(x: i32, y: i32, delay_ms: u64) -> Result<(), String> {
    let mut enigo = Enigo::new();
    enigo.mouse_move_to(x, y);
    thread::sleep(time::Duration::from_millis(20));
    enigo.mouse_down(MouseButton::Left);
    if delay_ms > 0 { thread::sleep(time::Duration::from_millis(delay_ms)); }
    enigo.mouse_up(MouseButton::Left);
    Ok(())
}
