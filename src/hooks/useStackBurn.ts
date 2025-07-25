// src/hooks/useStackBurn.ts
import { useState, useCallback } from 'react';
import {
  driveScanner,
  localScanner,
  githubScanner,
  burnScoreEngine,
  DriveScanResult,
  FolderStats,
  GitHubScanResult,
  BurnScoreResult,
  BurnScoreInput,
} from '../api/stackburn-api';

export interface ScanProgress {
  drive: 'idle' | 'scanning' | 'complete' | 'error';
  local: 'idle' | 'scanning' | 'complete' | 'error';
  github: 'idle' | 'scanning' | 'complete' | 'error';
}

export interface ScanResults {
  drive?: DriveScanResult;
  local?: FolderStats;
  github?: GitHubScanResult;
  burnScore?: BurnScoreResult;
}

export const useStackBurn = () => {
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    drive: 'idle',
    local: 'idle',
    github: 'idle',
  });
  
  const [scanResults, setScanResults] = useState<ScanResults>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);

  // Google Drive OAuth flow
  const initDriveAuth = useCallback(async () => {
    try {
      const authUrl = await driveScanner.initOAuthFlow();
      // Open auth URL in browser
      window.open(authUrl, '_blank');
      return authUrl;
    } catch (error) {
      setErrors(prev => ({ ...prev, drive: error.message }));
      throw error;
    }
  }, []);

  const handleDriveCallback = useCallback(async (code: string) => {
    try {
      const success = await driveScanner.handleOAuthCallback(code);
      if (success) {
        // Auto-start Drive scan after successful auth
        scanDrive();
      }
      return success;
    } catch (error) {
      setErrors(prev => ({ ...prev, drive: error.message }));
      throw error;
    }
  }, []);

  // Scan Google Drive
  const scanDrive = useCallback(async () => {
    setScanProgress(prev => ({ ...prev, drive: 'scanning' }));
    setErrors(prev => ({ ...prev, drive: undefined }));
    
    try {
      const result = await driveScanner.scanDrive();
      setScanResults(prev => ({ ...prev, drive: result }));
      setScanProgress(prev => ({ ...prev, drive: 'complete' }));
      return result;
    } catch (error) {
      setErrors(prev => ({ ...prev, drive: error.message }));
      setScanProgress(prev => ({ ...prev, drive: 'error' }));
      throw error;
    }
  }, []);

  // Scan local directory
  const scanLocal = useCallback(async (path: string) => {
    setScanProgress(prev => ({ ...prev, local: 'scanning' }));
    setErrors(prev => ({ ...prev, local: undefined }));
    
    try {
      const result = await localScanner.scanDirectory(path);
      setScanResults(prev => ({ ...prev, local: result }));
      setScanProgress(prev => ({ ...prev, local: 'complete' }));
      return result;
    } catch (error) {
      setErrors(prev => ({ ...prev, local: error.message }));
      setScanProgress(prev => ({ ...prev, local: 'error' }));
      throw error;
    }
  }, []);

  // Authenticate and scan GitHub
  const authenticateGitHub = useCallback(async (token: string) => {
    try {
      const success = await githubScanner.authenticate(token);
      if (success) {
        // Auto-start GitHub scan after successful auth
        scanGitHub();
      }
      return success;
    } catch (error) {
      setErrors(prev => ({ ...prev, github: error.message }));
      throw error;
    }
  }, []);

  const scanGitHub = useCallback(async () => {
    setScanProgress(prev => ({ ...prev, github: 'scanning' }));
    setErrors(prev => ({ ...prev, github: undefined }));
    
    try {
      const result = await githubScanner.scanRepositories();
      setScanResults(prev => ({ ...prev, github: result }));
      setScanProgress(prev => ({ ...prev, github: 'complete' }));
      return result;
    } catch (error) {
      setErrors(prev => ({ ...prev, github: error.message }));
      setScanProgress(prev => ({ ...prev, github: 'error' }));
      throw error;
    }
  }, []);

  // Calculate burn score from all results
  const calculateBurnScore = useCallback(async () => {
    setIsCalculatingScore(true);
    setErrors(prev => ({ ...prev, burnScore: undefined }));
    
    try {
      const input: BurnScoreInput = {
        drive_data: scanResults.drive,
        local_data: scanResults.local,
        github_data: scanResults.github,
      };
      
      const result = await burnScoreEngine.calculateBurnScore(input);
      setScanResults(prev => ({ ...prev, burnScore: result }));
      setIsCalculatingScore(false);
      return result;
    } catch (error) {
      setErrors(prev => ({ ...prev, burnScore: error.message }));
      setIsCalculatingScore(false);
      throw error;
    }
  }, [scanResults]);

  // Generate report
  const generateReport = useCallback(async () => {
    if (!scanResults.burnScore) {
      throw new Error('No burn score results available');
    }
    
    try {
      const report = await burnScoreEngine.generateReport(scanResults.burnScore);
      return report;
    } catch (error) {
      setErrors(prev => ({ ...prev, report: error.message }));
      throw error;
    }
  }, [scanResults.burnScore]);

  // Reset all scans
  const resetScans = useCallback(() => {
    setScanProgress({
      drive: 'idle',
      local: 'idle',
      github: 'idle',
    });
    setScanResults({});
    setErrors({});
    setIsCalculatingScore(false);
  }, []);

  // Check if ready to calculate score
  const isReadyToCalculate = useCallback(() => {
    const hasAnyCompleteScans = 
      scanProgress.drive === 'complete' ||
      scanProgress.local === 'complete' ||
      scanProgress.github === 'complete';
    
    return hasAnyCompleteScans && !isCalculatingScore;
  }, [scanProgress, isCalculatingScore]);

  return {
    // State
    scanProgress,
    scanResults,
    errors,
    isCalculatingScore,
    
    // Actions
    initDriveAuth,
    handleDriveCallback,
    scanDrive,
    scanLocal,
    authenticateGitHub,
    scanGitHub,
    calculateBurnScore,
    generateReport,
    resetScans,
    
    // Computed
    isReadyToCalculate,
  };
};

// Example usage in a component:
/*
function StackBurnDashboard() {
  const {
    scanProgress,
    scanResults,
    errors,
    isCalculatingScore,
    initDriveAuth,
    scanLocal,
    authenticateGitHub,
    calculateBurnScore,
    isReadyToCalculate,
  } = useStackBurn();

  return (
    <div>
      {// Drive Scanner}
      <button onClick={initDriveAuth}>
        Connect Google Drive
      </button>
      
      {// Local Scanner}
      <button onClick={() => scanLocal('C:\\Users\\YourName\\Documents')}>
        Scan Documents Folder
      </button>
      
      {// GitHub Scanner}
      <button onClick={() => authenticateGitHub('your-github-token')}>
        Connect GitHub
      </button>
      
      {// Calculate Score}
      <button 
        onClick={calculateBurnScore}
        disabled={!isReadyToCalculate()}
      >
        Calculate Burn Score
      </button>
      
      {// Display Results}
      {scanResults.burnScore && (
        <div>
          <h2>Burn Score: {scanResults.burnScore.overall_score.toFixed(1)}/100</h2>
          <p>Total Bloat: {scanResults.burnScore.total_bloat_size_gb.toFixed(2)} GB</p>
          <p>Potential Savings: {scanResults.burnScore.potential_savings_gb.toFixed(2)} GB</p>
        </div>
      )}
    </div>
  );
}
*/