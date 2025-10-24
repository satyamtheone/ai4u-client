import React from "react";
import { CheckCircle, XCircle, Award, Target } from "lucide-react";
import DynamicButton from "../commonComponents/DynamicButton";

interface QuizResultsProps {
  results: any;
  onClose: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ results, onClose }) => {
  const { results: questionResults, updated_stats } = results;

  const correctCount =
    questionResults?.filter((r: any) => r.correct).length || 0;
  const totalQuestions = questionResults?.length || 0;
  const totalPoints =
    questionResults?.reduce(
      (sum: number, r: any) => sum + (r.points_earned || 0),
      0
    ) || 0;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/90 backdrop-blur-md flex items-center justify-center z-[1000] animate-fadeInBackdrop">
      <div className="bg-[#1a1a1a] border-2 border-emerald-500 rounded-2xl p-8 max-w-[600px] w-[90%] max-height-[90vh] max-h-[90vh] overflow-y-auto text-center animate-slideInQuiz">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            {correctCount > totalQuestions / 2 ? (
              <Award size={64} className="text-emerald-400" />
            ) : (
              <Target size={64} className="text-amber-400" />
            )}
          </div>

          <h2 className="text-[28px] font-bold my-4 bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
            Quiz Complete!
          </h2>

          <div className="flex justify-center gap-6 mt-5">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-[#b3b3b3]">Score:</span>
              <span className="text-lg font-bold text-white">
                {correctCount}/{totalQuestions}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-[#b3b3b3]">Points:</span>
              <span className="text-lg font-bold text-white">
                {totalPoints}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-[#b3b3b3]">Unlocked:</span>
              <span className="text-lg font-bold text-emerald-500">
                {updated_stats?.unlockedResponses || 1} responses
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-left mb-8">
          {/* Breakdown */}
          <div className="mb-6">
            <h3 className="mb-4 text-white">Question Breakdown:</h3>
            <div className="flex flex-col gap-2">
              {questionResults?.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded border ${
                    result.correct
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-red-500 bg-red-500/10"
                  }`}
                >
                  <div className="text-base">
                    {result.correct ? (
                      <CheckCircle size={20} className="text-emerald-400" />
                    ) : (
                      <XCircle size={20} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-semibold text-xs">Q{index + 1}</span>
                    <span className="text-sm">
                      {result.correct ? "Correct" : "Incorrect"}
                    </span>
                    {result.points_earned && (
                      <span className="ml-auto text-xs font-semibold text-emerald-500">
                        +{result.points_earned} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Updated stats (optional) */}
          {updated_stats && (
            <div>
              <h3 className="mb-3 text-white">Your Progress:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 rounded border border-[#404040] bg-[#2a2a2a]">
                  <span className="text-xs text-[#b3b3b3]">Level:</span>
                  <span className="text-sm font-semibold text-white">
                    {updated_stats.level}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded border border-[#404040] bg-[#2a2a2a]">
                  <span className="text-xs text-[#b3b3b3]">Streak:</span>
                  <span className="text-sm font-semibold text-white">
                    {updated_stats.currentStreak || updated_stats.streak}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded border border-[#404040] bg-[#2a2a2a]">
                  <span className="text-xs text-[#b3b3b3]">Accuracy:</span>
                  <span className="text-sm font-semibold text-white">
                    {updated_stats.accuracy}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Continue */}

        <DynamicButton
          label="Continue Coding"
          variant="secondary"
          onClick={onClose}
          fullWidth
        />
      </div>
    </div>
  );
};

export default QuizResults;
