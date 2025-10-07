import { Target, Trophy, Unlock, Zap } from "lucide-react";
import { QuizStats } from "../store/quizSlice";

const LearningProgress = ({
  handleToggleLearningGates,
  learningGatesEnabled,
  stats,
}: {
  handleToggleLearningGates: () => void;
  learningGatesEnabled: boolean;
  stats: QuizStats;
}) => {
  return (
    <div className="learning-progress">
      <div className="progress-header">
        <h2 className="progress-title">🎓 Learning Progress</h2>
        <button
          className={`toggle-button ${learningGatesEnabled ? "" : "disabled"}`}
          onClick={handleToggleLearningGates}
        >
          {learningGatesEnabled ? "Disable" : "Enable"} Learning Gates
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Trophy
            className="stat-icon"
            size={20}
            style={{ color: "#f59e0b" }}
          />
          <div className="stat-content">
            <div className="stat-label">Level</div>
            <div className="stat-value">{stats.level}</div>
          </div>
        </div>

        <div className="stat-card">
          <Zap className="stat-icon" size={20} style={{ color: "#2563eb" }} />
          <div className="stat-content">
            <div className="stat-label">Streak</div>
            <div className="stat-value">{stats.streak}</div>
          </div>
        </div>

        <div className="stat-card">
          <Target
            className="stat-icon"
            size={20}
            style={{ color: "#8b5cf6" }}
          />
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
  );
};

export default LearningProgress;
