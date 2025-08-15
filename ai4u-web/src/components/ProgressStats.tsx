import React from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../hooks/redux';
import { setLearningGatesEnabled } from '../store/configSlice';
import { Trophy, Target, Zap, Unlock } from 'lucide-react';

interface ProgressStatsProps {
  stats: {
    level: number;
    streak: number;
    currentStreak?: number; // Made optional to handle both cases
    accuracy: number;
    totalQuestions: number;
    unlockedResponses: number;
  };
}

const ProgressStats: React.FC<ProgressStatsProps> = ({ stats }) => {
  const dispatch = useDispatch();
  const { learningGatesEnabled } = useAppSelector((state) => state.config);

  const handleToggleLearningGates = () => {
    dispatch(setLearningGatesEnabled(!learningGatesEnabled));
  };

  // Fixed: Handle both streak and currentStreak
  const displayStreak = stats.currentStreak !== undefined ? stats.currentStreak : stats.streak;

  return (
    <div className="progress-stats">
      <div className="stats-header">
        <div className="stats-title">
          <span className="icon">🎓</span>
          Learning Progress
        </div>
        <button 
          className={`toggle-button ${learningGatesEnabled ? 'enabled' : 'disabled'}`}
          onClick={handleToggleLearningGates}
        >
          {learningGatesEnabled ? 'Disable' : 'Enable'} Learning Gates
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-item">
          <Trophy className="stat-icon" size={18} />
          <div className="stat-content">
            <div className="stat-label">Level</div>
            <div className="stat-value">{stats.level}</div>
          </div>
        </div>
        
        <div className="stat-item">
          <Zap className="stat-icon" size={18} />
          <div className="stat-content">
            <div className="stat-label">Streak</div>
            <div className="stat-value">{displayStreak}</div>
          </div>
        </div>
        
        <div className="stat-item">
          <Target className="stat-icon" size={18} />
          <div className="stat-content">
            <div className="stat-label">Accuracy</div>
            <div className="stat-value">{stats.accuracy}%</div>
          </div>
        </div>
        
        <div className="stat-item unlocked">
          <Unlock className="stat-icon" size={18} />
          <div className="stat-content">
            <div className="stat-label">Responses Left</div>
            <div className="stat-value">{stats.unlockedResponses}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressStats;
