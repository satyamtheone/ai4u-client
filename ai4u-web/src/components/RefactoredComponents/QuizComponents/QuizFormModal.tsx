import { Send, SkipForward } from "lucide-react";
import DynamicButton from "../../../commonComponents/DynamicButton";
import { QuizStats } from "../../../store/quizSlice";
import { QuizQuestion } from "../../../types";
import MultipleChoice from "./MultipleChoice";
import QuizOverlayHeader from "./QuizOverlayHeader";
import QuizOverlayNavigation from "./QuizOverlayNavigation";
import ShortAnswer from "./ShortAnswer";
import SingleChoice from "./SingleChoice";
import Chip from "../../../commonComponents/Chip";

const QuizFormModal = ({
  stats,
  currentQuestionIndex,
  currentQuestions,
  currentQuestion,
  selectedAnswers,
  isLastQuestion,
  questionType,
  isFirstQuestion,
  isSubmitting,
  answeredCount,
  canSubmit,
  handleNext,
  handleSingleChoice,
  handleMultipleChoice,
  handlePrevious,
  handleShortAnswer,
  handleSubmitAll,
  handleSkipAll,
}: {
  stats: QuizStats;
  currentQuestionIndex: number;
  currentQuestions: QuizQuestion[];
  currentQuestion: QuizQuestion;
  selectedAnswers: Record<string, any>;
  isFirstQuestion: boolean;
  questionType: string;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  answeredCount: number;
  canSubmit: boolean;
  handleSingleChoice: (index: number) => void;
  handlePrevious: () => void;
  handleNext: () => void;
  handleMultipleChoice: (index: number) => void;
  handleShortAnswer: (value: string) => void;
  handleSubmitAll: () => Promise<void>;
  handleSkipAll: () => Promise<void>;
}) => {
  return (
    <div>
      {/* ===== Header ===== */}
      <QuizOverlayHeader
        currentQuestionIndex={currentQuestionIndex}
        currentQuestions={currentQuestions}
        stats={stats}
      />
      {/* ===== Content ===== */}
      <div className="mb-6">
        {/* Question */}
        <div className="mb-6">
          <div className="text-[14px] font-semibold dark:text-white text-black mb-3 leading-snug">
            Q.{currentQuestion.question}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <Chip
              label={currentQuestion.topic}
              className="rounded-md  text-xs"
              variant="success"
            />
            <Chip
              label={currentQuestion.difficulty.toUpperCase()}
              className="rounded-md  text-xs"
              variant="warning"
            />
            <Chip
              label={
                questionType === "multiple_choice"
                  ? "Multiple Choice"
                  : questionType === "short_answer"
                  ? "Short Answer"
                  : "Single Choice"
              }
              className="rounded-md text-xs"
              variant="primary"
            />
          </div>
        </div>

        {/* Options */}
        <div>
          {/* Single Choice */}
          {questionType === "single_choice" && (
            <SingleChoice
              currentQuestion={currentQuestion}
              handleSingleChoice={handleSingleChoice}
              selectedAnswers={selectedAnswers}
            />
          )}

          {/* Multiple Choice */}
          {questionType === "multiple_choice" && (
            <MultipleChoice
              currentQuestion={currentQuestion}
              handleMultipleChoice={handleMultipleChoice}
              selectedAnswers={selectedAnswers}
            />
          )}

          {/* Short Answer */}
          {questionType === "short_answer" && (
            <ShortAnswer
              currentQuestion={currentQuestion}
              selectedAnswers={selectedAnswers}
              handleShortAnswer={handleShortAnswer}
            />
          )}
        </div>

        {/* Navigation */}
        <QuizOverlayNavigation
          currentQuestion={currentQuestion}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion}
          selectedAnswers={selectedAnswers}
        />

        {/* Actions */}
        <div className="flex gap-4  justify-between mt-8 max-sm:flex-col ">
          <DynamicButton
            label={
              isSubmitting
                ? "Submitting..."
                : `Submit (${answeredCount}/${currentQuestions.length})`
            }
            variant="secondary"
            icon={<Send size={16} />}
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmitAll}
          />

          <DynamicButton
            label="Skip All Questions"
            variant="pill"
            icon={<SkipForward size={16} />}
            disabled={isSubmitting}
            onClick={handleSkipAll}
            className="rounded-md"
          />
        </div>
      </div>
    </div>
  );
};

export default QuizFormModal;
