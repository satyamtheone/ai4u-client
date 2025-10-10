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
import {
  Lock,
  ChevronLeft,
  ChevronRight,
  Send,
  SkipForward,
  X,
} from "lucide-react";

const QuizOverlay: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    currentQuestions,
    currentQuestionIndex,
    selectedAnswers,
    isSubmitting,
    stats,
    pendingUserMessage,
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
      let answerType: string;
      switch (detectedType) {
        case "single_choice":
          answerType = "single_choice";
          break;
        case "multiple_choice":
          answerType = "multi_choice"; // Note: backend expects 'multi_choice' not 'multiple_choice'
          break;
        case "short_answer":
          answerType = "short_answer";
          break;
        default:
          answerType = "single_choice";
      }

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
        setTimeout(() => {
          processPendingMessage();
        }, 3000);
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

        // Process pending message after skip
        setTimeout(() => {
          processPendingMessage();
        }, 2000);
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
    <div className="quiz-overlay-backdrop">
      <div className="quiz-overlay-container">
        <div className="quiz-header">
          <div className="quiz-lock-icon">
            <Lock size={48} />
          </div>
          <h2 className="quiz-title">Answer Quiz to Unlock AI Responses</h2>
          <p className="quiz-subtitle">Learn while you code with AI4U</p>

          <div className="quiz-question-counter">
            Question {currentQuestionIndex + 1} of {currentQuestions.length}
          </div>

          <div className="quiz-stats-row">
            <div className="quiz-stat">Level {stats.level}</div>
            <div className="quiz-stat">Streak: {stats.streak}</div>
            <div className="quiz-stat">Accuracy: {stats.accuracy}%</div>
          </div>
        </div>

        <div className="quiz-content">
          <div className="quiz-question-section">
            <div className="question-text">{currentQuestion.question}</div>
            <div className="question-meta">
              <span className="question-topic">{currentQuestion.topic}</span>
              <span className="question-difficulty">
                {currentQuestion.difficulty.toUpperCase()}
              </span>
              <span className="question-type-badge">
                {questionType === "multiple_choice"
                  ? "Multiple Choice"
                  : questionType === "short_answer"
                  ? "Short Answer"
                  : "Single Choice"}
              </span>
            </div>
          </div>

          <div className="quiz-options-section">
            {questionType === "single_choice" && (
              <div className="single-choice-options">
                {currentQuestion.options?.map(
                  (option: string, index: number) => (
                    <label key={index} className="quiz-option-label">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={index}
                        checked={
                          selectedAnswers[currentQuestion.id]?.answer === index
                        }
                        onChange={() => handleSingleChoice(index)}
                        className="quiz-option-input"
                      />
                      <div className="quiz-option-content">
                        <span className="option-letter">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="option-text">{option}</span>
                      </div>
                    </label>
                  )
                )}
              </div>
            )}

            {questionType === "multiple_choice" && (
              <div className="multiple-choice-options">
                <div className="instruction">Select all that apply:</div>
                {currentQuestion.options?.map(
                  (option: string, index: number) => (
                    <label key={index} className="quiz-option-label">
                      <input
                        type="checkbox"
                        value={index}
                        checked={
                          selectedAnswers[
                            currentQuestion.id
                          ]?.answers?.includes(index) || false
                        }
                        onChange={() => handleMultipleChoice(index)}
                        className="quiz-option-input"
                      />
                      <div className="quiz-option-content">
                        <span className="option-letter">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="option-text">{option}</span>
                      </div>
                    </label>
                  )
                )}
              </div>
            )}

            {questionType === "short_answer" && (
              <div className="short-answer-section">
                <div className="instruction">Type your answer below:</div>
                <textarea
                  value={selectedAnswers[currentQuestion.id]?.answer || ""}
                  onChange={(e) => handleShortAnswer(e.target.value)}
                  placeholder="Enter your answer here..."
                  maxLength={currentQuestion.max_length}
                  className="short-answer-input"
                  rows={4}
                />
                {currentQuestion.max_length && (
                  <div className="char-counter">
                    {(selectedAnswers[currentQuestion.id]?.answer || "").length}{" "}
                    / {currentQuestion.max_length}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="quiz-navigation">
            <button
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              className="nav-button"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              onClick={() => {
                // Skip current question
                const newAnswers = { ...selectedAnswers };
                delete newAnswers[currentQuestion.id];
                if (!isLastQuestion) {
                  handleNext();
                }
              }}
              className="nav-button skip"
            >
              Skip This
            </button>

            <button
              onClick={handleNext}
              disabled={isLastQuestion}
              className="nav-button"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="quiz-actions">
            <button
              onClick={handleSubmitAll}
              disabled={!canSubmit || isSubmitting}
              className="submit-button primary"
            >
              <Send size={16} />
              {isSubmitting
                ? "Submitting..."
                : `Submit (${answeredCount}/${currentQuestions.length})`}
            </button>

            <button
              onClick={handleSkipAll}
              disabled={isSubmitting}
              className="submit-button secondary"
            >
              <SkipForward size={16} />
              Skip All Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quiz Results Component
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
    <div className="quiz-overlay-backdrop">
      <div className="quiz-results-container">
        <div className="results-header">
          <div className="results-icon">
            {correctCount > totalQuestions / 2 ? "🎉" : "💪"}
          </div>
          <h2 className="results-title">Quiz Complete!</h2>
          <div className="results-summary">
            <div className="summary-item">
              <span className="summary-label">Score:</span>
              <span className="summary-value">
                {correctCount}/{totalQuestions}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Points:</span>
              <span className="summary-value">{totalPoints}</span>
            </div>
            <div className="summary-item highlight">
              <span className="summary-label">Unlocked:</span>
              <span className="summary-value">
                {updated_stats?.unlockedResponses || 1} responses
              </span>
            </div>
          </div>
        </div>

        <div className="results-breakdown">
          <h3>Question Breakdown:</h3>
          <div className="breakdown-list">
            {questionResults?.map((result: any, index: number) => (
              <div
                key={index}
                className={`breakdown-item ${
                  result.correct ? "correct" : "incorrect"
                }`}
              >
                <div className="breakdown-icon">
                  {result.correct ? "✅" : "❌"}
                </div>
                <div className="breakdown-content">
                  <span className="breakdown-number">Q{index + 1}</span>
                  <span className="breakdown-status">
                    {result.correct ? "Correct" : "Incorrect"}
                  </span>
                  {result.points_earned && (
                    <span className="breakdown-points">
                      +{result.points_earned} pts
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onClose} className="continue-button">
          Continue Coding
        </button>
      </div>
    </div>
  );
};

export default QuizOverlay;
