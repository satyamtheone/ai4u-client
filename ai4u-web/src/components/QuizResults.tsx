import React from 'react';
import { CheckCircle, XCircle, Award, Target } from 'lucide-react';

interface QuizResultsProps {
  results: any;
  onClose: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ results, onClose }) => {
  const { results: questionResults, updated_stats } = results;
  
  const correctCount = questionResults?.filter((r: any) => r.correct).length || 0;
  const totalQuestions = questionResults?.length || 0;
  const totalPoints = questionResults?.reduce((sum: number, r: any) => sum + (r.points_earned || 0), 0) || 0;

  return (
    <div className="quiz-overlay">
      <div className="quiz-results-container">
        <div className="results-header">
          <div className="results-icon">
            {correctCount > totalQuestions / 2 ? (
              <Award size={64} className="success" />
            ) : (
              <Target size={64} className="warning" />
            )}
          </div>
          <h2 className="results-title">Quiz Complete!</h2>
          <div className="results-summary">
            <div className="summary-item">
              <span className="summary-label">Score:</span>
              <span className="summary-value">{correctCount}/{totalQuestions}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Points:</span>
              <span className="summary-value">{totalPoints}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Unlocked:</span>
              <span className="summary-value highlight">{updated_stats?.unlockedResponses || 1} responses</span>
            </div>
          </div>
        </div>

        <div className="results-content">
          <div className="question-breakdown">
            <h3>Question Breakdown:</h3>
            <div className="breakdown-list">
              {questionResults?.map((result: any, index: number) => (
                <div key={index} className={`breakdown-item ${result.correct ? 'correct' : 'incorrect'}`}>
                  <div className="breakdown-icon">
                    {result.correct ? (
                      <CheckCircle size={20} className="success" />
                    ) : (
                      <XCircle size={20} className="error" />
                    )}
                  </div>
                  <div className="breakdown-content">
                    <span className="breakdown-number">Q{index + 1}</span>
                    <span className="breakdown-status">
                      {result.correct ? 'Correct' : 'Incorrect'}
                    </span>
                    {result.points_earned && (
                      <span className="breakdown-points">+{result.points_earned} pts</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {updated_stats && (
            <div className="updated-stats">
              <h3>Your Progress:</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Level:</span>
                  <span className="stat-value">{updated_stats.level}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Streak:</span>
                  <span className="stat-value">{updated_stats.currentStreak || updated_stats.streak}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Accuracy:</span>
                  <span className="stat-value">{updated_stats.accuracy}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button onClick={onClose} className="continue-button">
          Continue Coding
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
