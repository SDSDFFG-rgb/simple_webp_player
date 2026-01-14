#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use eframe::egui;
use std::time::{Duration, Instant};
use webp_animation::Decoder;
use image::ImageFormat;
use std::sync::mpsc::{channel, Receiver};
use std::thread;

// --- データ構造 ---

#[derive(Clone)]
struct FrameData {
    texture: egui::TextureHandle,
    duration: Duration,
}

struct LoadedFrame {
    width: u32,
    height: u32,
    pixels: Vec<u8>,
    timestamp_ms: i32,
}

struct WebpPlayer {
    frames: Vec<FrameData>,
    
    rx: Option<Receiver<LoadedFrame>>,
    is_loading: bool,

    raw_static_image: Option<image::DynamicImage>,
    current_file_path: Option<std::path::PathBuf>,

    current_frame_idx: usize,
    last_frame_time: Instant,
    
    is_playing: bool,
    is_looping: bool,
    speed_multiplier: f32,
    
    show_help: bool,
    resize_requested: Option<egui::Vec2>,
    image_view_state: ImageViewState,
}

struct ImageViewState {
    scale: f32,
    offset: egui::Vec2,
    fit_to_window: bool,
}
impl Default for ImageViewState {
    fn default() -> Self { Self { scale: 1.0, offset: egui::Vec2::ZERO, fit_to_window: true } }
}

fn main() -> eframe::Result {
    // アイコン読み込み（icon.pngがCargo.tomlと同じ階層にある前提）
    let icon = load_icon();
    
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([800.0, 600.0])
            .with_drag_and_drop(true)
            .with_icon(icon)
            .with_position(egui::pos2(100.0, 100.0)),
        ..Default::default()
    };

    eframe::run_native(
        "WebP Player", // アプリ名
        options,
        Box::new(|cc| {
            let mut app = WebpPlayer::new();
            let args: Vec<String> = std::env::args().collect();
            if args.len() > 1 {
                let path = std::path::Path::new(&args[1]);
                app.load_webp_file(&cc.egui_ctx, path);
            }
            Ok(Box::new(app))
        }),
    )
}

impl WebpPlayer {
    fn new() -> Self {
        Self {
            frames: Vec::new(),
            rx: None,
            is_loading: false,
            raw_static_image: None,
            current_file_path: None,
            current_frame_idx: 0,
            last_frame_time: Instant::now(),
            is_playing: true,
            is_looping: true,
            speed_multiplier: 1.0,
            show_help: false,
            resize_requested: None,
            image_view_state: ImageViewState::default(),
        }
    }

    fn is_animated(&self) -> bool {
        self.frames.len() > 1 || self.is_loading
    }

    fn load_webp_file(&mut self, ctx: &egui::Context, path: &std::path::Path) {
        self.frames.clear();
        self.rx = None;
        self.is_loading = true;
        self.current_frame_idx = 0;
        self.raw_static_image = None;
        self.current_file_path = Some(path.to_path_buf());
        self.image_view_state = ImageViewState::default();

        let path_buf = path.to_path_buf();
        let ctx_clone = ctx.clone();

        // 1. メインスレッドで1フレーム目ロード
        if let Ok(buffer) = std::fs::read(&path_buf) {
            if let Ok(decoder) = Decoder::new(&buffer) {
                let mut iter = decoder.into_iter();
                if let Some(frame) = iter.next() {
                    if let Ok(img) = frame.into_image() {
                        let w = img.width();
                        let h = img.height();
                        let size = [w as usize, h as usize];
                        
                        self.raw_static_image = Some(image::DynamicImage::ImageRgba8(img.clone()));

                        let color_image = egui::ColorImage::from_rgba_unmultiplied(
                            size,
                            img.as_flat_samples().as_slice(),
                        );
                        let texture = ctx.load_texture("frame_0", color_image, egui::TextureOptions::LINEAR);
                        
                        self.frames.push(FrameData {
                            texture,
                            duration: Duration::from_millis(100),
                        });
                        
                        self.resize_requested = Some(egui::vec2(w as f32, h as f32 + 50.0));
                    }
                }
            }
        }

        // 2. バックグラウンドスレッドで残りをロード
        let (tx, rx) = channel();
        self.rx = Some(rx);

        thread::spawn(move || {
            if let Ok(buffer) = std::fs::read(&path_buf) {
                if let Ok(decoder) = Decoder::new(&buffer) {
                    let mut iter = decoder.into_iter();
                    iter.next(); 

                    for frame in iter {
                        let timestamp = frame.timestamp();
                        if let Ok(img) = frame.into_image() {
                             let w = img.width();
                             let h = img.height();
                             let pixels = img.into_flat_samples().as_slice().to_vec();
                             
                             let loaded = LoadedFrame {
                                 width: w,
                                 height: h,
                                 pixels,
                                 timestamp_ms: timestamp,
                             };
                             
                             if tx.send(loaded).is_err() { break; }
                             ctx_clone.request_repaint();
                        }
                    }
                }
            }
        });
    }

