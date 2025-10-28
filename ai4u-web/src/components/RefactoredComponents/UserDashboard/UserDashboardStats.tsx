import { BookOpen, Clock, Target, TrendingUp } from "lucide-react";
import { LearningStats } from "../../../pages/UserDashboard";
import DashboardStatsCard from "../../../commonComponents/DashbordStatsCard";
import DynamicDropDown from "../../../commonComponents/DynamicDropDown";

const UserDashboardStats = ({ stats }: { stats: LearningStats }) => {
  const children = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardStatsCard
        icon={<BookOpen className="w-8 h-8 text-blue-600" />}
        progressLineOne={stats.totalCourses - stats.completedCourses}
        progressLineTwo={`${stats.completedCourses} completed`}
        variant="primary"
        title="Courses in Progress"
      />
      <DashboardStatsCard
        icon={<Target className="w-8 h-8 text-green-600" />}
        progressLineOne={stats.currentStreak}
        progressLineTwo={"days in a row"}
        variant="success"
        title="Learning Streak"
      />
      <DashboardStatsCard
        icon={<Clock className="w-8 h-8 text-yellow-600" />}
        progressLineOne={stats.totalHours}
        progressLineTwo={"hours learned"}
        variant="warning"
        title="Total Hours"
      />
      <DashboardStatsCard
        icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
        progressLineOne={stats.totalCourses - stats.completedCourses}
        progressLineTwo={
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(stats.weeklyProgress / stats.weeklyGoal) * 100}%`,
              }}
            ></div>
          </div>
        }
        variant="purple"
        title="Weekly Goal"
      />
    </div>
  );
  return (
    <div className="w-full">
      <DynamicDropDown title="Your Stats" defaultOpen children={children} />
    </div>
  );
};

export default UserDashboardStats;
