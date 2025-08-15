import React from 'react';
import { QuizQuestion as QuizQuestionType } from '../types';
import { Circle, Square, FileText } from 'lucide-react'; // Fixed: Use correct icon names

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedAnswer?: any;
  onAnswerChange: (answer: any) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, selectedAnswer, onAnswerChange }) => {
  const detectQuestionType = (q: QuizQuestionType): string => {
    if (q.question_type) return q.question_type;
    if (q.correct_answers && Array.isArray(q.correct_answers)) return 'multiple_choice';
    if (q.options && q.options.length > 0) return 'single_choice';
    return 'short_answer';
  };

  const questionType = detectQuestionType(question);

  const handleSingleChoice = (index: number) => {
    onAnswerChange({ type: 'single_choice', answer: index });
  };

  const handleMultipleChoice = (index: number) => {
    const currentAnswers = selectedAnswer?.answers || [];
    const newAnswers = currentAnswers.includes(index)
      ? currentAnswers.filter((i: number) => i !== index)
      : [...currentAnswers, index];
    
    onAnswerChange({ type: 'multiple_choice', answers: newAnswers });
  };


  const handleShortAnswer = (value: string) => {
    onAnswerChange({ type: 'short_answer', answer: value });
  };

  const getQuestionTypeIcon = () => {
    switch (questionType) {
      case 'single_choice': return <Circle size={16} />; // Fixed: Use Circle instead of RadioButton
      case 'multiple_choice': return <Square size={16} />; // Fixed: Use Square instead of CheckBox
      case 'short_answer': return <FileText size={16} />;
      default: return <Circle size={16} />;
    }
  };

  const getQuestionTypeLabel = () => {
    switch (questionType) {
      case 'single_choice': return 'Single Choice';
      case 'multiple_choice': return 'Multiple Choice';
      case 'short_answer': return 'Short Answer';
      default: return 'Single Choice';
    }
  };

  return (
    <div className="quiz-question">
      <div className="question-header">
        <div className="question-text">{question.question}</div>
        <div className="question-meta">
          <span className="question-topic">{question.topic}</span>
          <span className="question-difficulty">{question.difficulty.toUpperCase()}</span>
          <span className="question-type">
            {getQuestionTypeIcon()}
            {getQuestionTypeLabel()}
          </span>
        </div>
      </div>

      <div className="question-options">
        {questionType === 'single_choice' && (
          <div className="single-choice-options">
            {question.options.map((option, index) => (
              <label key={index} className="option-label">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={index}
                  checked={selectedAnswer?.answer === index}
                  onChange={() => handleSingleChoice(index)}
                  className="option-input"
                />
                <div className="option-content">
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {questionType === 'multiple_choice' && (
          <div className="multiple-choice-options">
            <div className="instruction">Select all that apply:</div>
            {question.options.map((option, index) => (
              <label key={index} className="option-label">
                <input
                  type="checkbox"
                  value={index}
                  checked={selectedAnswer?.answers?.includes(index) || false}
                  onChange={() => handleMultipleChoice(index)}
                  className="option-input"
                />
                <div className="option-content">
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {questionType === 'short_answer' && (
          <div className="short-answer-container">
            <div className="instruction">Type your answer below:</div>
            <textarea
              value={selectedAnswer?.answer || ''}
              onChange={(e) => handleShortAnswer(e.target.value)}
              placeholder="Enter your answer here..."
              maxLength={question.max_length}
              className="short-answer-input"
              rows={4}
            />
            {question.max_length && (
              <div className="char-counter">
                {(selectedAnswer?.answer || '').length} / {question.max_length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizQuestion;
