import { FormRadio } from "../../commonComponents/FormRadio";
import { QuizQuestion } from "../../types";

const SingleChoice = ({
  currentQuestion,
  selectedAnswers,
  handleSingleChoice,
}: {
  currentQuestion: QuizQuestion;
  selectedAnswers: Record<string, any>;
  handleSingleChoice: (index: number) => void;
}) => {
  return (
    <div className="flex flex-col gap-3">
      {currentQuestion.options?.map((option: string, index: number) => (
        <FormRadio
          className="checkbox-primary"
          key={index}
          variant="card"
          name={`question-${currentQuestion.id}`}
          value={index}
          checked={selectedAnswers[currentQuestion.id]?.answer === index}
          optionText={option}
          badgeLabel={String.fromCharCode(65 + index)}
          onChange={() => handleSingleChoice(index)}
        />
      ))}
    </div>
  );
};

export default SingleChoice;
