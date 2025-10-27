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
      <div className="bg-[#1a1a1a] border-2 border-emerald-500 rounded-2xl p-8 max-w-[600px] w-[90%] max-h-[90vh] overflow-y-auto text-center animate-slideInQuiz">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[64px] mb-4">
            {correctCount > totalQuestions / 2 ? "🎉" : "💪"}
          </div>
          <h2 className="text-[28px] font-bold my-4 bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
            Quiz Complete!
          </h2>

          <div className="flex justify-center gap-6 mt-5">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400">Score:</span>
              <span className="text-lg font-bold text-white">
                {correctCount}/{totalQuestions}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400">Points:</span>
              <span className="text-lg font-bold text-white">
                {totalPoints}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400">Unlocked:</span>
              <span className="text-lg font-bold text-emerald-500">
                {updated_stats?.unlockedResponses || 1} responses
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="text-left mb-8">
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
                <div className="text-base">{result.correct ? "✅" : "❌"}</div>
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

        {/* Continue */}
        <button
          onClick={onClose}
          className="w-full py-4 px-6 bg-blue-600 text-white rounded-xl text-base font-semibold transition-all hover:bg-blue-700 hover:-translate-y-0.5"
        >
          Continue Coding
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
