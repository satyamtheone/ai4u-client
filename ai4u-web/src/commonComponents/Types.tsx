import { JSX } from "react";

export interface OrganizationSignupProps {
  onSwitchToLogin: () => void;
  onSwitchToIndividualSignup: () => void;
  className?: string;
}

export interface FormData {
  // Organization details
  organizationName: string;
  organizationDescription: string;
  industry: string;
  companySize: string;
  website: string;
  // Admin user details
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  acceptTerms: boolean;
  subscribeNewsletter: boolean;
}

export interface IndividualSignupProps {
  onSwitchToLogin: () => void;
  onSwitchToOrgSignup: () => void;
  className?: string;
}

export interface IndividualFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  subscribeNewsletter: boolean;
}

export interface StatsBoxProps {
  title: string;
  icon: JSX.Element;
}

export interface UserLearningAnalyticsResponse {
  user_id: string;
  progress: {
    level: number;
    total_questions: number;
    correct_answers: number;
    current_streak: number;
    unlocked_responses: number;
  };
  performance: {
    level: number;
    current_streak: number;
    accuracy: number;
    total_questions: number;
    unlocked_responses: number;
    correct_answers: number;
  };
  trends: {
    accuracy_trend: "needs_work" | "improving" | "stable" | string; // in case there are other trend states
    recent_activity: number;
    last_quiz: string; // ISO timestamp
  };
  recent_submissions: {
    question_id: string;
    is_correct: boolean;
    points_earned: number;
    submitted_at: string; // ISO timestamp
  }[];
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // minutes
  estimatedTime: string;
  tags: string[];
  thumbnail?: string;
  instructor?: {
    id: number;
    name: string;
    avatar?: string;
  };
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;

  // Progress tracking
  progress?: {
    completed: boolean;
    percentage: number;
    timeSpent: number;
    lastAccessed?: string;
    startedAt?: string;
    completedAt?: string;
  };

  // Course content
  lessonsCount: number;
  quizzesCount: number;
  certificateAvailable: boolean;

  // Ratings and reviews
  rating: number;
  reviewsCount: number;
  enrollmentCount: number;
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  description: string;
  content: string;
  type: "text" | "video" | "interactive" | "quiz";
  duration: number;
  order: number;
  isCompleted?: boolean;
  resources?: LessonResource[];
  quiz?: Quiz;
}

export interface LessonResource {
  id: number;
  title: string;
  type: "pdf" | "link" | "video" | "image" | "code";
  url: string;
  description?: string;
  downloadable: boolean;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  courseId?: number;
  lessonId?: number;
  questions: QuizQuestion[];
  timeLimit?: number; // minutes
  passingScore: number; // percentage
  maxAttempts?: number;
  randomizeQuestions: boolean;
  showResults: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "code" | "matching";
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  order: number;
  codeLanguage?: string; // for code questions
  hint?: string;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  userId: number;
  answers: QuizAnswer[];
  score: number;
  percentage: number;
  passed: boolean;
  timeSpent: number; // seconds
  startedAt: string;
  completedAt?: string;
  attempt: number;
}

export interface QuizAnswer {
  questionId: number;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
  timeSpent?: number;
}

export interface LearningPath {
  id: number;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: number; // hours
  courses: Course[];
  prerequisites?: number[];
  tags: string[];
  thumbnail?: string;
  createdBy: number;
  createdAt: string;

  // Progress
  progress?: {
    completed: boolean;
    percentage: number;
    coursesCompleted: number;
    totalCourses: number;
    startedAt?: string;
    estimatedCompletion?: string;
  };
}

export interface UserProgress {
  userId: number;
  courseId?: number;
  lessonId?: number;
  quizId?: number;
  progressType: "course" | "lesson" | "quiz";
  percentage: number;
  timeSpent: number;
  completed: boolean;
  lastAccessed: string;
  metadata?: Record<string, any>;
}

export interface LearningStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHours: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  certificatesEarned: number;
  skillsAcquired: string[];
  recentActivity: LearningActivity[];
  unlocked_responses: number;
}

export interface LearningActivity {
  id: number;
  type:
    | "course_started"
    | "course_completed"
    | "lesson_completed"
    | "quiz_completed"
    | "certificate_earned";
  resourceId: number;
  resourceTitle: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Certificate {
  id: number;
  courseId: number;
  userId: number;
  courseName: string;
  completedAt: string;
  certificateUrl: string;
  verificationCode: string;
  validUntil?: string;
}

export interface ChatMessage {
  id: number;
  message: string;
  response: string;
  timestamp: string;
  context?: {
    courseId?: number;
    lessonId?: number;
    type: "general" | "course_help" | "code_review" | "explanation";
  };
  metadata?: Record<string, any>;
}

// Request/Response Types
export interface CreateCourseRequest {
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  thumbnail?: string;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  thumbnail?: string;
  status?: "draft" | "published" | "archived";
}

export interface SubmitQuizRequest {
  quizId: number;
  answers: Array<{
    questionId: number;
    answer: string | string[];
  }>;
  timeSpent: number;
}

export interface ChatRequest {
  message: string;
  context?: {
    courseId?: number;
    lessonId?: number;
    type: "general" | "course_help" | "code_review" | "explanation";
  };
}

export interface SearchCoursesParams {
  query?: string;
  category?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  instructor?: number;
  duration?: "short" | "medium" | "long"; // <1h, 1-5h, >5h
  rating?: number; // minimum rating
  page?: number;
  limit?: number;
  sortBy?: "title" | "rating" | "duration" | "created" | "popularity";
  sortOrder?: "asc" | "desc";
}

export interface UserLearningAnalyticsResponse {
  user_id: string;
  progress: {
    level: number;
    total_questions: number;
    correct_answers: number;
    current_streak: number;
    unlocked_responses: number;
  };
  performance: {
    level: number;
    current_streak: number;
    accuracy: number;
    total_questions: number;
    unlocked_responses: number;
    correct_answers: number;
  };
  trends: {
    accuracy_trend: "needs_work" | "improving" | "stable" | string; // in case there are other trend states
    recent_activity: number;
    last_quiz: string; // ISO timestamp
  };
  recent_submissions: {
    question_id: string;
    is_correct: boolean;
    points_earned: number;
    submitted_at: string; // ISO timestamp
  }[];
}
