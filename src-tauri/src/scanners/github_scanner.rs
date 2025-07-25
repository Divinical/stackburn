// src-tauri/src/scanners/github_scanner.rs
use chrono::{DateTime, Duration, Utc};
use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

const GITHUB_API_URL: &str = "https://api.github.com";
const STALE_REPO_DAYS: i64 = 180; // 6 months

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GitHubRepo {
    pub id: i64,
    pub name: String,
    pub full_name: String,
    pub owner: String,
    pub description: Option<String>,
    pub is_private: bool,
    pub is_fork: bool,
    pub parent_repo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub pushed_at: DateTime<Utc>,
    pub size: i64, // Size in KB
    pub language: Option<String>,
    pub default_branch: String,
    pub open_issues_count: i32,
    pub forks_count: i32,
    pub stargazers_count: i32,
    pub has_wiki: bool,
    pub has_pages: bool,
    pub archived: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Branch {
    pub name: String,
    pub commit_sha: String,
    pub commit_date: DateTime<Utc>,
    pub is_protected: bool,
    pub ahead_by: i32,
    pub behind_by: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubScanResult {
    pub total_repos: usize,
    pub private_repos: usize,
    pub public_repos: usize,
    pub total_size_kb: i64,
    pub stale_repos: Vec<GitHubRepo>,
    pub inactive_forks: Vec<GitHubRepo>,
    pub archived_repos: Vec<GitHubRepo>,
    pub repos_by_language: HashMap<String, usize>,
    pub largest_repos: Vec<GitHubRepo>,
    pub orphaned_branches: HashMap<String, Vec<Branch>>,
    pub scan_timestamp: DateTime<Utc>,
}

// Store GitHub token in memory (in production, use secure storage)
static mut GITHUB_TOKEN: Option<String> = None;

#[command]
pub async fn authenticate_github(token: String) -> Result<bool, String> {
    // Validate token by making a test API call
    let client = reqwest::Client::new();

    let response = client
        .get(&format!("{}/user", GITHUB_API_URL))
        .header("Authorization", format!("token {}", token))
        .header("User-Agent", "StackBurn-Scanner")
        .send()
        .await
        .map_err(|e| format!("Failed to validate token: {}", e))?;

    if response.status().is_success() {
        // Store token (in production, use secure storage)
        unsafe {
            GITHUB_TOKEN = Some(token);
        }
        Ok(true)
    } else {
        Err("Invalid GitHub token".to_string())
    }
}

#[command]
pub async fn scan_repositories() -> Result<GitHubScanResult, String> {
    let token = unsafe {
        GITHUB_TOKEN
            .as_ref()
            .ok_or("Not authenticated with GitHub")?
    };

    let client = reqwest::Client::new();
    let mut all_repos = Vec::new();
    let mut page = 1;

    // Fetch all repositories
    loop {
        let url = format!(
            "{}/user/repos?page={}&per_page=100&type=all",
            GITHUB_API_URL, page
        );

        let response = client
            .get(&url)
            .header("Authorization", format!("token {}", token))
            .header("User-Agent", "StackBurn-Scanner")
            .send()
            .await
            .map_err(|e| format!("Failed to fetch repos: {}", e))?;

        if !response.status().is_success() {
            return Err("Failed to fetch GitHub repositories".to_string());
        }

        let repos: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse repos: {}", e))?;

        if repos.is_empty() {
            break;
        }

        for repo in repos {
            if let Some(parsed_repo) = parse_repo(&repo) {
                all_repos.push(parsed_repo);
            }
        }

        page += 1;
    }

    // Analyze repositories and find orphaned branches
    let mut orphaned_branches = HashMap::new();
    let cutoff_date = Utc::now() - Duration::days(STALE_REPO_DAYS);

    for repo in &all_repos {
        if repo.pushed_at < cutoff_date && !repo.archived {
            // Check for orphaned branches in stale repos
            if let Ok(branches) = fetch_repo_branches(&client, &token, &repo.full_name).await {
                let orphaned: Vec<Branch> = branches
                    .into_iter()
                    .filter(|b| b.name != repo.default_branch && b.ahead_by > 0)
                    .collect();

                if !orphaned.is_empty() {
                    orphaned_branches.insert(repo.full_name.clone(), orphaned);
                }
            }
        }
    }

    let result = analyze_repositories(all_repos, orphaned_branches);
    Ok(result)
}

#[command]
pub async fn get_stale_repos() -> Result<Vec<GitHubRepo>, String> {
    let scan_result = scan_repositories().await?;
    Ok(scan_result.stale_repos)
}

fn parse_repo(data: &serde_json::Value) -> Option<GitHubRepo> {
    Some(GitHubRepo {
        id: data["id"].as_i64()?,
        name: data["name"].as_str()?.to_string(),
        full_name: data["full_name"].as_str()?.to_string(),
        owner: data["owner"]["login"].as_str()?.to_string(),
        description: data["description"].as_str().map(|s| s.to_string()),
        is_private: data["private"].as_bool()?,
        is_fork: data["fork"].as_bool()?,
        parent_repo: data["parent"]["full_name"].as_str().map(|s| s.to_string()),
        created_at: DateTime::parse_from_rfc3339(data["created_at"].as_str()?)
            .ok()?
            .with_timezone(&Utc),
        updated_at: DateTime::parse_from_rfc3339(data["updated_at"].as_str()?)
            .ok()?
            .with_timezone(&Utc),
        pushed_at: DateTime::parse_from_rfc3339(data["pushed_at"].as_str()?)
            .ok()?
            .with_timezone(&Utc),
        size: data["size"].as_i64()?,
        language: data["language"].as_str().map(|s| s.to_string()),
        default_branch: data["default_branch"].as_str()?.to_string(),
        open_issues_count: data["open_issues_count"].as_i64()? as i32,
        forks_count: data["forks_count"].as_i64()? as i32,
        stargazers_count: data["stargazers_count"].as_i64()? as i32,
        has_wiki: data["has_wiki"].as_bool()?,
        has_pages: data["has_pages"].as_bool()?,
        archived: data["archived"].as_bool()?,
    })
}

async fn fetch_repo_branches(
    client: &reqwest::Client,
    token: &str,
    repo_full_name: &str,
) -> Result<Vec<Branch>, String> {
    let url = format!("{}/repos/{}/branches", GITHUB_API_URL, repo_full_name);

    let response = client
        .get(&url)
        .header("Authorization", format!("token {}", token))
        .header("User-Agent", "StackBurn-Scanner")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch branches: {}", e))?;

    if !response.status().is_success() {
        return Ok(Vec::new()); // Return empty if we can't fetch branches
    }

    let branches_data: Vec<serde_json::Value> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse branches: {}", e))?;

    let mut branches = Vec::new();

    for branch_data in branches_data {
        if let Some(branch) = parse_branch(&branch_data) {
            branches.push(branch);
        }
    }

    Ok(branches)
}

fn parse_branch(data: &serde_json::Value) -> Option<Branch> {
    Some(Branch {
        name: data["name"].as_str()?.to_string(),
        commit_sha: data["commit"]["sha"].as_str()?.to_string(),
        commit_date: Utc::now(), // Would need additional API call for actual date
        is_protected: data["protected"].as_bool().unwrap_or(false),
        ahead_by: 0,  // Would need comparison API call
        behind_by: 0, // Would need comparison API call
    })
}

fn analyze_repositories(
    repos: Vec<GitHubRepo>,
    orphaned_branches: HashMap<String, Vec<Branch>>,
) -> GitHubScanResult {
    let cutoff_date = Utc::now() - Duration::days(STALE_REPO_DAYS);

    // Calculate statistics
    let total_repos = repos.len();
    let private_repos = repos.iter().filter(|r| r.is_private).count();
    let public_repos = total_repos - private_repos;
    let total_size_kb: i64 = repos.iter().map(|r| r.size).sum();

    // Find stale repos (no commits in 6+ months)
    let stale_repos: Vec<GitHubRepo> = repos
        .iter()
        .filter(|r| r.pushed_at < cutoff_date && !r.archived)
        .cloned()
        .collect();

    // Find inactive forks (forks with no new commits)
    let inactive_forks: Vec<GitHubRepo> = repos
        .iter()
        .filter(|r| r.is_fork && r.pushed_at < cutoff_date && !r.archived)
        .cloned()
        .collect();

    // Find archived repos
    let archived_repos: Vec<GitHubRepo> = repos.iter().filter(|r| r.archived).cloned().collect();

    // Count repos by language
    let mut repos_by_language: HashMap<String, usize> = HashMap::new();
    for repo in &repos {
        if let Some(ref lang) = repo.language {
            *repos_by_language.entry(lang.clone()).or_insert(0) += 1;
        }
    }

    // Find largest repos
    let mut sorted_by_size = repos.clone();
    sorted_by_size.sort_by(|a, b| b.size.cmp(&a.size));
    let largest_repos: Vec<GitHubRepo> = sorted_by_size.into_iter().take(10).collect();

    GitHubScanResult {
        total_repos,
        private_repos,
        public_repos,
        total_size_kb,
        stale_repos,
        inactive_forks,
        archived_repos,
        repos_by_language,
        largest_repos,
        orphaned_branches,
        scan_timestamp: Utc::now(),
    }
}
