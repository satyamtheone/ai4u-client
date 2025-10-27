import { FormTextArea } from "../../../commonComponents/FormTextArea";
import { QuizQuestion } from "../../../types";

const ShortAnswer = ({
  selectedAnswers,
  currentQuestion,
  handleShortAnswer,
}: {
  selectedAnswers: Record<string, any>;
  currentQuestion: QuizQuestion;
  handleShortAnswer: (value: string) => void;
}) => {
  return (
    <div className="mt-4">
      <FormTextArea
        label="Type your answer below:"
        value={selectedAnswers[currentQuestion.id]?.answer || ""}
        placeholder="Enter your answer here..."
        rows={4}
        maxLength={currentQuestion.max_length}
        onChange={(e) => handleShortAnswer(e.target.value)}
      />
      {currentQuestion.max_length && (
        <div className="text-right text-xs text-[#b3b3b3] mt-1">
          {(selectedAnswers[currentQuestion.id]?.answer || "").length} /{" "}
          {currentQuestion.max_length}
        </div>
      )}
    </div>
  );
};
export default ShortAnswer;
