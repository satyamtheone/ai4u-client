import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Target,
  Trophy,
  Clock,
  TrendingUp,
  Play,
  CheckCircle,
  Star,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../components/auth/AuthProvider";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { UserLearningAnalyticsResponse } from "../services/api/LearningService";
import { useAppSelector } from "../hooks/redux";
import { User } from "../components/auth";

interface LearningStats {
  totalCourses: number;
  completedCourses: number;
  currentStreak: number;
  totalHours: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  progress: number;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  thumbnail?: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: string;
}

const UserDashboard: React.FC = () => {
  const [stats, setStats] = useState<LearningStats>({
    totalCourses: 0,
    completedCourses: 0,
    currentStreak: 0,
    totalHours: 0,
    weeklyGoal: 0,
    weeklyProgress: 0,
  });
  // types
  interface LearningService {
    getCurrentUserAnalytics: (
      userId: string
    ) => Promise<UserLearningAnalyticsResponse>;
  }

  const learningService = useAppSelector(
    (state) => (state.config as any).learningService
  );
  const { user, isAuthenticated } = useAuth();

  const [currentAnalytics, setCurrentAnalytics] = useState<
    UserLearningAnalyticsResponse | undefined
  >();
  const [currentCourses, setCurrentCourses] = useState<Course[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guard: don’t call before the service exists
    if (
      !learningService ||
      typeof learningService.getCurrentUserAnalytics !== "function"
    ) {
      console.warn("LearningService not initialized yet");
      return;
    }
    const fetchUSerAnalytics = async () => {
      try {
        console.log("Fetching learning stats...");
        const stats = await learningService.getCurrentUserAnalytics(user?.id);
        setCurrentAnalytics(stats as UserLearningAnalyticsResponse);
      } catch (err) {
        console.error("❌ Failed to fetch learning stats:", err);
      }
    };

    fetchUSerAnalytics();
  }, [learningService, isAuthenticated]);

  useEffect(() => {
    fetchDashboardData?.();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        totalCourses: 12,
        completedCourses: 8,
        currentStreak: 5,
        totalHours: 47,
        weeklyGoal: 10,
        weeklyProgress: 7,
      });

      setCurrentCourses([
        {
          id: 1,
          title: "Advanced JavaScript Concepts",
          description:
            "Deep dive into closures, prototypes, and async programming",
          progress: 65,
          duration: "4.5 hours",
          difficulty: "advanced",
          category: "Programming",
        },
        {
          id: 2,
          title: "React Hooks Mastery",
          description: "Master all React hooks and custom hook patterns",
          progress: 30,
          duration: "3.2 hours",
          difficulty: "intermediate",
          category: "Frontend",
        },
        {
          id: 3,
          title: "AI Fundamentals",
          description: "Introduction to machine learning and AI concepts",
          progress: 15,
          duration: "6.0 hours",
          difficulty: "beginner",
          category: "AI/ML",
        },
      ]);

      setRecentAchievements([
        {
          id: 1,
          title: "JavaScript Expert",
          description: "Completed 5 JavaScript courses",
          icon: "🏆",
          earnedAt: "2 days ago",
          category: "Programming",
        },
        {
          id: 2,
          title: "Week Warrior",
          description: "Maintained 7-day learning streak",
          icon: "🔥",
          earnedAt: "1 week ago",
          category: "Consistency",
        },
        {
          id: 3,
          title: "Quick Learner",
          description: "Completed a course in record time",
          icon: "⚡",
          earnedAt: "2 weeks ago",
          category: "Speed",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-scroll h-screen">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold ">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="">
            Ready to continue your learning journey? You're doing great!
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button variant="primary" size="sm">
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Courses
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card padding="lg" className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium ">Courses in Progress</p>
              <p className="text-3xl font-bold ">
                {stats.totalCourses - stats.completedCourses}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.completedCourses} completed
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card padding="lg" className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium ">Learning Streak</p>
              <p className="text-3xl font-bold ">{stats.currentStreak}</p>
              <p className="text-sm text-gray-500 mt-1">days in a row</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card padding="lg" className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium ">Total Hours</p>
              <p className="text-3xl font-bold ">{stats.totalHours}</p>
              <p className="text-sm text-gray-500 mt-1">hours learned</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card padding="lg" className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium ">Weekly Goal</p>
              <p className="text-3xl font-bold ">
                {stats.weeklyProgress}/{stats.weeklyGoal}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (stats.weeklyProgress / stats.weeklyGoal) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold ">Continue Learning</h3>
            </div>
            <div className="p-6 space-y-4">
              {currentCourses.map((course) => (
                <div
                  key={course.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium ">{course.title}</h4>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(
                            course.difficulty
                          )}`}
                        >
                          {course.difficulty}
                        </span>
                      </div>
                      <p className="text-sm  mb-3">{course.description}</p>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {course.category}
                          </span>
                        </div>
                        <span className="text-sm font-medium ">
                          {course.progress}% complete
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <Button size="sm" variant="primary">
                          <Play className="w-3 h-3 mr-1" />
                          Continue
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Achievements & Quick Stats */}
        <div className="space-y-6">
          {/* Recent Achievements */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold ">Recent Achievements</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-2xl">
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium ">
                        {achievement.title}
                      </p>
                      <p className="text-xs  mb-1">{achievement.description}</p>
                      <p className="text-xs text-gray-500">
                        {achievement.earnedAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button variant="ghost" size="sm" className="w-full">
                  <Trophy className="w-4 h-4 mr-2" />
                  View All Achievements
                </Button>
              </div>
            </div>
          </Card>

          {/* Learning Insights */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold ">Learning Insights</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm ">Completion Rate</span>
                <span className="text-sm font-medium ">
                  {Math.round(
                    (stats.completedCourses / stats.totalCourses) * 100
                  )}
                  %
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm ">Avg. Daily Study</span>
                <span className="text-sm font-medium ">1.2 hours</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm ">Favorite Category</span>
                <span className="text-sm font-medium ">Programming</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm ">Next Milestone</span>
                <span className="text-sm font-medium ">50 hours</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-4 text-center">
            <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium  mb-1">Browse Courses</h4>
            <p className="text-xs ">Discover new learning paths</p>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-4 text-center">
            <BarChart3 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium  mb-1">Progress Report</h4>
            <p className="text-xs ">View detailed analytics</p>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-4 text-center">
            <Target className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium  mb-1">Set Goals</h4>
            <p className="text-xs ">Create learning objectives</p>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-4 text-center">
            <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium  mb-1">Favorites</h4>
            <p className="text-xs ">Access saved content</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
