import React, { useState, useEffect } from "react";
import { BookOpen, Calendar } from "lucide-react";
import { useAuth } from "../components/auth/AuthProvider";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { UserLearningAnalyticsResponse } from "../services/api/LearningService";
import { useAppSelector } from "../hooks/redux";

import UserDashboardStats from "../components/RefactoredComponents/UserDashboard/UserDashboardStats";
import UserDetails from "../components/RefactoredComponents/UserDashboard/UserDetails";
import { LearningStats } from "../components/RefactoredComponents/UserDashboard/UserCourseDetails";
import LearningInsights from "../components/RefactoredComponents/UserDashboard/LearningInsights";

const UserDashboard: React.FC = () => {
  const learningService = useAppSelector(
    (state) => (state.config as any).learningService
  );

  const { user, isAuthenticated, organization } = useAuth();

  const [currentAnalytics, setCurrentAnalytics] = useState<
    UserLearningAnalyticsResponse | undefined
  >();

  const [stats, setStats] = useState<LearningStats>({
    totalCourses: 0,
    completedCourses: 0,
    currentStreak: 0,
    totalHours: 0,
    weeklyGoal: 0,
    weeklyProgress: 0,
  });

  useEffect(() => {
    if (
      !learningService ||
      typeof learningService.getCurrentUserAnalytics !== "function"
    ) {
      console.warn("LearningService not initialized yet");
      return;
    }
    const fetchUSerAnalytics = async () => {
      try {
        const stats = await learningService.getCurrentUserAnalytics(user?.id);
        setCurrentAnalytics(stats as UserLearningAnalyticsResponse);
      } catch (err) {
        console.error("❌ Failed to fetch learning stats:", err);
      }
    };

    fetchUSerAnalytics();
  }, [learningService, isAuthenticated]);

  return (
    <div className="md:p-6 p-2 space-y-6 overflow-scroll h-screen w-full animate-chatInBot">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold ">
            Welcome back,{" "}
            <span className=" font-extrabold uppercase">
              {user?.first_name}
            </span>
            ! 👋
          </h1>
          <p className="">
            Ready to continue your learning journey? You're doing great!
          </p>
        </div>
      </div>
      <UserDashboardStats stats={stats} />
      {user && <UserDetails user={user} />}
      {currentAnalytics && <LearningInsights data={currentAnalytics} />}
    </div>
  );
};

export default UserDashboard;
