import {
  Book,
  CircleQuestionMark,
  Code,
  FileQuestion,
  Home,
  Lock,
  MessageSquare,
  Target,
  Trophy,
  Unlock,
  User,
  Zap,
} from "lucide-react";
import { ChatMessage } from "../../types";
import { Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

export const suggestedTopics = [
  "🧠 Explain React hooks",
  "🔧 Debug this JavaScript error",
  "💡 Best practices for TypeScript",
  "❤️ Code review checklist",
  "✅ Optimize this algorithm",
];

export const industryOptions = [
  { value: "", label: "Select Industry" },
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "consulting", label: "Consulting" },
  { value: "media", label: "Media & Entertainment" },
  { value: "transportation", label: "Transportation" },
  { value: "energy", label: "Energy" },
  { value: "real-estate", label: "Real Estate" },
  { value: "hospitality", label: "Hospitality" },
  { value: "agriculture", label: "Agriculture" },
  { value: "construction", label: "Construction" },
  { value: "government", label: "Government" },
  { value: "non-profit", label: "Non-Profit" },
  { value: "other", label: "Other" },
];

export const companySizeOptions = [
  { value: "", label: "Select Company Size" },
  { value: "1-10", label: "1-10 employees" },
  { value: "11-25", label: "11-25 employees" },
  { value: "26-50", label: "26-50 employees" },
  { value: "51-100", label: "51-100 employees" },
  { value: "101-500", label: "101-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

export const LearningBoxes = [
  {
    title: "Level",
    value: "level",
    icon: (
      <Trophy className="w-5 h-5 flex-shrink-0" style={{ color: "#f59e0b" }} />
    ),
  },
  {
    title: "Streak",
    value: "current_streak",
    icon: (
      <Zap className="w-5 h-5 flex-shrink-0" style={{ color: "#2563eb" }} />
    ),
  },
  {
    title: "Accuracy",
    value: "accuracy",
    icon: (
      <Target className="w-5 h-5 flex-shrink-0" style={{ color: "#8b5cf6" }} />
    ),
  },
  {
    title: "Responses Left",
    value: "unlocked_responses",

    icon: <Lock className="w-5 h-5 flex-shrink-0 text-emerald-500" />,
  },

  {
    title: "Total questions",
    value: "total_questions",

    icon: (
      <CircleQuestionMark className="w-5 h-5 flex-shrink-0 text-emerald-500" />
    ),
  },
];

export const chatMessages: ChatMessage[] = [
  {
    type: "user",
    message: "Hi there! How are you?",
    timestamp: "2025-10-09T18:30:00Z",
    session_id: "session_001",
    source: "web",
  },
  {
    type: "bot",
    response: "I'm great, thanks for asking! How can I help you today?",
    timestamp: "2025-10-09T18:30:02Z",
    session_id: "session_001",
    source: "ai",
  },
  {
    type: "user",
    message: "Can you summarize the latest sales report?",
    timestamp: "2025-10-09T18:31:00Z",
    session_id: "session_001",
    source: "web",
  },
  {
    type: "bot",
    response:
      "Sure! Total revenue increased by 15% this quarter, with top performance in North America.",
    stats: { revenueGrowth: "15%", topRegion: "North America" },
    timestamp: "2025-10-09T18:31:05Z",
    session_id: "session_001",
    source: "ai",
  },
  {
    type: "bot",
    error: true,
    message: "Failed to fetch detailed metrics.",
    timestamp: "2025-10-09T18:31:10Z",
    session_id: "session_001",
    source: "system",
  },
];

export const SideBarHeaders = [
  { icon: <Home size={20} />, label: "Home", navigateTo: "/" },
  { icon: <User size={20} />, label: "Profile", navigateTo: "/userProfile" },
];

export const GoogleIcon: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle size={20} />;
    case "warning":
      return <AlertTriangle size={20} />;
    case "error":
      return <AlertCircle size={20} />;
    default:
      return <Info size={20} />;
  }
};

export const typeStyles = (type: string) => {
  switch (type) {
    case "success":
      return {
        wrap: "border-emerald-600/40 bg-emerald-600/40",
        bar: "bg-emerald-500",
        icon: "text-emerald-400",
        message: "text-emerald-100",
        highlight: "emerald-500",
      };
    case "warning":
      return {
        wrap: "border-amber-600/40 bg-amber-600/40",
        bar: "bg-amber-500",
        icon: "text-amber-400",
        message: "text-amber-100",
        highlight: "amber-500",
      };
    case "error":
      return {
        wrap: "border-red-600/40 bg-red-600/40",
        bar: "bg-red-500",
        icon: "text-red-400",
        message: "text-red-100",
        highlight: "red-300",
      };
    default:
      return {
        wrap: "border-blue-600/40 bg-blue-600/40",
        bar: "bg-blue-500",
        icon: "text-blue-400",
        message: "text-blue-100",
        highlight: "blue-500",
      };
  }
};

export const toAnswerType = (question_type?: string) => {
  switch (question_type) {
    case "single_choice":
      return "single_choice";
    case "multiple_choice": // ✅ correct value
      return "multiple_choice";
    case "short_answer":
      return "short_answer";
    default:
      return "single_choice";
  }
};
