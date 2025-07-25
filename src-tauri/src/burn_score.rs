// src-tauri/src/burn_score.rs
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct BurnScoreInput {
    pub drive_data: Option<serde_json::Value>,
    pub local_data: Option<serde_json::Value>,
    pub github_data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BurnScoreResult {
    pub overall_score: f64, // 0-100, higher = more bloat
    pub category_scores: HashMap<String, f64>,
    pub total_bloat_size_gb: f64,
    pub total_files_scanned: usize,
    pub recommendations: Vec<Recommendation>,
    pub file_categories: FileCategories,
    pub potential_savings_gb: f64,
    pub calculated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileCategories {
    pub duplicates: CategoryStats,
    pub versioned: CategoryStats,
    pub stale: CategoryStats,
    pub archived: CategoryStats,
    pub large_unused: CategoryStats,
    pub temporary: CategoryStats,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryStats {
    pub count: usize,
    pub total_size_gb: f64,
    pub percentage_of_total: f64,
    pub items: Vec<String>, // Sample file paths or names
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Recommendation {
    pub priority: Priority,
    pub category: String,
    pub action: String,
    pub impact_gb: f64,
    pub effort: EffortLevel,
    pub details: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Priority {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum EffortLevel {
    Easy,
    Moderate,
    Complex,
}

const STALE_DAYS: i64 = 180; // 6 months
const LARGE_FILE_THRESHOLD_GB: f64 = 0.1; // 100MB

#[command]
pub async fn calculate_burn_score(input: BurnScoreInput) -> Result<BurnScoreResult, String> {
    let mut total_files = 0;
    let mut total_size_bytes = 0u64;
    let mut category_scores = HashMap::new();
    let mut file_categories = FileCategories {
        duplicates: CategoryStats::default(),
        versioned: CategoryStats::default(),
        stale: CategoryStats::default(),
        archived: CategoryStats::default(),
        large_unused: CategoryStats::default(),
        temporary: CategoryStats::default(),
    };

    // Process Google Drive data
    if let Some(drive_data) = &input.drive_data {
        let (drive_score, drive_stats) = analyze_drive_data(drive_data)?;
        category_scores.insert("Google Drive".to_string(), drive_score);
        merge_category_stats(&mut file_categories, drive_stats);

        if let Some(count) = drive_data["total_files"].as_u64() {
            total_files += count as usize;
        }
        if let Some(size) = drive_data["total_size"].as_u64() {
            total_size_bytes += size;
        }
    }

    // Process Local Files data
    if let Some(local_data) = &input.local_data {
        let (local_score, local_stats) = analyze_local_data(local_data)?;
        category_scores.insert("Local Files".to_string(), local_score);
        merge_category_stats(&mut file_categories, local_stats);

        if let Some(count) = local_data["total_files"].as_u64() {
            total_files += count as usize;
        }
        if let Some(size) = local_data["total_size"].as_u64() {
            total_size_bytes += size;
        }
    }

    // Process GitHub data
    if let Some(github_data) = &input.github_data {
        let (github_score, github_stats) = analyze_github_data(github_data)?;
        category_scores.insert("GitHub".to_string(), github_score);
        merge_category_stats(&mut file_categories, github_stats);

        if let Some(count) = github_data["total_repos"].as_u64() {
            total_files += count as usize; // Count repos as "files"
        }
        if let Some(size_kb) = github_data["total_size_kb"].as_u64() {
            total_size_bytes += size_kb * 1024;
        }
    }

    // Calculate overall burn score
    let overall_score = calculate_overall_score(&category_scores, &file_categories);

    // Calculate totals
    let total_bloat_size_gb = calculate_total_bloat(&file_categories);
    let potential_savings_gb = calculate_potential_savings(&file_categories);

    // Generate recommendations
    let recommendations = generate_recommendations(&file_categories, &category_scores);

    Ok(BurnScoreResult {
        overall_score,
        category_scores,
        total_bloat_size_gb,
        total_files_scanned: total_files,
        recommendations,
        file_categories,
        potential_savings_gb,
        calculated_at: Utc::now(),
    })
}

#[command]
pub async fn get_file_categories(input: BurnScoreInput) -> Result<FileCategories, String> {
    let result = calculate_burn_score(input).await?;
    Ok(result.file_categories)
}

#[command]
pub async fn generate_report(burn_score: BurnScoreResult) -> Result<String, String> {
    let mut report = String::new();

    report.push_str(&format!("# StackBurn Analysis Report\n\n"));
    report.push_str(&format!(
        "Generated: {}\n\n",
        burn_score.calculated_at.format("%Y-%m-%d %H:%M:%S UTC")
    ));

    report.push_str(&format!(
        "## Overall Burn Score: {:.1}/100\n\n",
        burn_score.overall_score
    ));
    report.push_str(&format!("Higher scores indicate more digital bloat.\n\n"));

    report.push_str(&format!("## Summary Statistics\n"));
    report.push_str(&format!(
        "- Total files scanned: {}\n",
        burn_score.total_files_scanned
    ));
    report.push_str(&format!(
        "- Total bloat identified: {:.2} GB\n",
        burn_score.total_bloat_size_gb
    ));
    report.push_str(&format!(
        "- Potential savings: {:.2} GB\n\n",
        burn_score.potential_savings_gb
    ));

    report.push_str(&format!("## Category Breakdown\n"));
    for (category, score) in &burn_score.category_scores {
        report.push_str(&format!("- {}: {:.1}/100\n", category, score));
    }
    report.push_str("\n");

    report.push_str(&format!("## File Categories\n"));
    report.push_str(&format!("### Duplicates\n"));
    report.push_str(&format!(
        "- Count: {}\n",
        burn_score.file_categories.duplicates.count
    ));
    report.push_str(&format!(
        "- Size: {:.2} GB\n\n",
        burn_score.file_categories.duplicates.total_size_gb
    ));

    report.push_str(&format!("### Stale Files\n"));
    report.push_str(&format!(
        "- Count: {}\n",
        burn_score.file_categories.stale.count
    ));
    report.push_str(&format!(
        "- Size: {:.2} GB\n\n",
        burn_score.file_categories.stale.total_size_gb
    ));

    report.push_str(&format!("## Top Recommendations\n"));
    for (i, rec) in burn_score.recommendations.iter().take(5).enumerate() {
        report.push_str(&format!(
            "{}. **{}** - {}\n",
            i + 1,
            rec.action,
            rec.details
        ));
        report.push_str(&format!(
            "   - Impact: {:.2} GB | Effort: {:?}\n\n",
            rec.impact_gb, rec.effort
        ));
    }

    Ok(report)
}

fn analyze_drive_data(data: &serde_json::Value) -> Result<(f64, FileCategories), String> {
    let mut categories = FileCategories::default();
    let mut score = 0.0;

    // Analyze file types distribution
    if let Some(file_types) = data["file_types"].as_object() {
        let total_files = data["total_files"].as_u64().unwrap_or(0) as f64;

        // Check for high percentage of certain file types
        for (file_type, count) in file_types {
            let percentage = (count.as_u64().unwrap_or(0) as f64 / total_files) * 100.0;

            match file_type.as_str() {
                "Videos" | "Images" if percentage > 40.0 => score += 10.0,
                "Other" if percentage > 30.0 => score += 5.0,
                _ => {}
            }
        }
    }

    // Analyze oldest files
    if let Some(oldest_files) = data["oldest_files"].as_array() {
        let cutoff = Utc::now() - Duration::days(STALE_DAYS);

        for file in oldest_files {
            if let Some(modified) = file["modified_time"].as_str() {
                if let Ok(date) = DateTime::parse_from_rfc3339(modified) {
                    if date.with_timezone(&Utc) < cutoff {
                        categories.stale.count += 1;
                        if let Some(size) = file["size"].as_u64() {
                            categories.stale.total_size_gb += size as f64 / 1_073_741_824.0;
                        }
                        if let Some(name) = file["name"].as_str() {
                            categories.stale.items.push(name.to_string());
                        }
                    }
                }
            }
        }

        score += (categories.stale.count as f64).min(20.0);
    }

    Ok((score.min(100.0), categories))
}

fn analyze_local_data(data: &serde_json::Value) -> Result<(f64, FileCategories), String> {
    let mut categories = FileCategories::default();
    let mut score = 0.0;

    // Analyze duplicates
    if let Some(duplicates) = data["duplicates"].as_array() {
        for dup_group in duplicates {
            if let Some(files) = dup_group["files"].as_array() {
                categories.duplicates.count += files.len() - 1; // Subtract original
                if let Some(size) = dup_group["total_size"].as_u64() {
                    categories.duplicates.total_size_gb += size as f64 / 1_073_741_824.0;
                }

                // Add sample files
                for file in files.iter().skip(1).take(3) {
                    if let Some(path) = file["path"].as_str() {
                        categories.duplicates.items.push(path.to_string());
                    }
                }
            }
        }

        score += (categories.duplicates.count as f64 * 2.0).min(30.0);
    }

    // Analyze large files
    if let Some(largest_files) = data["largest_files"].as_array() {
        for file in largest_files {
            if let Some(size) = file["size"].as_u64() {
                let size_gb = size as f64 / 1_073_741_824.0;
                if size_gb > LARGE_FILE_THRESHOLD_GB {
                    categories.large_unused.count += 1;
                    categories.large_unused.total_size_gb += size_gb;
                    if let Some(name) = file["name"].as_str() {
                        categories.large_unused.items.push(name.to_string());
                    }
                }
            }
        }

        score += (categories.large_unused.count as f64).min(20.0);
    }

    // Analyze unused files
    if let Some(unused_files) = data["unused_files"].as_array() {
        categories.stale.count += unused_files.len();
        for file in unused_files {
            if let Some(size) = file["size"].as_u64() {
                categories.stale.total_size_gb += size as f64 / 1_073_741_824.0;
            }
        }

        score += (unused_files.len() as f64).min(20.0);
    }

    Ok((score.min(100.0), categories))
}

fn analyze_github_data(data: &serde_json::Value) -> Result<(f64, FileCategories), String> {
    let mut categories = FileCategories::default();
    let mut score = 0.0;

    // Analyze stale repos
    if let Some(stale_repos) = data["stale_repos"].as_array() {
        categories.stale.count += stale_repos.len();
        for repo in stale_repos {
            if let Some(size) = repo["size"].as_u64() {
                categories.stale.total_size_gb += (size * 1024) as f64 / 1_073_741_824.0;
            }
            if let Some(name) = repo["full_name"].as_str() {
                categories.stale.items.push(name.to_string());
            }
        }

        score += (stale_repos.len() as f64 * 3.0).min(30.0);
    }

    // Analyze archived repos
    if let Some(archived_repos) = data["archived_repos"].as_array() {
        categories.archived.count += archived_repos.len();
        for repo in archived_repos {
            if let Some(size) = repo["size"].as_u64() {
                categories.archived.total_size_gb += (size * 1024) as f64 / 1_073_741_824.0;
            }
            if let Some(name) = repo["full_name"].as_str() {
                categories.archived.items.push(name.to_string());
            }
        }

        score += (archived_repos.len() as f64 * 2.0).min(20.0);
    }

    // Analyze inactive forks
    if let Some(inactive_forks) = data["inactive_forks"].as_array() {
        categories.versioned.count += inactive_forks.len();
        for fork in inactive_forks {
            if let Some(size) = fork["size"].as_u64() {
                categories.versioned.total_size_gb += (size * 1024) as f64 / 1_073_741_824.0;
            }
        }

        score += (inactive_forks.len() as f64 * 2.0).min(20.0);
    }

    Ok((score.min(100.0), categories))
}

fn merge_category_stats(target: &mut FileCategories, source: FileCategories) {
    target.duplicates.count += source.duplicates.count;
    target.duplicates.total_size_gb += source.duplicates.total_size_gb;
    target.duplicates.items.extend(source.duplicates.items);

    target.versioned.count += source.versioned.count;
    target.versioned.total_size_gb += source.versioned.total_size_gb;
    target.versioned.items.extend(source.versioned.items);

    target.stale.count += source.stale.count;
    target.stale.total_size_gb += source.stale.total_size_gb;
    target.stale.items.extend(source.stale.items);

    target.archived.count += source.archived.count;
    target.archived.total_size_gb += source.archived.total_size_gb;
    target.archived.items.extend(source.archived.items);

    target.large_unused.count += source.large_unused.count;
    target.large_unused.total_size_gb += source.large_unused.total_size_gb;
    target.large_unused.items.extend(source.large_unused.items);
}

fn calculate_overall_score(
    category_scores: &HashMap<String, f64>,
    _file_categories: &FileCategories,
) -> f64 {
    // Weighted average of category scores
    let mut total_score = 0.0;
    let mut weight_sum = 0.0;

    for (category, score) in category_scores {
        let weight = match category.as_str() {
            "Local Files" => 0.4,
            "Google Drive" => 0.35,
            "GitHub" => 0.25,
            _ => 0.0,
        };

        total_score += score * weight;
        weight_sum += weight;
    }

    if weight_sum > 0.0 {
        total_score / weight_sum
    } else {
        0.0
    }
}

fn calculate_total_bloat(categories: &FileCategories) -> f64 {
    categories.duplicates.total_size_gb
        + categories.stale.total_size_gb
        + categories.archived.total_size_gb
        + categories.versioned.total_size_gb
        + categories.large_unused.total_size_gb
        + categories.temporary.total_size_gb
}

fn calculate_potential_savings(categories: &FileCategories) -> f64 {
    // Conservative estimate of what can be safely removed
    categories.duplicates.total_size_gb * 0.9 + // Can remove most duplicates
    categories.stale.total_size_gb * 0.7 +      // Can remove many stale files
    categories.archived.total_size_gb * 0.8 +   // Can remove most archived
    categories.versioned.total_size_gb * 0.5 +  // Can remove some versions
    categories.temporary.total_size_gb * 1.0 // Can remove all temp files
}

fn generate_recommendations(
    categories: &FileCategories,
    _scores: &HashMap<String, f64>,
) -> Vec<Recommendation> {
    let mut recommendations = Vec::new();

    // Duplicates recommendation
    if categories.duplicates.count > 0 {
        recommendations.push(Recommendation {
            priority: if categories.duplicates.total_size_gb > 5.0 { Priority::Critical } else { Priority::High },
            category: "Duplicates".to_string(),
            action: "Remove duplicate files".to_string(),
            impact_gb: categories.duplicates.total_size_gb * 0.9,
            effort: EffortLevel::Easy,
            details: format!(
                "Found {} duplicate files taking up {:.2} GB. Use the duplicate finder to safely remove copies.",
                categories.duplicates.count, categories.duplicates.total_size_gb
            ),
        });
    }

    // Stale files recommendation
    if categories.stale.count > 0 {
        recommendations.push(Recommendation {
            priority: if categories.stale.count > 100 { Priority::High } else { Priority::Medium },
            category: "Stale Files".to_string(),
            action: "Archive or delete old files".to_string(),
            impact_gb: categories.stale.total_size_gb * 0.7,
            effort: EffortLevel::Moderate,
            details: format!(
                "{} files haven't been accessed in over 6 months ({:.2} GB). Review and archive or delete.",
                categories.stale.count, categories.stale.total_size_gb
            ),
        });
    }

    // Large files recommendation
    if categories.large_unused.count > 0 {
        recommendations.push(Recommendation {
            priority: Priority::Medium,
            category: "Large Files".to_string(),
            action: "Review large files".to_string(),
            impact_gb: categories.large_unused.total_size_gb * 0.5,
            effort: EffortLevel::Moderate,
            details: format!(
                "{} large files found ({:.2} GB total). Consider compressing or moving to cloud storage.",
                categories.large_unused.count, categories.large_unused.total_size_gb
            ),
        });
    }

    // Sort by priority and impact
    recommendations.sort_by(|a, b| match (&a.priority, &b.priority) {
        (Priority::Critical, Priority::Critical) => b.impact_gb.partial_cmp(&a.impact_gb).unwrap(),
        (Priority::Critical, _) => std::cmp::Ordering::Less,
        (_, Priority::Critical) => std::cmp::Ordering::Greater,
        (Priority::High, Priority::High) => b.impact_gb.partial_cmp(&a.impact_gb).unwrap(),
        (Priority::High, _) => std::cmp::Ordering::Less,
        (_, Priority::High) => std::cmp::Ordering::Greater,
        _ => b.impact_gb.partial_cmp(&a.impact_gb).unwrap(),
    });

    recommendations
}

impl Default for CategoryStats {
    fn default() -> Self {
        CategoryStats {
            count: 0,
            total_size_gb: 0.0,
            percentage_of_total: 0.0,
            items: Vec::new(),
        }
    }
}

impl Default for FileCategories {
    fn default() -> Self {
        FileCategories {
            duplicates: CategoryStats::default(),
            versioned: CategoryStats::default(),
            stale: CategoryStats::default(),
            archived: CategoryStats::default(),
            large_unused: CategoryStats::default(),
            temporary: CategoryStats::default(),
        }
    }
}
