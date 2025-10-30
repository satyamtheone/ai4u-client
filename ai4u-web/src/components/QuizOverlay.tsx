// src/components/QuizOverlay.tsx - Fixed with proper overlay and CSS
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import {
  setCurrentQuestionIndex,
  setSelectedAnswer,
  endQuiz,
  submitQuizAnswers,
  skipQuiz,
} from "../store/quizSlice";
import { sendMessage } from "../store/chatSlice";
import { addNotification } from "../store/uiSlice";
import QuizResults from "./QuizResults";
import ModalProvider from "../commonComponents/Dialog/ModalProvider";
import QuizFormModal from "./RefactoredComponents/QuizComponents/QuizFormModal";
import { toAnswerType } from "./RefactoredComponents/Constants";

const QuizOverlay: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    isActive,
    currentQuestions,
    currentQuestionIndex,
    selectedAnswers,
    stats,
    pendingUserMessage,
    isSubmitting,
  } = useAppSelector((state) => state.quiz);

  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const canSubmit = answeredCount > 0;

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1));
    }
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
    }
  };

  const handleAnswerSelect = (answer: any) => {
    dispatch(setSelectedAnswer({ questionId: currentQuestion.id, answer }));
  };

  const handleSubmitAll = async () => {
    if (!canSubmit) {
      dispatch(
        addNotification({
          type: "warning",
          message: "Please answer at least one question!",
        })
      );
      return;
    }

    // Create answers with proper answer_type detection
    const answers = Object.keys(selectedAnswers).map((questionId) => {
      const question = currentQuestions.find((q) => q.id === questionId);
      const answerData = selectedAnswers[questionId];

      // Detect question type
      const detectedType = detectQuestionType(question);

      // Map to expected answer_type format
      const answerType = toAnswerType(detectedType);

      // Get the selected answer value
      let selectedAnswer;
      if (answerData.type === "single_choice") {
        selectedAnswer = answerData.answer;
      } else if (answerData.type === "multiple_choice") {
        selectedAnswer = answerData.answers;
      } else if (answerData.type === "short_answer") {
        selectedAnswer = answerData.answer;
      } else {
        // Fallback for simple answer format
        selectedAnswer = answerData.answer || answerData.answers || answerData;
      }

      return {
        question_id: questionId,
        selected_answer: selectedAnswer,
        answer_type: answerType,
      };
    });

    console.log("Submitting quiz answers:", answers); // Debug log

    try {
      const result = await dispatch(submitQuizAnswers(answers));

      if (submitQuizAnswers.fulfilled.match(result)) {
        setResults(result.payload);
        setShowResults(true);

        // Process pending message after successful quiz submission
        // setTimeout(() => {
        //   processPendingMessage();
        // }, 3000);
      }
    } catch (error) {
      console.error("Quiz submission failed:", error);
      dispatch(
        addNotification({
          type: "error",
          message: "Failed to submit quiz answers",
        })
      );
    }
  };

  const handleSkipAll = async () => {
    try {
      const result = await dispatch(skipQuiz());

      if (skipQuiz.fulfilled.match(result)) {
        setResults(result.payload);
        setShowResults(true);

        //Process pending message after skip
        // setTimeout(() => {
        //   processPendingMessage();
        // }, 2000);
      }
    } catch (error) {
      console.error("Quiz skip failed:", error);
      dispatch(
        addNotification({ type: "error", message: "Failed to skip quiz" })
      );
    }
  };

  const processPendingMessage = async () => {
    if (pendingUserMessage) {
      try {
        await dispatch(sendMessage(pendingUserMessage));
      } catch (error) {
        dispatch(
          addNotification({
            type: "error",
            message: "Failed to process your message after quiz",
          })
        );
      }
    }

    dispatch(endQuiz());
    setShowResults(false);
    setResults(null);
  };

  const handleCloseResults = () => {
    processPendingMessage();
  };

  // Detect question type
  const detectQuestionType = (question: any): string => {
    if (question.question_type) return question.question_type;
    if (question.correct_answers && Array.isArray(question.correct_answers))
      return "multiple_choice";
    if (question.options && question.options.length > 0) return "single_choice";
    return "short_answer";
  };

  const questionType = currentQuestion
    ? detectQuestionType(currentQuestion)
    : "single_choice";

  const handleSingleChoice = (index: number) => {
    handleAnswerSelect({ type: "single_choice", answer: index });
  };

  const handleMultipleChoice = (index: number) => {
    const currentAnswers = selectedAnswers[currentQuestion.id]?.answers || [];
    const newAnswers = currentAnswers.includes(index)
      ? currentAnswers.filter((i: number) => i !== index)
      : [...currentAnswers, index];

    handleAnswerSelect({ type: "multiple_choice", answers: newAnswers });
  };

  const handleShortAnswer = (value: string) => {
    handleAnswerSelect({ type: "short_answer", answer: value });
  };

  if (showResults && results) {
    return <QuizResults results={results} onClose={handleCloseResults} />;
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <ModalProvider
      onClose={() => {
        handleCloseResults();
      }}
      sizes="lg"
      children={
        <QuizFormModal
          stats={stats}
          currentQuestionIndex={currentQuestionIndex}
          currentQuestions={currentQuestions}
          currentQuestion={currentQuestion}
          selectedAnswers={selectedAnswers}
          handleSkipAll={handleSkipAll}
          handleSubmitAll={handleSubmitAll}
          answeredCount={answeredCount}
          canSubmit={canSubmit}
          handleMultipleChoice={handleMultipleChoice}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          handleShortAnswer={handleShortAnswer}
          handleSingleChoice={handleSingleChoice}
          isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          questionType={questionType}
        />
      }
    />
  );
};

export default QuizOverlay;
