import { useEffect, useState } from "react";

const TauriTest = () => {
  const [isTauri, setIsTauri] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    if (import.meta.env.DEV) {
      console.log(message);
    }
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog("TauriTest component mounted");
    
    // Check if we're in Tauri environment
    if (window.__TAURI__) {
      addLog("Tauri environment detected");
      setIsTauri(true);
    } else {
      addLog("Not in Tauri environment (running in browser)");
    }
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      minHeight: '100vh',
      fontFamily: 'monospace'
    }}>
      <h1>StackBurn Tauri Test</h1>
      <p>Environment: {isTauri ? 'Tauri Desktop App' : 'Web Browser'}</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Debug Logs:</h2>
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '10px', 
          borderRadius: '5px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => addLog("Button clicked!")}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  );
};

export default TauriTest;