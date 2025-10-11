import {
  Book,
  Code,
  Home,
  MessageSquare,
  Target,
  Trophy,
  Unlock,
  Zap,
} from "lucide-react";
import { ChatMessage } from "../types";

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

    icon: (
      <Trophy className="w-5 h-5 flex-shrink-0" style={{ color: "#f59e0b" }} />
    ),
  },
  {
    title: "Streak",

    icon: (
      <Zap className="w-5 h-5 flex-shrink-0" style={{ color: "#2563eb" }} />
    ),
  },
  {
    title: "Accuracy",

    icon: (
      <Target className="w-5 h-5 flex-shrink-0" style={{ color: "#8b5cf6" }} />
    ),
  },
  {
    title: "Responses Left",

    icon: <Unlock className="w-5 h-5 flex-shrink-0 text-emerald-500" />,
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
  { icon: <Home size={20} />, label: "Home", isActive: true },
  { icon: <Book size={20} />, label: "Library" },
  { icon: <Code size={20} />, label: "Coding" },
  { icon: <MessageSquare size={20} />, label: "Chats" },
];
