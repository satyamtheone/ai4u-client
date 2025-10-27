import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Settings,
  Building,
  User,
  BookOpen,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
  Shield,
  MessageSquare,
} from "lucide-react";
import { useAuth, usePermissions } from "../auth/AuthProvider";
import { AdminDashboard } from "./AdminDashboard";
import { TeamMemberDashboard } from "./TeamMemberDashboard";
import { OrganizationSettings } from "../organization/OrganizationSettings";
import { TeamManagement } from "../organization/TeamManagement";
import { PermissionMatrix } from "../organization/PermissionMatrix";
import { Button } from "../shared/Button";
import UserDashboard from "../../pages/UserDashboard";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  requiresPermission?: string[];
}

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { canManageOrganization, canManageTeam } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const getSidebarItems = (): SidebarItem[] => {
    const baseItems: SidebarItem[] = [
      {
        id: "overview",
        label: "Overview",
        icon: <Home className="w-5 h-5" />,
        path: "/dashboard",
      },
      {
        id: "learning",
        label: "Learning",
        icon: <BookOpen className="w-5 h-5" />,
        path: "/dashboard/learning",
      },
      {
        id: "chat",
        label: "AI Chat",
        icon: <MessageSquare className="w-5 h-5" />,
        path: "/dashboard/chat",
      },
      {
        id: "progress",
        label: "Progress",
        icon: <BarChart3 className="w-5 h-5" />,
        path: "/dashboard/progress",
      },
    ];

    // Add organization-specific items
    if (
      user?.userType === "organization_admin" ||
      user?.userType === "organization_user"
    ) {
      if (canManageTeam()) {
        baseItems.push({
          id: "team",
          label: "Team Management",
          icon: <Users className="w-5 h-5" />,
          path: "/dashboard/team",
        });
      }

      if (canManageOrganization()) {
        baseItems.push(
          {
            id: "permissions",
            label: "Permissions",
            icon: <Shield className="w-5 h-5" />,
            path: "/dashboard/permissions",
          },
          {
            id: "org-settings",
            label: "Organization",
            icon: <Building className="w-5 h-5" />,
            path: "/dashboard/organization",
          }
        );
      }
    }

    // Add personal settings
    baseItems.push({
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      path: "/dashboard/settings",
    });

    return baseItems;
  };

  const sidebarItems = getSidebarItems();

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const isActivePath = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AI4U</h1>
              <p className="text-xs text-gray-500">Learn While You Code</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.organization?.organizationName || "Individual Account"}
              </p>
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                  user?.userType === "organization_admin"
                    ? "bg-purple-100 text-purple-700"
                    : user?.userType === "organization_user"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {user?.userType === "organization_admin" && "Admin"}
                {user?.userType === "organization_user" && "Member"}
                {user?.userType === "individual" && "Individual"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-left text-sm font-medium rounded-lg transition-colors
                ${
                  isActivePath(item.path)
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-700 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {location.pathname === "/dashboard" && "Dashboard"}
                {location.pathname.includes("/team") && "Team Management"}
                {location.pathname.includes("/organization") &&
                  "Organization Settings"}
                {location.pathname.includes("/permissions") && "Permissions"}
                {location.pathname.includes("/learning") && "Learning"}
                {location.pathname.includes("/chat") && "AI Chat"}
                {location.pathname.includes("/progress") && "Progress"}
                {location.pathname.includes("/settings") && "Settings"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/organization" element={<OrganizationSettings />} />
            <Route path="/permissions" element={<PermissionMatrix />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview: React.FC = () => {
  const { user } = useAuth();

  if (user?.userType === "organization_admin") {
    return <AdminDashboard />;
  } else if (user?.userType === "organization_user") {
    return <TeamMemberDashboard />;
  } else {
    return <UserDashboard />;
  }
};

// Placeholder components for different pages
const LearningPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Learning Center</h1>
    <p>
      Learning content will be integrated here with your existing learning
      components.
    </p>
  </div>
);

const ChatPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
    <p>
      Your existing EnhancedChatInterface component will be integrated here.
    </p>
  </div>
);

const ProgressPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Learning Progress</h1>
    <p>Progress tracking and analytics will be shown here.</p>
  </div>
);

const SettingsPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
    <p>Personal account settings and preferences.</p>
  </div>
);
