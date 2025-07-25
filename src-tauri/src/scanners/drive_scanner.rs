// src-tauri/src/scanners/drive_scanner.rs
use chrono::{DateTime, Utc};
use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

// OAuth configuration for Google Drive
const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_API_URL: &str = "https://www.googleapis.com/drive/v3";
const REDIRECT_URI: &str = "http://localhost:8080/oauth/callback";

// Replace with your Google OAuth client ID and secret
const CLIENT_ID: &str = env!("GOOGLE_CLIENT_ID", "Google Client ID not set in environment");
const CLIENT_SECRET: &str = env!("GOOGLE_CLIENT_SECRET", "Google Client Secret not set in environment");

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriveFile {
    pub id: String,
    pub name: String,
    pub mime_type: String,
    pub size: Option<i64>,
    pub created_time: String,
    pub modified_time: String,
    pub accessed_time: Option<String>,
    pub parents: Vec<String>,
    pub is_trashed: bool,
    pub is_shared: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DriveScanResult {
    pub total_files: usize,
    pub total_size: i64,
    pub file_types: HashMap<String, usize>,
    pub largest_files: Vec<DriveFile>,
    pub oldest_files: Vec<DriveFile>,
    pub scan_timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthToken {
    access_token: String,
    token_type: String,
    expires_in: i64,
    refresh_token: Option<String>,
}

// Store OAuth tokens in memory (in production, use secure storage)
static mut OAUTH_TOKEN: Option<OAuthToken> = None;

#[command]
pub async fn init_oauth_flow() -> Result<String, String> {
    // Build OAuth authorization URL
    let auth_url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly&access_type=offline",
        GOOGLE_AUTH_URL, CLIENT_ID, REDIRECT_URI
    );

    // Return the URL for the frontend to open in browser
    Ok(auth_url)
}

#[command]
pub async fn handle_oauth_callback(code: String) -> Result<bool, String> {
    // Exchange authorization code for access token
    let client = reqwest::Client::new();

    let params = [
        ("code", code.as_str()),
        ("client_id", CLIENT_ID),
        ("client_secret", CLIENT_SECRET),
        ("redirect_uri", REDIRECT_URI),
        ("grant_type", "authorization_code"),
    ];

    let response = client
        .post(GOOGLE_TOKEN_URL)
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Failed to exchange code: {}", e))?;

    if response.status().is_success() {
        let token: OAuthToken = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse token: {}", e))?;

        // Store token (in production, use secure storage)
        unsafe {
            OAUTH_TOKEN = Some(token);
        }

        Ok(true)
    } else {
        Err("OAuth authentication failed".to_string())
    }
}

#[command]
pub async fn scan_drive() -> Result<DriveScanResult, String> {
    let token = unsafe { OAUTH_TOKEN.as_ref().ok_or("Not authenticated")? };

    let client = reqwest::Client::new();
    let mut all_files = Vec::new();
    let mut page_token = None;

    // Fetch all files from Google Drive
    loop {
        let mut url = format!(
            "{}/files?fields=nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,viewedByMeTime,parents,trashed,shared)&pageSize=1000",
            GOOGLE_DRIVE_API_URL
        );

        if let Some(token) = &page_token {
            url.push_str(&format!("&pageToken={}", token));
        }

        let response = client
            .get(&url)
            .bearer_auth(&token.access_token)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch files: {}", e))?;

        if !response.status().is_success() {
            return Err("Failed to fetch Drive files".to_string());
        }

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if let Some(files) = data["files"].as_array() {
            for file in files {
                if !file["trashed"].as_bool().unwrap_or(false) {
                    all_files.push(DriveFile {
                        id: file["id"].as_str().unwrap_or("").to_string(),
                        name: file["name"].as_str().unwrap_or("").to_string(),
                        mime_type: file["mimeType"].as_str().unwrap_or("").to_string(),
                        size: file["size"].as_str().and_then(|s| s.parse().ok()),
                        created_time: file["createdTime"].as_str().unwrap_or("").to_string(),
                        modified_time: file["modifiedTime"].as_str().unwrap_or("").to_string(),
                        accessed_time: file["viewedByMeTime"].as_str().map(|s| s.to_string()),
                        parents: file["parents"]
                            .as_array()
                            .map(|arr| {
                                arr.iter()
                                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                                    .collect()
                            })
                            .unwrap_or_default(),
                        is_trashed: file["trashed"].as_bool().unwrap_or(false),
                        is_shared: file["shared"].as_bool().unwrap_or(false),
                    });
                }
            }
        }

        // Check for next page
        if let Some(next_token) = data["nextPageToken"].as_str() {
            page_token = Some(next_token.to_string());
        } else {
            break;
        }
    }

    // Process and analyze the files
    let result = analyze_drive_files(all_files);
    Ok(result)
}

#[command]
pub async fn get_drive_metadata() -> Result<serde_json::Value, String> {
    let token = unsafe { OAUTH_TOKEN.as_ref().ok_or("Not authenticated")? };

    let client = reqwest::Client::new();

    // Get Drive storage quota
    let response = client
        .get(&format!(
            "{}/about?fields=storageQuota",
            GOOGLE_DRIVE_API_URL
        ))
        .bearer_auth(&token.access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch metadata: {}", e))?;

    if response.status().is_success() {
        let data = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse metadata: {}", e))?;
        Ok(data)
    } else {
        Err("Failed to fetch Drive metadata".to_string())
    }
}

fn analyze_drive_files(files: Vec<DriveFile>) -> DriveScanResult {
    let mut total_size = 0i64;
    let mut file_types: HashMap<String, usize> = HashMap::new();

    // Calculate totals and categorize
    for file in &files {
        if let Some(size) = file.size {
            total_size += size;
        }

        let file_type = get_file_category(&file.mime_type);
        *file_types.entry(file_type).or_insert(0) += 1;
    }

    // Find largest files
    let mut sorted_by_size = files.clone();
    sorted_by_size.sort_by(|a, b| b.size.cmp(&a.size));
    let largest_files: Vec<DriveFile> = sorted_by_size.into_iter().take(10).collect();

    // Find oldest files
    let mut sorted_by_date = files.clone();
    sorted_by_date.sort_by(|a, b| a.modified_time.cmp(&b.modified_time));
    let oldest_files: Vec<DriveFile> = sorted_by_date.into_iter().take(10).collect();

    DriveScanResult {
        total_files: files.len(),
        total_size,
        file_types,
        largest_files,
        oldest_files,
        scan_timestamp: Utc::now(),
    }
}

fn get_file_category(mime_type: &str) -> String {
    match mime_type {
        t if t.starts_with("image/") => "Images".to_string(),
        t if t.starts_with("video/") => "Videos".to_string(),
        t if t.starts_with("audio/") => "Audio".to_string(),
        t if t.contains("document") => "Documents".to_string(),
        t if t.contains("spreadsheet") => "Spreadsheets".to_string(),
        t if t.contains("presentation") => "Presentations".to_string(),
        t if t.contains("pdf") => "PDFs".to_string(),
        t if t.contains("folder") => "Folders".to_string(),
        _ => "Other".to_string(),
    }
}