    fn process_incoming_frames(&mut self, ctx: &egui::Context) {
        if let Some(rx) = &self.rx {
            loop {
                match rx.try_recv() {
                    Ok(loaded_frame) => {
                        let size = [loaded_frame.width as usize, loaded_frame.height as usize];
                        let color_image = egui::ColorImage::from_rgba_unmultiplied(
                            size,
                            &loaded_frame.pixels,
                        );
                        
                        let texture = ctx.load_texture(
                            format!("frame_{}", self.frames.len()),
                            color_image,
                            egui::TextureOptions::LINEAR,
                        );
                        
                        self.frames.push(FrameData {
                            texture,
                            duration: Duration::from_millis(33),
                        });
                    }
                    Err(std::sync::mpsc::TryRecvError::Empty) => { break; }
                    Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                        self.is_loading = false;
                        self.rx = None;
                        break;
                    }
                }
            }
        }
    }
    
    fn save_current_image(&self, format: ImageFormat) {
        if let Some(img) = &self.raw_static_image {
            if let Some(path) = &self.current_file_path {
                let ext = match format { ImageFormat::Png => "png", ImageFormat::Jpeg => "jpg", _ => "dat" };
                let new_path = path.with_extension(ext);
                if let Err(e) = img.save(&new_path) { eprintln!("Err: {}", e); }
                else { println!("Saved {:?}", new_path); }
            }
        }
    }
}

impl eframe::App for WebpPlayer {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.process_incoming_frames(ctx);
        
