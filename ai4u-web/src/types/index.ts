export interface ServiceStatus {
  backend: { connected: boolean; message: string };
  mode: "backend";
  learningGates: {
    enabled: boolean;
    stats: any;
    config: any;
    backendLearningGates: boolean;
  };
}

export interface LearningGateStatus {
  enabled: boolean;
  stats: any;
  config: any;
  backend: boolean;
  backendLearningGates: boolean;
}

export interface QuizResult {
  correct: boolean;
  unlockedResponses: number;
  explanation?: string;
  levelUp?: boolean;
  level_up?: boolean;
  points_earned?: number;
}

export interface ChatMessage {
  type: string;
  message?: string;
  response?: string;
  error?: boolean;
  question?: any;
  stats?: any;
  session_id?: string;
  timestamp?: string;
  source?: string;
}

export interface AI4UConfig {
  backendUrl?: string;
  timeout: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  question_type?: "single_choice" | "multiple_choice" | "short_answer";
  correct_answers?: number[];
  max_length?: number;
}

export interface BackendQuizResult {
  result: QuizResult;
  updated_stats: {
    level: number;
    currentStreak?: number; // Made optional
    streak?: number; // Made optional
    accuracy: number;
    totalQuestions: number;
    unlockedResponses: number;
  };
  results?: QuizResult[]; // For batch submissions
}

export interface ChatMessage {
  type: string;
  message?: string;
  response?: string;
  error?: boolean;
  question?: any;
  stats?: any;
  session_id?: string;
  timestamp?: string;
  source?: string;
}

export interface AI4UConfig {
  backendUrl?: string;
  timeout: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  question_type?: "single_choice" | "multiple_choice" | "short_answer";
  correct_answers?: number[];
  max_length?: number;
}

export interface LearningGateConfig {
  enabled: boolean;
  questionsPerGate: number;
  gateFrequency: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  topics: string[];
}

export interface UserProgress {
  totalQuestions: number;
  correctAnswers: number;
  streak: number;
  lastQuizTime: Date;
  unlockedResponses: number;
  level: number;
}

export interface BackendChatRequest {
  message: string;
  session_id?: string;
  user_id: string;
  enable_learning_gates?: boolean;
}

export interface ChatResponse {
  type: "chat_response" | "learning_gate";
  response?: string;
  question?: any;
  stats?: any;
  message?: string;
  session_id?: string;
  timestamp?: string;
  error?: string;
  source: "backend";
}

export interface QuizSubmission {
  question_id: string;
  selected_answer: number;
  user_id: string;
}
