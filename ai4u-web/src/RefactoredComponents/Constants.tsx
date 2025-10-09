import { Target, Trophy, Unlock, Zap } from "lucide-react";

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
