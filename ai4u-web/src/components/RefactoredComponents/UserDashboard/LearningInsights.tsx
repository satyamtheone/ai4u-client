import React from "react";
import { Card } from "../../shared/Card";

type Performance = {
  level: number;
  current_streak: number;
  accuracy: number;
  total_questions: number;
  unlocked_responses: number;
  [key: string]: string | number | boolean | null | undefined;
};

type Progress = {
  level: number;
  total_questions: number;
  correct_answers: number;
  current_streak: number;
  unlocked_responses: number;
  [key: string]: string | number | boolean | null | undefined;
};

type Trends = {
  accuracy_trend: string;
  recent_activity: number;
  last_quiz: string | null;
  [key: string]: string | number | boolean | null | undefined;
};

type InsightsData = {
  performance: Performance;
  progress: Progress;
  trends: Trends;
};

interface Props {
  data: InsightsData;
}

const formatLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined) return "—";
  if (key === "last_quiz" && typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  }
  if (key === "accuracy" && typeof value === "number") {
    return `${value}%`;
  }
  return String(value);
};

const Section: React.FC<{ title: string; obj: Record<string, any> }> = ({
  title,
  obj,
}) => (
  <Card>
    <>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h3>
      <dl className="space-y-2 text-sm">
        {Object.entries(obj).map(([key, val]) => (
          <div key={key} className="flex items-baseline justify-between gap-3">
            <dt className="text-gray-500 dark:text-gray-400">
              {formatLabel(key)}
            </dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">
              {formatValue(key, val)}
            </dd>
          </div>
        ))}
      </dl>
    </>
  </Card>
);

const LearningInsights: React.FC<Props> = ({ data }) => {
  const { performance, progress, trends } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Section title="Performance" obj={performance} />
      <Section title="Progress" obj={progress} />
      <Section title="Trends" obj={trends} />
    </div>
  );
};

export default LearningInsights;
