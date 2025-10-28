import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Target,
  Award,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MoreVertical,
  Download,
} from "lucide-react";
import { Button } from "../components/shared/Button";
import { Card } from "../components/shared/Card";
import { useAuth } from "../components/auth";
import OrganizationDashboardStats from "../components/RefactoredComponents/OrganizationDashboard/OrganizationDashboardStats";

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  completionRate: number;
  avgProgress: number;
  monthlyGrowth: number;
  totalCourses: number;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  progress: number;
  lastActive: string;
  status: "active" | "inactive" | "pending";
}

interface RecentActivity {
  id: number;
  type: "completion" | "enrollment" | "achievement";
  user: string;
  description: string;
  timestamp: string;
}

export const OrganizationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    completionRate: 0,
    avgProgress: 0,
    monthlyGrowth: 0,
    totalCourses: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        totalMembers: 25,
        activeMembers: 18,
        completionRate: 78,
        avgProgress: 64,
        monthlyGrowth: 12,
        totalCourses: 8,
      });

      setTeamMembers([
        {
          id: 1,
          name: "Sarah Wilson",
          email: "sarah@company.com",
          role: "Developer",
          progress: 85,
          lastActive: "2 hours ago",
          status: "active",
        },
        {
          id: 2,
          name: "Mike Johnson",
          email: "mike@company.com",
          role: "Designer",
          progress: 92,
          lastActive: "1 day ago",
          status: "active",
        },
        {
          id: 3,
          name: "Emily Chen",
          email: "emily@company.com",
          role: "Product Manager",
          progress: 56,
          lastActive: "3 days ago",
          status: "inactive",
        },
        {
          id: 4,
          name: "David Brown",
          email: "david@company.com",
          role: "Developer",
          progress: 0,
          lastActive: "Never",
          status: "pending",
        },
        {
          id: 5,
          name: "Lisa Garcia",
          email: "lisa@company.com",
          role: "QA Engineer",
          progress: 73,
          lastActive: "5 hours ago",
          status: "active",
        },
      ]);

      setRecentActivity([
        {
          id: 1,
          type: "completion",
          user: "Sarah Wilson",
          description: 'completed "JavaScript Fundamentals"',
          timestamp: "2 hours ago",
        },
        {
          id: 2,
          type: "achievement",
          user: "Mike Johnson",
          description: 'earned "Design Expert" badge',
          timestamp: "1 day ago",
        },
        {
          id: 3,
          type: "enrollment",
          user: "Emily Chen",
          description: 'enrolled in "Product Strategy"',
          timestamp: "2 days ago",
        },
        {
          id: 4,
          type: "completion",
          user: "Lisa Garcia",
          description: 'completed "Testing Best Practices"',
          timestamp: "3 days ago",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "completion":
        return <Target className="w-4 h-4 text-green-600" />;
      case "achievement":
        return <Award className="w-4 h-4 text-yellow-600" />;
      case "enrollment":
        return <Plus className="w-4 h-4 text-blue-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
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
    <div className="md:p-6 p-2 space-y-6 overflow-scroll h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold ">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">
            Here's what's happening with your team's learning progress.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats Grid */}

      <OrganizationDashboardStats stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members Overview */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold ">Team Progress</h3>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className=" divide-y divide-gray-200">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium ">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.role}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${member.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium  min-w-0">
                            {member.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            member.status
                          )}`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.lastActive}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold ">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm ">
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Activity
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            /* Navigate to team management */
          }}
        >
          <div className="p-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-medium  mb-2">Manage Team</h4>
            <p className="text-sm text-gray-600">
              Add members, assign roles, and manage permissions
            </p>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            /* Navigate to learning paths */
          }}
        >
          <div className="p-6 text-center">
            <Award className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h4 className="font-medium  mb-2">Learning Paths</h4>
            <p className="text-sm text-gray-600">
              Create and manage custom learning experiences
            </p>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            /* Navigate to analytics */
          }}
        >
          <div className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h4 className="font-medium  mb-2">Analytics</h4>
            <p className="text-sm text-gray-600">
              View detailed reports and insights
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
