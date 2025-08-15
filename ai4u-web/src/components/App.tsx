// src/components/App.tsx - Simplified with proper CSS classes
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { ConfigManager } from '../services/ConfigManager';
import { BackendService } from '../services/BackendService';
import { LearningGateService } from '../services/LearningGateService';
import { setConfig, setBackendService, setLearningGateService, setConnectionStatus, setLearningGatesEnabled } from '../store/configSlice';
import { addNotification } from '../store/uiSlice';
import { sendMessage, addMessage } from '../store/chatSlice';
import { startQuiz } from '../store/quizSlice';
import QuizOverlay from './QuizOverlay';
import NotificationContainer from './NotificationContainer';
import { 
  Menu, 
  Home, 
  Book, 
  Code, 
  MessageSquare, 
  Brain, 
  User, 
  Search, 
  Send, 
  Loader,
  Trophy,
  Zap,
  Target,
  Unlock
} from 'lucide-react';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { config, isConnected, learningGatesEnabled } = useAppSelector((state) => state.config);
  const { messages, isLoading, error } = useAppSelector((state) => state.chat);
  const { isActive: quizActive, stats } = useAppSelector((state) => state.quiz);
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [inputMessage, setInputMessage] = useState('');

  // Get services from Redux store
  const backendService = useAppSelector((state) => (state.config as any).backendService);
  const learningGateService = useAppSelector((state) => (state.config as any).learningGateService);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const initialConfig = ConfigManager.getConfig();
        dispatch(setConfig(initialConfig));

        const backendService = new BackendService(initialConfig.backendUrl);
        dispatch(setBackendService(backendService));

        const learningGateService = new LearningGateService({
          enabled: true,
          questionsPerGate: 3,
          gateFrequency: 1,
          difficulty: 'mixed',
          topics: ['JavaScript', 'TypeScript', 'Python', 'React']
        });
        dispatch(setLearningGateService(learningGateService));

        await testConnection(backendService);

        const handleConfigChange = (event: CustomEvent) => {
          const newConfig = event.detail;
          dispatch(setConfig(newConfig));
          backendService.setBackendUrl(newConfig.backendUrl);
          testConnection(backendService);
        };

        window.addEventListener('ai4u_config_changed', handleConfigChange as EventListener);

        return () => {
          window.removeEventListener('ai4u_config_changed', handleConfigChange as EventListener);
        };
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch(addNotification({
          type: 'error',
          message: 'App initialization failed'
        }));
      }
    };

    initializeApp();
  }, [dispatch]);

  const testConnection = async (service: BackendService) => {
    try {
      const result = await service.testConnection();
      dispatch(setConnectionStatus(result));
    } catch (error) {
      console.error('Connection test failed:', error);
      dispatch(setConnectionStatus({
        connected: false,
        message: 'Connection test failed'
      }));
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isConnected || !backendService || !learningGateService) {
      if (!isConnected) {
        dispatch(addNotification({
          type: 'warning',
          message: 'Please connect to backend first'
        }));
      }
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');

    dispatch(addMessage({
      type: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    }));

    try {
      const shouldShowGate = learningGateService.shouldShowGate();
      
      if (shouldShowGate) {
        const questions = await backendService.getQuizQuestions(3);
        if (questions && questions.length > 0) {
          dispatch(startQuiz({
            questions,
            stats: learningGateService.getStats(),
            pendingMessage: userMessage
          }));
          return;
        }
      }

      const result = await dispatch(sendMessage(userMessage));
      
      if (sendMessage.fulfilled.match(result)) {
        const response = result.payload;
        
        if (response.type === 'learning_gate') {
          dispatch(startQuiz({
            questions: [response.question],
            stats: response.stats || learningGateService.getStats(),
            pendingMessage: userMessage
          }));
        }
      } else if (sendMessage.rejected.match(result)) {
        dispatch(addNotification({
          type: 'error',
          message: result.payload || 'Failed to send message'
        }));
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to send message'
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleLearningGates = () => {
    dispatch(setLearningGatesEnabled(!learningGatesEnabled));
  };

  const handleSuggestedTopic = (topic: string) => {
    setInputMessage(topic);
  };

  const suggestedTopics = [
    "🧠 Explain React hooks",
    "🔧 Debug this JavaScript error", 
    "💡 Best practices for TypeScript",
    "❤️ Code review checklist",
    "✅ Optimize this algorithm"
  ];

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'expanded' : 'collapsed'}`}>
        {/* Logo */}
        <div className="logo-section">
          <div className="logo-icon">
            <Brain size={20} />
          </div>
          {showSidebar && <span className="logo-text">AI4U</span>}
        </div>

        {/* Navigation */}
        <div className="nav-section">
          <button className="nav-item active">
            <Home className="nav-icon" size={20} />
            {showSidebar && <span>Home</span>}
          </button>
          
          <button className="nav-item">
            <Book className="nav-icon" size={20} />
            {showSidebar && <span>Library</span>}
          </button>
          
          <button className="nav-item">
            <Code className="nav-icon" size={20} />
            {showSidebar && <span>Coding</span>}
          </button>
          
          <button className="nav-item">
            <MessageSquare className="nav-icon" size={20} />
            {showSidebar && <span>Chats</span>}
          </button>

          {showSidebar && (
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ color: '#b3b3b3', fontSize: '12px', fontWeight: 500, marginBottom: '12px' }}>
                Library
              </h3>
              <button className="nav-item">
                <span style={{ fontSize: '18px' }}>+</span>
                Create a Thread
              </button>
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="user-section">
          <button className="sign-in-button">
            {showSidebar ? 'Sign In' : <User size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="app-header">
          <div className="header-left">
            <button 
              className="menu-button"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu size={20} />
            </button>
            <h1 className="app-title">🤖 AI4U - Learn While You Code</h1>
          </div>
          <div className="connection-status">
            <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span className={`status-text ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="learning-progress">
          <div className="progress-header">
            <h2 className="progress-title">
              🎓 Learning Progress
            </h2>
            <button 
              className={`toggle-button ${learningGatesEnabled ? '' : 'disabled'}`}
              onClick={handleToggleLearningGates}
            >
              {learningGatesEnabled ? 'Disable' : 'Enable'} Learning Gates
            </button>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <Trophy className="stat-icon" size={20} style={{ color: '#f59e0b' }} />
              <div className="stat-content">
                <div className="stat-label">Level</div>
                <div className="stat-value">{stats.level}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <Zap className="stat-icon" size={20} style={{ color: '#2563eb' }} />
              <div className="stat-content">
                <div className="stat-label">Streak</div>
                <div className="stat-value">{stats.streak}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <Target className="stat-icon" size={20} style={{ color: '#8b5cf6' }} />
              <div className="stat-content">
                <div className="stat-label">Accuracy</div>
                <div className="stat-value">{stats.accuracy}%</div>
              </div>
            </div>
            
            <div className="stat-card unlocked">
              <Unlock className="stat-icon" size={20} />
              <div className="stat-content">
                <div className="stat-label">Responses Left</div>
                <div className="stat-value">{stats.unlockedResponses}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome-state">
                <div className="welcome-icon">🤖</div>
                <h2 className="welcome-title">Welcome to AI4U</h2>
                <p className="welcome-subtitle">Ask anything about coding or mention a topic to get started</p>
                
                <div className="topic-pills">
                  {suggestedTopics.map((topic, index) => (
                    <button 
                      key={index}
                      className="topic-pill"
                      onClick={() => handleSuggestedTopic(topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index} className={`message ${message.type}`}>
                    {message.type === 'bot' && (
                      <div className="message-avatar bot">
                        <Brain size={16} />
                      </div>
                    )}
                    
                    <div className={`message-bubble ${message.type}`}>
                      <div>{message.message || message.response}</div>
                      <div className="message-info">
                        {message.source && (
                          <span className="message-source">{message.source}</span>
                        )}
                        <span>{message.timestamp && new Date(message.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="message-avatar user">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="message bot">
                    <div className="message-avatar bot">
                      <Brain size={16} />
                    </div>
                    <div className="message-bubble bot">
                      <div className="loading-indicator">
                        <div className="loading-dots">
                          <div className="loading-dot"></div>
                          <div className="loading-dot"></div>
                          <div className="loading-dot"></div>
                        </div>
                        <span style={{ marginLeft: '8px', color: '#b3b3b3', fontSize: '14px' }}>
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="message bot">
                    <div className="message-avatar bot" style={{ background: '#ef4444' }}>
                      <span>!</span>
                    </div>
                    <div className="message-bubble bot" style={{ borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                      <div style={{ color: '#ef4444', fontWeight: 500 }}>Error</div>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>{error}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="input-container">
              <Search className="search-icon" size={20} />
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? "Ask me anything about coding..." : "Please connect to backend first"}
                disabled={!isConnected || isLoading}
                rows={1}
                className="message-input"
                style={{ 
                  minHeight: '24px',
                  maxHeight: '120px',
                  overflow: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <div className="input-actions">
                <button className="attach-button">
                  📎
                </button>
                <button 
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !isConnected || isLoading}
                >
                  {isLoading ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {quizActive && <QuizOverlay />}
      <NotificationContainer />
    </div>
  );
};

export default App;