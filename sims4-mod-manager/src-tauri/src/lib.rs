use serde::Serialize;
use std::fs::{self, File};
use std::io;
use unrar::Archive as RarArchive;
use zip::ZipArchive;
use std::path::{Path, PathBuf};
use std::process::Command;

#[tauri::command]
fn open_mods_folder() -> Result<(), String> {
    let home = std::env::var("USERPROFILE").map_err(|e| e.to_string())?;

    let mods_path = PathBuf::from(home)
        .join("Documents")
        .join("Electronic Arts")
        .join("The Sims 4")
        .join("Mods");

    if !mods_path.exists() {
        std::fs::create_dir_all(&mods_path).map_err(|e| e.to_string())?;
    }

    Command::new("explorer")
        .arg(&mods_path)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn open_github_repo() -> Result<(), String> {
    std::process::Command::new("cmd")
        .args([
            "/C",
            "start",
            "",
            "https://github.com/LouisaFrancious/Sims-4-Mod-ZIP-Manager"
        ])
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Serialize)]
struct ZipEntryInfo {
    id: usize,
    name: String,
    size: String,
    status: String,
}

#[derive(Serialize)]
struct ExtractedFileInfo {
    id: usize,
    name: String,
    size: String,
    file_type: String,
    source: String,
    author: String,
}

fn human_size(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;

    if (bytes as f64) >= MB {
        format!("{:.1} MB", bytes as f64 / MB)
    } else if (bytes as f64) >= KB {
        format!("{:.0} KB", bytes as f64 / KB)
    } else {
        format!("{} B", bytes)
    }
}

