import {
  BackendChatRequest,
  ChatResponse,
  QuizSubmission,
  BackendQuizResult,
} from "../types";
import { StorageService } from "./utils/StorageService";

export class BackendService {
  private backendUrl?: string;
  private sessionId?: string;
  private isConnected: boolean = false;
  private userId: string = "web-user";
  private learningGatesEnabled: boolean = false;
  private token: string | null = null;
  private storage = new StorageService();

  // Put this inside BackendService (private helper)
  private unwrap<T = any>(raw: any): T {
    // Many APIs return { success, message, data: {...} }.
    if (raw && typeof raw === "object" && "data" in raw && raw.data) {
      return raw.data as T;
    }
    return raw as T;
  }

  constructor(backendUrl?: string) {
    this.backendUrl = backendUrl || process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
    console.log("Backend Service initialized with URL:", this.backendUrl);
    this.token = this.storage.getToken();
  }

  public setToken(token: string | null) {
    this.token = token;
  }
  public setBackendUrl(url: string | undefined) {
    this.backendUrl = url;
    this.isConnected = false;
  }

  public setLearningGatesEnabled(enabled: boolean) {
    this.learningGatesEnabled = enabled;
    console.log(
      "Backend Service: Learning gates",
      enabled ? "enabled" : "disabled"
    );
  }

  public isLearningGatesEnabled(): boolean {
    return this.learningGatesEnabled;
  }

