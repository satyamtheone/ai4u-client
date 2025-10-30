import { JSX } from "react";
import { Card } from "../components/shared/Card";

export type DashboardStatsCardsVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "purple"
  | "error";

const DashboardStatsCard = ({
  title,
  progressLineOne,
  progressLineTwo,
  icon,
  variant = "default",
  padding = "sm",
}: {
  title?: string;
  progressLineOne?: string | number;
  progressLineTwo?: string | JSX.Element;
  icon?: JSX.Element;
  variant?: DashboardStatsCardsVariant;
  padding?: "none" | "sm" | "md" | "lg";
}) => {
  const VARIANT_STYLES: Record<DashboardStatsCardsVariant, string> = {
    default: "border-l-4 dark:border-l-grey-300 border-l-grey-300 ",
    primary: "border-l-4 dark: dark:border-l-blue-500 border-l-blue-500 ",
    success: "border-l-4 dark:border-l-green-500  border-l-green-500 ",
    warning: "border-l-4 dark:border-l-yellow-500 border-l-yellow-500 ",
    purple: "border-l-4 dark:border-l-purple-500 border-l-purple-500",
    error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  const chipColorClass = VARIANT_STYLES[variant];

  return (
    <Card
      padding={padding}
      className={` dark:border-gray-600 ${chipColorClass}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium ">{title}</p>
          <p className="text-3xl font-bold ">{progressLineOne}</p>
          <div className="text-sm text-gray-500 mt-1">{progressLineTwo}</div>
        </div>
        {icon}
      </div>
    </Card>
  );
};

export default DashboardStatsCard;
