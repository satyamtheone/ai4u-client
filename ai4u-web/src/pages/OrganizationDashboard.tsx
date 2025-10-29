import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Plus,
  Download,
} from "lucide-react";
import { Button } from "../components/shared/Button";
import { Card } from "../components/shared/Card";
import { useAuth } from "../components/auth";
import OrganizationDashboardStats from "../components/RefactoredComponents/OrganizationDashboard/OrganizationDashboardStats";
import { useAppSelector } from "../hooks/redux";
import { UserItem } from "../services/api/OrganizationService";
import ModalProvider from "../commonComponents/Dialog/ModalProvider";
import CreateMemberForm from "../components/RefactoredComponents/OrganizationDashboard/CreateMemberForm";
import { useDialog } from "../commonComponents/Dialog/DialogProvider";
import { DynamicTable } from "../commonComponents/DynamicTable";
import Chip from "../commonComponents/Chip";

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
  const { openDialog, closeDialog } = useDialog();
  const organizationService = useAppSelector(
    (state) => (state.config as any).organizationService
  );

  // State for users and pagination
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: 50,
    total_pages: 0,
  });

  // Effect: fetch paginated users
  useEffect(() => {
    if (
      !organizationService ||
      typeof organizationService.getAllMembers !== "function"
    ) {
      console.warn("OrganizationService not initialized yet");
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await organizationService.getAllMembers();
        if (response) {
          setUsers(response.items);
          setPagination((prev) => ({
            ...prev,
            total: response.total,
            total_pages: response.total_pages,
          }));
        } else {
          console.error("❌ Failed to fetch users:", response.message);
        }
      } catch (err) {
        console.error("❌ Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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

  const handleAddMember = () => {
    openDialog({
      children: (
        <ModalProvider
          onClose={() => closeDialog()}
          children={<CreateMemberForm />}
        />
      ),
    });
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

  const columns = [
    {
      key: "name",
      header: "Member Name",
      render: (row: any) => (
        <div>
          <div className="text-sm font-medium">
            {`${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (row: any) => (
        <span className="text-sm ">{row.email || "—"}</span>
      ),
    },
    {
      key: "activeness",
      header: "Activeness",
      render: (row: any) => (
        <span className="text-sm   flex justify-center">{row.login_count}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (row: any) => (
        <span className="text-sm ">{row.phone || "No phone"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: any) => {
        const status = row.is_active ? "active" : "inactive";
        return (
          <div className=" flex justify-start">
            <Chip
              label={status}
              variant={`${status === "active" ? "success" : "default"}`}
              className="py-0 text-xs"
            />
          </div>
        );
      },
    },
  ];

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
          <h1 className="text-2xl font-bold ">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your team's learning progress.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleAddMember()}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats Grid */}

      <OrganizationDashboardStats stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DynamicTable
            title="Organization Members"
            columns={columns}
            data={users}
            loading={loading}
            className="h-[435px] overflow-auto"
          />
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
