import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setConnectionStatus } from '../store/configSlice';
import { ConfigManager } from '../services/ConfigManager';
import { Settings, Wifi, WifiOff } from 'lucide-react';

const ConfigPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { config, isConnected, connectionMessage, backendService } = useSelector((state: RootState) => state.config);
  const [backendUrl, setBackendUrl] = useState(config.backendUrl || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleUpdateBackendUrl = async () => {
    if (backendUrl !== config.backendUrl) {
      await ConfigManager.updateBackendUrl(backendUrl);
    }
  };

  const handleTestConnection = async () => {
    if (!backendService) return;
    
    setIsTesting(true);
    try {
      const result = await backendService.testConnection();
      dispatch(setConnectionStatus(result));
    } catch (error) {
      dispatch(setConnectionStatus({ 
        connected: false, 
        message: 'Connection test failed' 
      }));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="config-panel">
      <div className="config-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="config-title">
          <Settings size={16} />
          Configuration
        </div>
        <div className="connection-status">
          {isConnected ? <Wifi size={16} className="connected" /> : <WifiOff size={16} className="disconnected" />}
          <span className={isConnected ? 'connected' : 'disconnected'}>
            {connectionMessage}
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="config-content">
          <div className="config-section">
            <label htmlFor="backend-url">Backend URL:</label>
            <div className="input-group">
              <input
                id="backend-url"
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                onBlur={handleUpdateBackendUrl}
                placeholder="http://localhost:8000"
                className="config-input"
              />
              <button
                onClick={handleTestConnection}
                disabled={isTesting || !backendUrl}
                className="test-button"
              >
                {isTesting ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>
          
          <div className="config-info">
            <p>🚀 Make sure your AI4U backend server is running on the specified URL.</p>
            <p>💡 Learning Gates require backend support for quiz questions.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigPanel;