// src/api/stackburn-api.ts
import { invoke } from '@tauri-apps/api/core';

// Extend window type for Tauri
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

// Safe Tauri invoke wrapper
const safeInvoke = async <T>(cmd: string, args?: any): Promise<T | null> => {
  try {
    // Check if Tauri is available
    if (typeof window === 'undefined' || !window.__TAURI__) {
      if (import.meta.env.DEV) {
        console.warn(`Tauri not available, skipping invoke('${cmd}')`);
      }
      return null;
    }
    
    return await invoke<T>(cmd, args);
  } catch (error) {
    console.error(`Tauri invoke('${cmd}') failed:`, error);
    throw error;
  }
};

// Types matching the Rust backend
export interface DriveFile {
  id: string;
  name: string;
  mime_type: string;
  size?: number;
  created_time: string;
  modified_time: string;
  accessed_time?: string;
  parents: string[];
  is_trashed: boolean;
  is_shared: boolean;
}

export interface DriveScanResult {
  total_files: number;
  total_size: number;
  file_types: Record<string, number>;
  largest_files: DriveFile[];
  oldest_files: DriveFile[];
  scan_timestamp: string;
}

export interface LocalFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  modified_time: string;
  accessed_time?: string;
  is_hidden: boolean;
  hash?: string;
}

export interface DuplicateGroup {
  hash: string;
  total_size: number;
  files: LocalFile[];
}

export interface FolderStats {
  total_files: number;
  total_directories: number;
  total_size: number;
  file_types: Record<string, number>;
  largest_files: LocalFile[];
  duplicates: DuplicateGroup[];
  unused_files: LocalFile[];
  scan_timestamp: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  description?: string;
  is_private: boolean;
  is_fork: boolean;
  parent_repo?: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  language?: string;
  default_branch: string;
  open_issues_count: number;
  forks_count: number;
  stargazers_count: number;
  has_wiki: boolean;
  has_pages: boolean;
  archived: boolean;
}

export interface GitHubScanResult {
  total_repos: number;
  private_repos: number;
  public_repos: number;
  total_size_kb: number;
  stale_repos: GitHubRepo[];
  inactive_forks: GitHubRepo[];
  archived_repos: GitHubRepo[];
  repos_by_language: Record<string, number>;
  largest_repos: GitHubRepo[];
  orphaned_branches: Record<string, any[]>;
  scan_timestamp: string;
}

export interface BurnScoreInput {
  drive_data?: any;
  local_data?: any;
  github_data?: any;
}

export interface CategoryStats {
  count: number;
  total_size_gb: number;
  percentage_of_total: number;
  items: string[];
}

export interface FileCategories {
  duplicates: CategoryStats;
  versioned: CategoryStats;
  stale: CategoryStats;
  archived: CategoryStats;
  large_unused: CategoryStats;
  temporary: CategoryStats;
}

export interface Recommendation {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  action: string;
  impact_gb: number;
  effort: 'Easy' | 'Moderate' | 'Complex';
  details: string;
}

export interface BurnScoreResult {
  overall_score: number;
  category_scores: Record<string, number>;
  total_bloat_size_gb: number;
  total_files_scanned: number;
  recommendations: Recommendation[];
  file_categories: FileCategories;
  potential_savings_gb: number;
  calculated_at: string;
}

// Google Drive Scanner API
export const driveScanner = {
  /**
   * Initialize OAuth flow for Google Drive
   * Returns the authorization URL to open in browser
   */
  async initOAuthFlow(): Promise<string | null> {
    return safeInvoke<string>('init_oauth_flow');
  },

  /**
   * Handle OAuth callback with authorization code
   */
  async handleOAuthCallback(code: string): Promise<boolean | null> {
    return safeInvoke<boolean>('handle_oauth_callback', { code });
  },

  /**
   * Scan Google Drive for files
   */
  async scanDrive(): Promise<DriveScanResult | null> {
    return safeInvoke<DriveScanResult>('scan_drive');
  },

  /**
   * Get Drive metadata including storage quota
   */
  async getDriveMetadata(): Promise<any> {
    return safeInvoke<any>('get_drive_metadata');
  },
};

// Local Scanner API
export const localScanner = {
  /**
   * Scan a directory for files
   */
  async scanDirectory(path: string): Promise<FolderStats | null> {
    return safeInvoke<FolderStats>('scan_directory', { path });
  },

  /**
   * Get folder statistics
   */
  async getFolderStats(path: string): Promise<any> {
    return safeInvoke<any>('get_folder_stats', { path });
  },

  /**
   * Detect duplicate files across multiple paths
   */
  async detectDuplicates(paths: string[]): Promise<DuplicateGroup[] | null> {
    return safeInvoke<DuplicateGroup[]>('detect_duplicates', { paths });
  },
};

// GitHub Scanner API
export const githubScanner = {
  /**
   * Authenticate with GitHub token
   */
  async authenticate(token: string): Promise<boolean | null> {
    return safeInvoke<boolean>('authenticate_github', { token });
  },

  /**
   * Scan all repositories
   */
  async scanRepositories(): Promise<GitHubScanResult | null> {
    return safeInvoke<GitHubScanResult>('scan_repositories');
  },

  /**
   * Get only stale repositories
   */
  async getStaleRepos(): Promise<GitHubRepo[] | null> {
    return safeInvoke<GitHubRepo[]>('get_stale_repos');
  },
};

// Burn Score Engine API
export const burnScoreEngine = {
  /**
   * Calculate burn score from all scan results
   */
  async calculateBurnScore(input: BurnScoreInput): Promise<BurnScoreResult | null> {
    return safeInvoke<BurnScoreResult>('calculate_burn_score', { input });
  },

  /**
   * Get file categories breakdown
   */
  async getFileCategories(input: BurnScoreInput): Promise<FileCategories | null> {
    return safeInvoke<FileCategories>('get_file_categories', { input });
  },

  /**
   * Generate a text report from burn score results
   */
  async generateReport(burnScore: BurnScoreResult): Promise<string | null> {
    return safeInvoke<string>('generate_report', { burnScore });
  },
};

// Utility functions for frontend integration
export const stackBurnUtils = {
  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format date to relative time
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  },

  /**
   * Get burn score color based on score value
   */
  getScoreColor(score: number): string {
    if (score < 30) return '#10b981'; // Green
    if (score < 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  },

  /**
   * Get priority color
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'Critical': return '#dc2626';
      case 'High': return '#ea580c';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  },
};