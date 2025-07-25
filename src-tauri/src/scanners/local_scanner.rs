// src-tauri/src/scanners/local_scanner.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::Path;
use tauri::command;
use walkdir::{DirEntry, WalkDir};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalFile {
    pub path: String,
    pub name: String,
    pub extension: String,
    pub size: u64,
    pub modified_time: DateTime<Utc>,
    pub accessed_time: Option<DateTime<Utc>>,
    pub is_hidden: bool,
    pub hash: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FolderStats {
    pub total_files: usize,
    pub total_directories: usize,
    pub total_size: u64,
    pub file_types: HashMap<String, usize>,
    pub largest_files: Vec<LocalFile>,
    pub duplicates: Vec<DuplicateGroup>,
    pub unused_files: Vec<LocalFile>, // Files not accessed in 6+ months
    pub scan_timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DuplicateGroup {
    pub hash: String,
    pub total_size: u64,
    pub files: Vec<LocalFile>,
}

const SKIP_DIRECTORIES: &[&str] = &[
    "node_modules",
    ".git",
    ".vscode",
    "target",
    "build",
    "dist",
    "$RECYCLE.BIN",
    "System Volume Information",
    "Windows",
    "Program Files",
    "Program Files (x86)",
    "ProgramData",
];

const LARGE_FILE_THRESHOLD: u64 = 100 * 1024 * 1024; // 100MB
const UNUSED_DAYS_THRESHOLD: i64 = 180; // 6 months

#[command]
pub async fn scan_directory(path: String) -> Result<FolderStats, String> {
    let scan_path = Path::new(&path);

    if !scan_path.exists() {
        return Err("Directory does not exist".to_string());
    }

    if !scan_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut all_files = Vec::new();
    let mut total_directories = 0;
    let mut file_hashes: HashMap<String, Vec<LocalFile>> = HashMap::new();

    // Walk directory tree
    for entry in WalkDir::new(scan_path)
        .into_iter()
        .filter_entry(|e| !is_skip_directory(e))
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if path.is_dir() {
            total_directories += 1;
        } else if path.is_file() {
            if let Some(file_info) = process_file(&entry) {
                // Calculate hash for duplicate detection (only for smaller files)
                if file_info.size < 50 * 1024 * 1024 {
                    // 50MB limit for hashing
                    if let Ok(hash) = calculate_file_hash(path) {
                        let mut file_with_hash = file_info.clone();
                        file_with_hash.hash = Some(hash.clone());
                        file_hashes
                            .entry(hash)
                            .or_insert_with(Vec::new)
                            .push(file_with_hash.clone());
                        all_files.push(file_with_hash);
                    } else {
                        all_files.push(file_info);
                    }
                } else {
                    all_files.push(file_info);
                }
            }
        }
    }

    // Analyze results
    let stats = analyze_folder_contents(all_files, file_hashes, total_directories);
    Ok(stats)
}

#[command]
pub async fn get_folder_stats(path: String) -> Result<serde_json::Value, String> {
    let scan_path = Path::new(&path);

    let metadata =
        fs::metadata(scan_path).map_err(|e| format!("Failed to read metadata: {}", e))?;

    let stats = serde_json::json!({
        "path": path,
        "is_readonly": metadata.permissions().readonly(),
        "created": metadata.created().ok().map(|t| DateTime::<Utc>::from(t)),
        "modified": metadata.modified().ok().map(|t| DateTime::<Utc>::from(t)),
    });

    Ok(stats)
}

#[command]
pub async fn detect_duplicates(paths: Vec<String>) -> Result<Vec<DuplicateGroup>, String> {
    let mut file_hashes: HashMap<String, Vec<LocalFile>> = HashMap::new();

    for path in paths {
        let scan_path = Path::new(&path);

        for entry in WalkDir::new(scan_path)
            .into_iter()
            .filter_entry(|e| !is_skip_directory(e))
            .filter_map(|e| e.ok())
        {
            let path = entry.path();

            if path.is_file() {
                if let Some(file_info) = process_file(&entry) {
                    if file_info.size < 100 * 1024 * 1024 {
                        // 100MB limit
                        if let Ok(hash) = calculate_file_hash(path) {
                            let mut file_with_hash = file_info;
                            file_with_hash.hash = Some(hash.clone());
                            file_hashes
                                .entry(hash)
                                .or_insert_with(Vec::new)
                                .push(file_with_hash);
                        }
                    }
                }
            }
        }
    }

    // Find duplicates
    let duplicates: Vec<DuplicateGroup> = file_hashes
        .into_iter()
        .filter(|(_, files)| files.len() > 1)
        .map(|(hash, files)| {
            let total_size = files[0].size * files.len() as u64;
            DuplicateGroup {
                hash,
                total_size,
                files,
            }
        })
        .collect();

    Ok(duplicates)
}

fn is_skip_directory(entry: &DirEntry) -> bool {
    entry
        .file_name()
        .to_str()
        .map(|s| s.starts_with('.') || SKIP_DIRECTORIES.contains(&s))
        .unwrap_or(false)
}

fn process_file(entry: &DirEntry) -> Option<LocalFile> {
    let path = entry.path();
    let metadata = entry.metadata().ok()?;

    let name = path.file_name()?.to_str()?.to_string();
    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_string();

    let modified_time = metadata
        .modified()
        .ok()
        .map(|t| DateTime::<Utc>::from(t))
        .unwrap_or_else(|| Utc::now());

    let accessed_time = metadata.accessed().ok().map(|t| DateTime::<Utc>::from(t));

    let is_hidden = name.starts_with('.');

    Some(LocalFile {
        path: path.to_str()?.to_string(),
        name,
        extension,
        size: metadata.len(),
        modified_time,
        accessed_time,
        is_hidden,
        hash: None,
    })
}

fn calculate_file_hash(path: &Path) -> Result<String, std::io::Error> {
    let mut file = fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = vec![0; 8192];

    loop {
        let bytes_read = file.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    Ok(format!("{:x}", hasher.finalize()))
}

fn analyze_folder_contents(
    files: Vec<LocalFile>,
    file_hashes: HashMap<String, Vec<LocalFile>>,
    total_directories: usize,
) -> FolderStats {
    let mut total_size = 0u64;
    let mut file_types: HashMap<String, usize> = HashMap::new();

    // Calculate totals
    for file in &files {
        total_size += file.size;
        *file_types.entry(file.extension.clone()).or_insert(0) += 1;
    }

    // Find largest files
    let mut sorted_by_size = files.clone();
    sorted_by_size.sort_by(|a, b| b.size.cmp(&a.size));
    let largest_files: Vec<LocalFile> = sorted_by_size
        .into_iter()
        .filter(|f| f.size >= LARGE_FILE_THRESHOLD)
        .take(20)
        .collect();

    // Find duplicates
    let duplicates: Vec<DuplicateGroup> = file_hashes
        .into_iter()
        .filter(|(_, files)| files.len() > 1)
        .map(|(hash, files)| {
            let total_size = files[0].size * (files.len() - 1) as u64; // Wasted space
            DuplicateGroup {
                hash,
                total_size,
                files,
            }
        })
        .collect();

    // Find unused files (not accessed in 6+ months)
    let cutoff_date = Utc::now() - chrono::Duration::days(UNUSED_DAYS_THRESHOLD);
    let total_files_count = files.len();
    let unused_files: Vec<LocalFile> = files
        .into_iter()
        .filter(|f| {
            f.accessed_time
                .map(|accessed| accessed < cutoff_date)
                .unwrap_or(false)
        })
        .take(50)
        .collect();

    FolderStats {
        total_files: total_files_count,
        total_directories,
        total_size,
        file_types,
        largest_files,
        duplicates,
        unused_files,
        scan_timestamp: Utc::now(),
    }
}
