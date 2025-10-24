import { Lock } from "lucide-react";
import { QuizStats } from "../../store/quizSlice";
import { QuizQuestion } from "../../types";
import { FormLabelHeader } from "../../commonComponents/FormLabelHeader";
import Chip from "../../commonComponents/Chip";

const QuizOverlayHeader = ({
  stats,
  currentQuestionIndex,
  currentQuestions,
}: {
  stats: QuizStats;
  currentQuestionIndex: number;
  currentQuestions: QuizQuestion[];
}) => {
  return (
    <div className="text-center mb-8">
      <FormLabelHeader
        title=" Answer Quiz to Unlock AI Responses"
        icon={Lock}
        className="text-blue-900"
        iconBg="bg-transparent"
        subtitle="Learn while you code with AI4U"
        iconClass="text-amber-400 mb-4"
      />

      <Chip
        label={`  Question ${currentQuestionIndex + 1} of ${
          currentQuestions.length
        }`}
        className="rounded-lg text-xs my-4 px-10 py-0"
        variant="success"
      />

      <div className="flex justify-center gap-4">
        <Chip label={`Level ${stats.level}`} className="rounded-sm text-xs" />
        <Chip
          label={`Streak: ${stats.streak}`}
          className="rounded-sm text-xs"
        />
        <Chip
          label={`Accuracy: ${stats.accuracy}%`}
          className="rounded-sm text-xs"
        />
      </div>
    </div>
  );
};

export default QuizOverlayHeader;
