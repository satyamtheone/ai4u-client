import { ArrowUpRight, Award, Target, TrendingUp, Users } from "lucide-react";

import DashboardStatsCard from "../../../commonComponents/DashbordStatsCard";
import DynamicDropDown from "../../../commonComponents/DynamicDropDown";

import { DashboardStats } from "../../../pages/OrganizationDashboard";

const OrganizationDashboardStats = ({ stats }: { stats: DashboardStats }) => {
  const children = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardStatsCard
        icon={<Users className="w-8 h-8 text-blue-600" />}
        progressLineOne={stats.totalMembers}
        progressLineTwo={
          <div className="flex items-center mt-2">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">
              +{stats.monthlyGrowth}% this month
            </span>
          </div>
        }
        variant="primary"
        title="Total Members"
      />
      <DashboardStatsCard
        icon={<TrendingUp className="w-8 h-8 text-green-600" />}
        progressLineOne={stats.activeMembers}
        progressLineTwo={`${Math.round(
          (stats.activeMembers / stats.totalMembers) * 100
        )}
      % engagement rate`}
        variant="success"
        title="Active Members"
      />
      <DashboardStatsCard
        icon={<Target className="w-8 h-8 text-yellow-600" />}
        progressLineOne={stats.completionRate}
        progressLineTwo={`Avg. progress: ${stats.avgProgress}%`}
        variant="warning"
        title="Completion Rate"
      />
      <DashboardStatsCard
        icon={<Award className="w-8 h-8 text-purple-600" />}
        progressLineOne={stats.totalCourses}
        progressLineTwo={"Learning paths available"}
        variant="purple"
        title="Active Courses"
      />
    </div>
  );
  return (
    <div className="w-full">
      <DynamicDropDown
        title="Your Organization Stats"
        defaultOpen
        children={children}
        className="rounded-lg"
      />
    </div>
  );
};

export default OrganizationDashboardStats;