        // --- リサイズ処理 ---
        if let Some(req_size) = self.resize_requested {
            let max_w = 1200.0; 
            let max_h = 900.0;
            let clamped_w = req_size.x.min(max_w).max(400.0);
            let clamped_h = req_size.y.min(max_h).max(300.0);

            ctx.send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(clamped_w, clamped_h)));
            ctx.send_viewport_cmd(egui::ViewportCommand::OuterPosition(egui::pos2(100.0, 100.0)));
            self.resize_requested = None;
        }

        // --- ファイルドロップ ---
        if !ctx.input(|i| i.raw.dropped_files.is_empty()) {
            if let Some(file) = ctx.input(|i| i.raw.dropped_files.first().cloned()) {
                if let Some(path) = &file.path { self.load_webp_file(ctx, path); }
            }
        }

        let is_anim = self.is_animated();

        // --- キーボード操作 ---
        if ctx.input(|i| i.key_pressed(egui::Key::Space)) { if is_anim { self.is_playing = !self.is_playing; } }
        if is_anim {
            if ctx.input(|i| i.key_pressed(egui::Key::Z)) {
                 if self.current_frame_idx > 0 { self.current_frame_idx -= 1; }
                 else if !self.frames.is_empty() { self.current_frame_idx = self.frames.len() - 1; }
                 self.is_playing = false;
            }
            if ctx.input(|i| i.key_pressed(egui::Key::X)) {
                 if !self.frames.is_empty() { self.current_frame_idx = (self.current_frame_idx + 1) % self.frames.len(); }
                 self.is_playing = false;
            }
        }
        if ctx.input(|i| i.key_pressed(egui::Key::H)) { self.show_help = !self.show_help; }

        // --- アニメーション進行 ---
        if is_anim && self.is_playing && !self.frames.is_empty() {
            let current_duration = self.frames[self.current_frame_idx].duration;
            let adjusted = Duration::from_secs_f32(current_duration.as_secs_f32() / self.speed_multiplier);
            
            if self.last_frame_time.elapsed() >= adjusted {
                let next_idx = self.current_frame_idx + 1;
                if next_idx >= self.frames.len() {
                    if self.is_loading { /* wait */ }
                    else if self.is_looping { self.current_frame_idx = 0; }
                    else { self.is_playing = false; }
                } else {
                    self.current_frame_idx = next_idx;
                }
                self.last_frame_time = Instant::now();
            }
            ctx.request_repaint();
        }

        // --- 操作パネル (Bottom) ---
        egui::TopBottomPanel::bottom("btm").resizable(false).min_height(50.0).show(ctx, |ui| {
            ui.add_space(5.0);
            ui.horizontal(|ui| {
                ui.add_space(10.0); // 左端のマージン

                // 左詰め配置：再生制御系
                if is_anim {
                    // 再生/停止
                    let icon = if self.is_playing { "⏸" } else { "▶" };
                    if ui.add(egui::Button::new(icon).min_size(egui::vec2(40.,30.))).clicked() {
                        self.is_playing = !self.is_playing;
                    }

                    // コマ戻し (Previous) - 機能修正済み
                    if ui.button("⏮").clicked() {
                        if self.current_frame_idx > 0 {
                            self.current_frame_idx -= 1;
                        } else if !self.frames.is_empty() {
                            self.current_frame_idx = self.frames.len() - 1;
                        }
                        self.is_playing = false;
                    }

                    // コマ送り (Next) - 機能修正済み
                    if ui.button("⏭").clicked() {
                        if !self.frames.is_empty() {
                            self.current_frame_idx = (self.current_frame_idx + 1) % self.frames.len();
                        }
                        self.is_playing = false;
                    }

                    // ループ設定
                    let loop_icon = if self.is_looping { "🔁 On" } else { "🔁 Off" };
                    if ui.add(egui::Button::new(loop_icon).selected(self.is_looping)).clicked() {
                        self.is_looping = !self.is_looping;
                    }

                    ui.label(format!("x{:.1}", self.speed_multiplier));
                    
                    if self.is_loading { ui.spinner(); }
                } else {
                    // 静止画保存ボタン
                    if ui.add(egui::Button::new("💾 PNG").min_size(egui::vec2(80.,30.))).clicked() { self.save_current_image(ImageFormat::Png); }
                    ui.add_space(10.0);
                    if ui.add(egui::Button::new("💾 JPG").min_size(egui::vec2(80.,30.))).clicked() { self.save_current_image(ImageFormat::Jpeg); }
                }

                // 右詰め配置：ヘルプとFPS
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    ui.add_space(10.0);
                    if ui.button("?").clicked() { self.show_help = !self.show_help; }
                    
                    if is_anim {
                        let fps = if let Some(f) = self.frames.get(self.current_frame_idx) {
                             if f.duration.as_secs_f32() > 0. { format!("{:.1} FPS", self.speed_multiplier/f.duration.as_secs_f32()) } else { "-".into() }
                        } else { "-".into() };
                        ui.label(egui::RichText::new(fps).color(egui::Color32::GRAY));
                    }
                });
            });
            ui.add_space(5.0);
        });

        // --- メイン表示エリア ---
        egui::CentralPanel::default().show(ctx, |ui| {
            let rect = ui.max_rect();
            ui.painter().rect_filled(rect, 0.0, egui::Color32::BLACK);

            if let Some(frame) = self.frames.get(self.current_frame_idx) {
                if is_anim {
                    // アニメーションモード (常にフィット)
                    let avail = ui.available_size();
                    let t_sz = frame.texture.size_vec2();
                    let sc = (avail.x/t_sz.x).min(avail.y/t_sz.y);
                    ui.centered_and_justified(|ui| {
                        ui.add(egui::Image::new(&frame.texture).fit_to_exact_size(t_sz * sc));
                    });
                    
                    let d = ctx.input(|i| i.raw_scroll_delta.y);
                    if d != 0. { 
                        if d > 0. { self.speed_multiplier += 0.1; } else { self.speed_multiplier = (self.speed_multiplier - 0.1).max(0.1); }
                    }
                } else {
                    // 静止画モード (ズーム/パン + 初期フィット)
                    let st = &mut self.image_view_state;
                    let avail = ui.available_size();
                    let t_sz = frame.texture.size_vec2();
                    
                    if st.fit_to_window {
                        let fit_scale = (avail.x / t_sz.x).min(avail.y / t_sz.y);
                        st.scale = if fit_scale < 1.0 { fit_scale } else { 1.0 };
                        st.fit_to_window = false;
                    }

                    let input = ctx.input(|i| i.clone());
                    if input.raw_scroll_delta.y != 0. {
                        st.scale *= if input.raw_scroll_delta.y > 0. { 1.1 } else { 0.9 };
                        st.scale = st.scale.clamp(0.01, 10.);
                    }
                    
                    let resp = ui.interact(rect, ui.id(), egui::Sense::drag());
                    if resp.dragged_by(egui::PointerButton::Primary) || resp.dragged_by(egui::PointerButton::Middle) {
                        st.offset += resp.drag_delta();
                    }
                    
                    let center = rect.center() + st.offset;
                    let img_rect = egui::Rect::from_center_size(center, t_sz * st.scale);
                    
                    ui.painter().image(frame.texture.id(), img_rect, egui::Rect::from_min_max(egui::pos2(0.,0.), egui::pos2(1.,1.)), egui::Color32::WHITE);
                }
            } else {
                ui.centered_and_justified(|ui| { ui.label("Drag & Drop WebP"); });
            }
        });

        if self.show_help {
            egui::Window::new("Help").show(ctx, |ui| {
                ui.label(if is_anim { "Animation Mode\nSpace: Play/Pause\nZ/X: Prev/Next Frame" } else { "Static Mode\nWheel: Zoom\nDrag: Pan" });
            });
        }
    }
}

// アイコンをコンパイル時にバイナリに埋め込む関数
fn load_icon() -> egui::IconData {
    // コンパイルには "../icon.png" (プロジェクトルートのicon.png) が必要です。
    // GitHubに公開する際は icon.png もリポジトリに含めてください。
    let icon_bytes = include_bytes!("../icon.png");
    let image = image::load_from_memory(icon_bytes)
        .expect("Failed to load icon.png from project root")
        .into_rgba8();
    let (width, height) = image.dimensions();
    egui::IconData {
        rgba: image.into_raw(),
        width,
        height,
    }
}