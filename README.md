# Simple Webp Player

A lightweight, high-performance WebP player and viewer written in Rust.
It supports both **Animated WebP** (Video) and **Static WebP** (Image) files with a clean and simple interface.

![Rust](https://img.shields.io/badge/Made_with-Rust-orange?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-Windows-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

*   **Dual Mode Support**: Automatically switches between Animation mode and Static mode based on the file.
*   **Animation Control**: Play/Pause, Frame stepping, Loop toggle, and Playback speed adjustment.
*   **Image Viewer**: Zoom, Pan, and Auto-fit to window.
*   **File Export**: Convert static WebP images to PNG or JPG.
*   **Drag & Drop**: Simply drop a file to open it.
*   **Portable**: Single executable file, no installation required.

## 📥 Download

You can download the pre-compiled executable (`.exe`) from the [**Releases**](../../releases) page.

## 🚀 How to Use

1.  Download the latest `webp_player.exe` from Releases.
2.  Place the file in a folder of your choice (e.g., `C:\Tools\WebPPlayer`).
3.  **Set as Default App (Windows):**
    *   Right-click any `.webp` file.
    *   Select **Properties** > **Change...** (Opens with).
    *   Select "Choose an app on your PC" and browse to `webp_player.exe`.
4.  Now you can double-click any WebP file to open it instantly!

## 🎮 Controls

### Animation Mode (Moving WebP)

| Action | Control |
| :--- | :--- |
| **Play / Pause** | `Space` or `▶/⏸` Button |
| **Previous Frame** | `Z` Key or `⏮` Button |
| **Next Frame** | `X` Key or `⏭` Button |
| **Toggle Loop** | `🔁` Button |
| **Change Speed** | Mouse Scroll Wheel (Up/Down) |

### Static Mode (Still Image)

| Action | Control |
| :--- | :--- |
| **Zoom In / Out** | Mouse Scroll Wheel |
| **Pan (Move)** | Drag with Left or Middle Mouse Button |
| **Save as PNG** | `💾 PNG` Button |
| **Save as JPG** | `💾 JPG` Button |

### General
*   **Show Help**: `H` Key or `?` Button
*   **Open File**: Drag & Drop a file into the window

## 💻 System Requirements

*   **OS**: Windows 10 / 11
*   **Graphics**: GPU that supports OpenGL (via egui)

---

# Simple Webp Player (Japanese)

Rustで書かれた軽量・高速なWebPプレイヤーです。
**アニメーションWebP（動画）** と **静止画WebP** の両方に自動で対応し、シンプルなインターフェースで閲覧できます。

## ✨ 特徴

*   **両対応モード**: ファイルを読み込むと、動画か静止画かを自動判定してモードを切り替えます。
*   **アニメーション制御**: 再生/一時停止、コマ送り/コマ戻し、ループ切替、再生速度の変更が可能。
*   **画像ビューア機能**: ズーム、パン（移動）、ウィンドウに合わせた自動フィット。
*   **画像変換**: 静止画WebPをその場でPNGやJPG形式で保存可能。
*   **ドラッグ＆ドロップ**: ウィンドウにファイルを放り込むだけで再生。
*   **ポータブル**: インストール不要。`.exe` ファイル一つで動作します。

## 📥 ダウンロード

右側の [**Releases**](../../releases) ページから、コンパイル済みの実行ファイル（`.exe`）をダウンロードできます。

## 🚀 使い方

1.  Releasesから最新の `webp_player.exe` をダウンロードします。
2.  任意のフォルダ（例: `C:\Tools` など）に配置します。
3.  **Windowsの既定のアプリに設定する:**
    *   `.webp` ファイルを右クリックします。
    *   **プロパティ** > **変更 (プログラム)** を選択します。
    *   「PC上の別のアプリを選択」から、配置した `webp_player.exe` を指定します。
4.  これでWebPファイルをダブルクリックするだけで、このプレイヤーで開くようになります。

## 🎮 操作方法

### アニメーションモード（動画）

| 動作 | 操作 |
| :--- | :--- |
| **再生 / 一時停止** | `Space` キー または `▶/⏸` ボタン |
| **前のフレーム (コマ戻し)** | `Z` キー または `⏮` ボタン |
| **次のフレーム (コマ送り)** | `X` キー または `⏭` ボタン |
| **ループ再生 切替** | `🔁` ボタン |
| **再生速度 変更** | マウスホイール (上下) |

### 静止画モード

| 動作 | 操作 |
| :--- | :--- |
| **ズーム (拡大/縮小)** | マウスホイール |
| **パン (移動)** | 左ドラッグ または 中ボタン(ホイール)ドラッグ |
| **PNGとして保存** | `💾 PNG` ボタン |
| **JPGとして保存** | `💾 JPG` ボタン |

### 共通
*   **ヘルプ表示**: `H` キー または `?` ボタン
*   **ファイルを開く**: ウィンドウへドラッグ＆ドロップ

## 💻 動作環境

*   **OS**: Windows 10 / 11
*   **グラフィック**: OpenGLが動作する環境