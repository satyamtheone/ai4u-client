import { FormCheckBox } from "../../../commonComponents/FormCheckBox";
import { QuizQuestion } from "../../../types";

const MultipleChoice = ({
  currentQuestion,
  selectedAnswers,
  handleMultipleChoice,
}: {
  currentQuestion: QuizQuestion;
  selectedAnswers: Record<string, any>;
  handleMultipleChoice: (index: number) => void;
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm  italic">Select all that apply:</div>
      {currentQuestion.options?.map((option: string, index: number) => (
        <FormCheckBox
          key={index}
          variant="card"
          value={index}
          checked={
            selectedAnswers[currentQuestion.id]?.answers?.includes(index) ||
            false
          }
          onChange={() => handleMultipleChoice(index)}
          optionText={option}
          badgeLabel={String.fromCharCode(65 + index)}
        />
      ))}
    </div>
  );
};

export default MultipleChoice;
