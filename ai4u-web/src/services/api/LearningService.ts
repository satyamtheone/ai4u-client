import { BaseApiService } from "./BaseApiService";
import { API_ENDPOINTS } from "../../utils/constants/apiEndpoints";

// Learning Types
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

export class LearningService extends BaseApiService {
  constructor(baseURL?: string, token?: string | null) {
    super();
    // Optional: override base URL if you want to point this service
    // to a different host than apiConfig.baseURL
    if (baseURL) {
      // baseURL is protected in BaseApiService, so we can set it
      (this as any).baseURL = baseURL;
    }
    if (token) {
      this.setToken(token);
    }
  }

  // Quiz Operations
  async getQuiz(quizId: number): Promise<Quiz> {
    try {
      return await this.get<Quiz>(
        `${API_ENDPOINTS.LEARNING.QUIZ.QUESTIONS}/${quizId}`
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch quiz"
      );
    }
  }

  async submitQuiz(data: SubmitQuizRequest): Promise<QuizAttempt> {
    try {
      return await this.post<QuizAttempt>(
        API_ENDPOINTS.LEARNING.QUIZ.SUBMIT,
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to submit quiz"
      );
    }
  }

  async submitBatchQuiz(
    answers: Array<SubmitQuizRequest>
  ): Promise<QuizAttempt[]> {
    try {
      return await this.post<QuizAttempt[]>(
        API_ENDPOINTS.LEARNING.QUIZ.SUBMIT_BATCH,
        { answers }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to submit batch quiz"
      );
    }
  }

  async skipQuiz(quizId: number): Promise<{ skipped: boolean }> {
    try {
      return await this.post(`${API_ENDPOINTS.LEARNING.QUIZ.SKIP}`, { quizId });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to skip quiz"
      );
    }
  }

  async getQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
    try {
      return await this.get<QuizAttempt[]>(
        `${API_ENDPOINTS.LEARNING.QUIZ.QUESTIONS}/${quizId}/attempts`
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch quiz attempts"
      );
    }
  }

  // Progress Tracking
  async getUserProgress(params?: {
    courseId?: number;
    type?: "course" | "lesson" | "quiz";
  }): Promise<UserProgress[]> {
    try {
      const queryParams = params
        ? new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
              if (value !== undefined) acc[key] = String(value);
              return acc;
            }, {} as Record<string, string>)
          ).toString()
        : "";

      const url = queryParams
        ? `${API_ENDPOINTS.LEARNING.PROGRESS.GET}?${queryParams}`
        : API_ENDPOINTS.LEARNING.PROGRESS.GET;

      return await this.get<UserProgress[]>(url);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch user progress"
      );
    }
  }

  async updateProgress(data: {
    courseId?: number;
    lessonId?: number;
    quizId?: number;
    percentage: number;
    timeSpent: number;
    completed?: boolean;
  }): Promise<UserProgress> {
    try {
      return await this.post<UserProgress>(
        API_ENDPOINTS.LEARNING.PROGRESS.UPDATE,
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update progress"
      );
    }
  }

  async resetProgress(courseId: number): Promise<{ reset: boolean }> {
    try {
      return await this.post(`${API_ENDPOINTS.LEARNING.PROGRESS.RESET}`, {
        courseId,
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to reset progress"
      );
    }
  }

  // Learning Analytics
  async getLearningStats(): Promise<LearningStats> {
    try {
      return await this.get<LearningStats>(API_ENDPOINTS.LEARNING.STATS);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch learning statistics"
      );
    }
  }

  // AI Chat Integration
  async sendChatMessage(data: ChatRequest): Promise<ChatMessage> {
    try {
      return await this.post<ChatMessage>(API_ENDPOINTS.LEARNING.CHAT, data);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to send chat message"
      );
    }
  }

  async getChatHistory(params?: {
    page?: number;
    limit?: number;
    courseId?: number;
  }): Promise<{
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = params
        ? new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
              if (value !== undefined) acc[key] = String(value);
              return acc;
            }, {} as Record<string, string>)
          ).toString()
        : "";

      const url = queryParams
        ? `${API_ENDPOINTS.LEARNING.CHAT}/history?${queryParams}`
        : `${API_ENDPOINTS.LEARNING.CHAT}/history`;

      return await this.get(url);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch chat history"
      );
    }
  }

  // Admin Functions
  async createQuizQuestion(
    data: Omit<QuizQuestion, "id">
  ): Promise<QuizQuestion> {
    try {
      return await this.post<QuizQuestion>(
        API_ENDPOINTS.LEARNING.ADMIN.CREATE_QUESTION,
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create quiz question"
      );
    }
  }

  async updateQuizQuestion(
    questionId: number,
    data: Partial<QuizQuestion>
  ): Promise<QuizQuestion> {
    try {
      return await this.put<QuizQuestion>(
        API_ENDPOINTS.LEARNING.ADMIN.UPDATE_QUESTION(questionId),
        data
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update quiz question"
      );
    }
  }

  async deleteQuizQuestion(questionId: number): Promise<void> {
    try {
      await this.delete(
        API_ENDPOINTS.LEARNING.ADMIN.DELETE_QUESTION(questionId)
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to delete quiz question"
      );
    }
  }

  async bulkImportQuestions(
    file: File,
    courseId?: number
  ): Promise<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    try {
      const additionalData = courseId
        ? { courseId: String(courseId) }
        : undefined;
      return await this.uploadFile(
        API_ENDPOINTS.LEARNING.ADMIN.BULK_IMPORT,
        file,
        additionalData
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to bulk import questions"
      );
    }
  }
}
