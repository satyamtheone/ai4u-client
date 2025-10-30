import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { QuizQuestion } from "../../../types";
import DynamicButton from "../../../commonComponents/DynamicButton";

const QuizOverlayNavigation = ({
  handlePrevious,
  isFirstQuestion,
  selectedAnswers,
  handleNext,
  isLastQuestion,
  currentQuestion,
}: {
  handlePrevious: () => void;
  isFirstQuestion: boolean;
  selectedAnswers: Record<string, any>;
  handleNext: () => void;
  isLastQuestion: boolean;
  currentQuestion: QuizQuestion;
}) => {
  return (
    <>
      <div className="flex justify-between my-6 gap-3">
        <DynamicButton
          onClick={handlePrevious}
          disabled={isFirstQuestion}
          label=" Previous"
          variant="pill"
          className="py-1 text-xs"
          icon={<ChevronLeft size={16} />}
        />
        <DynamicButton
          onClick={() => {
            const newAnswers = { ...selectedAnswers };
            delete newAnswers[currentQuestion.id];
            if (!isLastQuestion) handleNext();
          }}
          label="Skip This"
          variant="pill"
          className="py-1 text-xs border-orange-300 border-[0.5px] dark:text-orange-300 text-orange-500"
          icon={<SkipForward size={16} />}
        />
        <DynamicButton
          disabled={isLastQuestion}
          onClick={handleNext}
          label="Next"
          variant="pill"
          className="py-1 text-xs "
          icon={<ChevronRight size={16} />}
          iconPosition="flex-row-reverse"
        />
      </div>
    </>
  );
};

export default QuizOverlayNavigation;