  public async testConnection(): Promise<{
    connected: boolean;
    message: string;
  }> {
    if (!this.backendUrl) {
      return { connected: false, message: "Backend URL not configured" };
    }

    try {
      const timeout = parseInt(process.env.REACT_APP_CONNECTION_TIMEOUT || '5000');
      const response = await fetch(`${this.backendUrl}/api/v1/health`, {
        method: "GET",
        signal: AbortSignal.timeout(timeout),
      });

      if (response.ok) {
        this.isConnected = true;
        const data = await response.json();
        console.log("Backend Service: Connection successful");

        const features = data.features || [];
        const supportsLearningGates = features.includes("learning_gates");

        return {
          connected: true,
          message: `Backend connected (v${data.version || "unknown"})${
            supportsLearningGates ? " with Learning Gates" : ""
          }`,
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error("Backend Service: Connection failed:", error);
      this.isConnected = false;
      return {
        connected: false,
        message: `Backend connection failed: ${error.message}`,
      };
    }
  }

  public isReady(): boolean {
    return this.isConnected && !!this.backendUrl;
  }

  public async sendMessage(message: string): Promise<ChatResponse> {
    if (!this.backendUrl) {
      return {
        type: "chat_response",
        error: "Backend URL not configured",
        source: "backend",
      };
    }

    try {
      const requestBody: BackendChatRequest = {
        message,
        session_id: this.sessionId,
        user_id: this.userId,
        enable_learning_gates: this.learningGatesEnabled,
      };

      const url = this.learningGatesEnabled
        ? `${this.backendUrl}/api/v1/learning/chat?learning_gates=true`
        : `${this.backendUrl}/api/v1/learning/chat`;

      const timeout = parseInt(process.env.REACT_APP_CHAT_TIMEOUT || '30000');
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        // Try to read a structured error (also possibly wrapped)
        let errMsg = `Backend request failed (${response.status})`;
        try {
          const errJson = await response.json();
          const err = this.unwrap<any>(errJson);
          errMsg = err?.detail || err?.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const raw = await response.json();
      const payload = this.unwrap<any>(raw);

      if (payload.session_id) {
        this.sessionId = payload.session_id;
      }

      // Two shapes:
      // 1) learning_gate: { type: 'learning_gate', question, stats, message }
      // 2) chat_response: { type: 'chat_response', response, session_id, timestamp }
      if (payload.type === "learning_gate") {
        return {
          type: "learning_gate",
          question: payload.question,
          stats: payload.stats,
          message: payload.message, // optional informational message
          source: "backend",
        };
      }
      return {
        type: "chat_response",
        response: payload.response,
        session_id: payload.session_id,
        timestamp: payload.timestamp,
        source: "backend",
      };
    } catch (error: any) {
      console.error("Backend Service: Send message error:", error);
      return {
        type: "chat_response",
        error: error.message,
        source: "backend",
      };
    }
  }

  public async submitQuizAnswer(
    questionId: string,
    selectedAnswer: number
  ): Promise<BackendQuizResult | null> {
    if (!this.backendUrl) {
      return null;
    }

    try {
      const submission: QuizSubmission = {
        question_id: questionId,
        selected_answer: selectedAnswer,
        user_id: this.userId,
      };

      const timeout = parseInt(process.env.REACT_APP_QUIZ_TIMEOUT || '10000');
      const response = await fetch(
        `${this.backendUrl}/api/v1/learning/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },

          body: JSON.stringify(submission),
          signal: AbortSignal.timeout(timeout),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data as BackendQuizResult;
      } else {
        console.error(
          "Backend Service: Quiz submission failed",
          response.status
        );
        return null;
      }
    } catch (error) {
      console.error("Backend Service: Quiz submission error:", error);
      return null;
    }
  }

  public async skipQuiz(): Promise<BackendQuizResult | null> {
    if (!this.backendUrl) {
      return null;
    }

    try {
      const timeout = parseInt(process.env.REACT_APP_QUIZ_TIMEOUT || '10000');
      const response = await fetch(
        `${this.backendUrl}/api/v1/learning/quiz/skip?user_id=${this.userId}`,
        {
          method: "POST",
          signal: AbortSignal.timeout(timeout),
          headers: {
            "Content-Type": "application/json",
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data as BackendQuizResult;
      } else {
        console.error("Backend Service: Quiz skip failed", response.status);
        return null;
      }
    } catch (error) {
      console.error("Backend Service: Quiz skip error:", error);
      return null;
    }
  }

  public async getQuizQuestions(
    count: number = 3,
    userId?: string
  ): Promise<any[] | null> {
    if (!this.backendUrl) {
      return null;
    }

    try {
      const url = `${
        this.backendUrl
      }/api/v1/learning/questions?count=${count}&user_id=${
        userId || this.userId
      }`;

      const timeout = parseInt(process.env.REACT_APP_QUIZ_TIMEOUT || '10000');
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) {
        console.error(
          "Backend Service: Get quiz questions failed",
          response.status
        );
        return null;
      }

      // ✅ Parse & unwrap (handles both wrapped and raw arrays)
      const raw = await response.json();
      const payload = this.unwrap<any>(raw);

      // Some APIs return an array, others wrap under 'questions'
      const questions = Array.isArray(payload)
        ? payload
        : payload.questions || null;

      if (!questions) {
        console.warn(
          "Backend Service: No questions found in response payload:",
          payload
        );
        return null;
      }

      console.log("Backend Service: Parsed quiz questions:", questions);
      return questions;
    } catch (error) {
      console.error("Backend Service: Get quiz questions error:", error);
      return null;
    }
  }

  public async submitQuizAnswers(
    answers: {
      question_id: string;
      selected_answer: number;
      answer_type: string;
    }[],
    user_id?: string
  ): Promise<any | null> {
    if (!this.backendUrl) {
      return null;
    }

    try {
      const submission = {
        answers: answers,
        user_id: user_id || this.userId,
      };

      const timeout = parseInt(process.env.REACT_APP_BATCH_TIMEOUT || '15000');
      const response = await fetch(
        `${this.backendUrl}/api/v1/learning/quiz/submit-batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },

          body: JSON.stringify(submission),
          signal: AbortSignal.timeout(timeout),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error(
          "Backend Service: Batch quiz submission failed",
          response.status
        );
        return null;
      }
    } catch (error) {
      console.error("Backend Service: Batch quiz submission error:", error);
      return null;
    }
  }

  public getStatus(): { connected: boolean; message: string } {
    if (this.isReady()) {
      const gatesStatus = this.learningGatesEnabled
        ? " with Learning Gates enabled"
        : "";
      return { connected: true, message: `Backend connected${gatesStatus}` };
    } else if (this.backendUrl) {
      return {
        connected: false,
        message: "Backend configured but not connected",
      };
    } else {
      return { connected: false, message: "Backend not configured" };
    }
  }

  public getSessionId(): string | undefined {
    return this.sessionId;
  }
}