fn ensure_unique_path(dest_dir: &Path, file_name: &str) -> PathBuf {
    let mut candidate = dest_dir.join(file_name);

    if !candidate.exists() {
        return candidate;
    }

    let stem = Path::new(file_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file");
    let ext = Path::new(file_name)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let mut counter = 1;
    loop {
        let new_name = if ext.is_empty() {
            format!("{stem} ({counter})")
        } else {
            format!("{stem} ({counter}).{ext}")
        };

        candidate = dest_dir.join(new_name);
        if !candidate.exists() {
            return candidate;
        }
        counter += 1;
    }
}

#[tauri::command]
fn scan_zip_folder(folder_path: String) -> Result<Vec<ZipEntryInfo>, String> {
    let path = PathBuf::from(&folder_path);

    if !path.exists() || !path.is_dir() {
        return Err("Selected archive folder does not exist or is not a directory.".into());
    }

    let mut items = Vec::new();
    let mut next_id = 1usize;

    for entry in fs::read_dir(&path)
        .map_err(|e| format!("Failed to read folder: {e}"))?
        .flatten()
    {
        let entry_path = entry.path();

        let ext = entry_path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();

        if ext != "zip" && ext != "rar" {
            continue;
        }

        let metadata = fs::metadata(&entry_path)
            .map_err(|e| format!("Failed to read metadata: {e}"))?;

        let name = entry_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown.archive")
            .to_string();

        items.push(ZipEntryInfo {
            id: next_id,
            name,
            size: human_size(metadata.len()),
            status: "pending".to_string(),
        });

        next_id += 1;
    }

    items.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(items)
}

fn push_extracted_item(
    extracted: &mut Vec<ExtractedFileInfo>,
    extracted_id: &mut usize,
    path: &Path,
    file_type: String,
    source: String,
) -> Result<(), String> {
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to stat extracted file: {e}"))?;

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown.file")
        .to_string();

    extracted.push(ExtractedFileInfo {
        id: *extracted_id,
        name: file_name,
        size: human_size(metadata.len()),
        file_type,
        source,
        author: "Unknown".to_string(),
    });

    *extracted_id += 1;
    Ok(())
}

fn extract_zip_archive(
    archive_path: &Path,
    out_dir: &Path,
    extracted: &mut Vec<ExtractedFileInfo>,
    extracted_id: &mut usize,
) -> Result<(), String> {
    let source_name = archive_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown.zip")
        .to_string();

    let file = File::open(archive_path)
        .map_err(|e| format!("Failed to open {}: {e}", source_name))?;

    let mut archive =
        ZipArchive::new(file).map_err(|e| format!("Invalid ZIP {}: {e}", source_name))?;

    for i in 0..archive.len() {
        let mut zipped_file = archive
            .by_index(i)
            .map_err(|e| format!("Failed reading ZIP entry in {}: {e}", source_name))?;

        if zipped_file.is_dir() {
            continue;
        }

        let raw_name = zipped_file.name().to_string();
        let file_name = Path::new(&raw_name)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

        let ext = Path::new(file_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();

        if ext != "package" && ext != "ts4script" {
            continue;
        }

        let dest_path = ensure_unique_path(out_dir, file_name);
        let mut outfile = File::create(&dest_path)
            .map_err(|e| format!("Failed to create output file: {e}"))?;

        io::copy(&mut zipped_file, &mut outfile)
            .map_err(|e| format!("Failed to extract {file_name}: {e}"))?;

        let file_type = match ext.as_str() {
            "package" => "Package".to_string(),
            "ts4script" => "Script Mod".to_string(),
            _ => "Other".to_string(),
        };

        push_extracted_item(extracted, extracted_id, &dest_path, file_type, source_name.clone())?;
    }

    Ok(())
}

fn extract_rar_archive(
    archive_path: &Path,
    out_dir: &Path,
    extracted: &mut Vec<ExtractedFileInfo>,
    extracted_id: &mut usize,
) -> Result<(), String> {
    let source_name = archive_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown.rar")
        .to_string();

    let mut archive = RarArchive::new(archive_path)
        .open_for_processing()
        .map_err(|e| format!("Failed to open RAR {}: {e}", source_name))?;

    loop {
        let Some(next) = archive
            .read_header()
            .map_err(|e| format!("Failed to read RAR header in {}: {e}", source_name))?
        else {
            break;
        };

        let entry_name = next.entry().filename.to_string_lossy().to_string();

        let file_name = Path::new(&entry_name)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

        let ext = Path::new(file_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();

        if ext != "package" && ext != "ts4script" {
            archive = next
                .skip()
                .map_err(|e| format!("Failed to skip RAR entry in {}: {e}", source_name))?;
            continue;
        }

        let dest_path = ensure_unique_path(out_dir, file_name);

        let parent = dest_path
            .parent()
            .ok_or_else(|| "Invalid destination path.".to_string())?;
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create destination folder: {e}"))?;

        archive = next
            .extract_to(&dest_path)
            .map_err(|e| format!("Failed to extract {file_name} from {}: {e}", source_name))?;

        let file_type = match ext.as_str() {
            "package" => "Package".to_string(),
            "ts4script" => "Script Mod".to_string(),
            _ => "Other".to_string(),
        };

        push_extracted_item(extracted, extracted_id, &dest_path, file_type, source_name.clone())?;
    }

    Ok(())
}

#[tauri::command]
fn extract_all_zips(
    zip_folder_path: String,
    output_folder_path: String,
) -> Result<Vec<ExtractedFileInfo>, String> {
    let archive_dir = PathBuf::from(&zip_folder_path);
    let out_dir = PathBuf::from(&output_folder_path);

    if !archive_dir.exists() || !archive_dir.is_dir() {
        return Err("Archive folder does not exist or is not a directory.".into());
    }

    fs::create_dir_all(&out_dir)
        .map_err(|e| format!("Failed to create output folder: {e}"))?;

    let mut extracted = Vec::new();
    let mut extracted_id = 1usize;

    for entry in fs::read_dir(&archive_dir)
        .map_err(|e| format!("Failed to read archive folder: {e}"))?
        .flatten()
    {
        let archive_path = entry.path();

        let ext = archive_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();

        match ext.as_str() {
            "zip" => {
                extract_zip_archive(&archive_path, &out_dir, &mut extracted, &mut extracted_id)?
            }
            "rar" => {
                extract_rar_archive(&archive_path, &out_dir, &mut extracted, &mut extracted_id)?
            }
            _ => {}
        }
    }

    Ok(extracted)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init()) // ⭐ 必须有（修 zip folder）
        .invoke_handler(tauri::generate_handler![
            open_mods_folder,
            open_github_repo,
            scan_zip_folder,
            extract_all_zips
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}