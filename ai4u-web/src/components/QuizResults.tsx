import React from "react";
import { CheckCircle, XCircle, Award, Target } from "lucide-react";
import DynamicButton from "../commonComponents/DynamicButton";
import ModalProvider from "../commonComponents/Dialog/ModalProvider";
import { FormLabelHeader } from "../commonComponents/FormLabelHeader";
import Chip from "../commonComponents/Chip";

interface QuizResultsProps {
  results: any;
  onClose: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ results, onClose }) => {
  const { results: questionResults, updated_stats, summary } = results.data;

  const correctCount =
    questionResults?.filter((r: any) => r.correct).length || 0;
  const totalQuestions = questionResults?.length || 0;
  const totalPoints =
    questionResults?.reduce(
      (sum: number, r: any) => sum + (r.points_earned || 0),
      0
    ) || 0;

  return (
    <ModalProvider
      onClose={() => {
        onClose();
      }}
      children={
        <div className="w-full flex flex-col gap-4">
          <FormLabelHeader
            icon={correctCount > totalQuestions / 2 ? Award : Target}
            iconClass={`h-20 w-20  ${
              correctCount > totalQuestions / 2
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
            iconBg="bg-transparent"
            title="Quiz Complete!"
          />
          {/* Header */}

          <div className="flex justify-between">
            <Chip
              label={`Score: ${
                (correctCount / totalQuestions).toFixed(2) || 0
              }`}
              className="text-xs"
              variant="error"
            />
            <Chip
              label={`Points: ${
                updated_stats?.unlockedResponses || 1
              } responses`}
              className="text-xs"
              variant="default"
            />
            <Chip
              label={`Unlocked: ${updated_stats.unlocked_responses}`}
              className="text-xs"
              variant="warning"
            />
          </div>

          {/* Content */}
          <div className="text-left my-3">
            {/* Breakdown */}
            <div>
              <h3 className="mb-4 text-sm font-bold">Question Breakdown:</h3>
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
                      <span className="font-semibold text-xs">
                        Q{index + 1}
                      </span>
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
            <div>
              <h3 className=" text-sm font-bold my-4 ">
                Your result of this quiz:-
              </h3>
              <div className="flex justify-between max-sm:flex-wrap gap-2 mt-2 mb-4">
                <Chip
                  label={`Accuracy: ${summary.accuracy.toFixed(2) || 0}`}
                  className="text-xs"
                  variant="warning"
                />
                <Chip
                  label={`correct_answers: ${summary.correct_answers}/${summary.total_questions}`}
                  className="text-xs"
                  variant="primary"
                />
                <Chip
                  label={`points: ${summary.points_earned}`}
                  className="text-xs"
                  variant="success"
                />
              </div>
            </div>

            <div className="my-4">
              {updated_stats && (
                <div>
                  <h3 className=" text-sm font-bold my-4 ">Total Progress:-</h3>
                  <div className="flex justify-between">
                    <Chip
                      label={`Level: ${updated_stats.level}`}
                      className="rounded-md  text-md"
                      variant="success"
                    />
                    <Chip
                      label={`Streak: ${
                        updated_stats.currentStreak || updated_stats.streak || 0
                      }`}
                      className="rounded-md  text-md"
                      variant="warning"
                    />
                    <Chip
                      label={`Accuracy: ${updated_stats.accuracy}%`}
                      className="rounded-md text-md"
                      variant="primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Continue */}

          <DynamicButton
            label="Continue Coding"
            variant="secondary"
            onClick={onClose}
            fullWidth
          />
        </div>
      }
    />
  );
};

export default QuizResults;
