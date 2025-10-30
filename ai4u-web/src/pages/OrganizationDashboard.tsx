import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/shared/Button";
import { useAuth } from "../components/auth";
import OrganizationDashboardStats from "../components/RefactoredComponents/OrganizationDashboard/OrganizationDashboardStats";
import { useAppSelector } from "../hooks/redux";
import {
  Organization,
  OrganizationResponse,
  UserItem,
} from "../services/api/OrganizationService";
import ModalProvider from "../commonComponents/Dialog/ModalProvider";
import CreateMemberForm from "../components/RefactoredComponents/OrganizationDashboard/CreateMemberForm";
import { useDialog } from "../commonComponents/Dialog/DialogProvider";
import { DynamicTable } from "../commonComponents/DynamicTable";
import Chip from "../commonComponents/Chip";
import OrganizationDetails from "../components/RefactoredComponents/OrganizationDashboard/OrganizationDetails";
import { Card } from "../components/shared/Card";
import DynamicButton from "../commonComponents/DynamicButton";
import CreateOrganizationForm from "../components/RefactoredComponents/OrganizationDashboard/CreateOrganizationForm";

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  completionRate: number;
  avgProgress: number;
  monthlyGrowth: number;
  totalCourses: number;
}
export interface RecentActivity {
  id: number;
  type: "completion" | "enrollment" | "achievement";
  user: string;
  description: string;
  timestamp: string;
}

export const OrganizationDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    completionRate: 0,
    avgProgress: 0,
    monthlyGrowth: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const { openDialog, closeDialog } = useDialog();
  const organizationService = useAppSelector(
    (state) => (state.config as any).organizationService
  );

  // State for users and pagination
  const [users, setUsers] = useState<UserItem[]>([]);
  const [myOrganization, setMyOrganization] = useState<Organization>();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: 50,
    total_pages: 0,
  });

  useEffect(() => {
    if (
      !organizationService ||
      typeof organizationService.getAllMembers !== "function" ||
      typeof organizationService.getMyOrganizations !== "function"
    ) {
      console.warn("OrganizationService not initialized yet");
      return;
    }

    const fetchUsersAndOrgs = async () => {
      try {
        setLoading(true);

        // Fetch both in parallel
        const [membersRes, orgsRes] = await Promise.all([
          organizationService.getAllMembers(),
          organizationService.getMyOrganizations(),
        ]);

        // ✅ Set members
        if (membersRes?.items) {
          setUsers(membersRes.items);
          setPagination({
            total: membersRes.total || 0,
            page: pagination.page,
            page_size: pagination.page_size,
            total_pages: membersRes.total_pages || 1,
          });
        }

        if (orgsRes) {
          const org = orgsRes?.data?.[0] || orgsRes?.items?.[0] || orgsRes?.[0];
          setMyOrganization(org);
        }
      } catch (error) {
        console.error("❌ Error fetching users and organizations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndOrgs();
  }, []);

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

  const createOrganization = () => {
    openDialog({
      children: (
        <ModalProvider
          onClose={() => closeDialog()}
          children={<CreateOrganizationForm />}
        />
      ),
    });
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
        <span className="text-sm   flex justify-start">{row.login_count}</span>
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

  return (
    <div className="md:p-6 p-2 space-y-6 overflow-scroll h-screen animate-chatInBot">
      {loading ? (
        <>
          <Card className="h-[237px] animate-pulse bg-slate-200">
            <></>
          </Card>

          <Card className="h-[282px] animate-pulse bg-slate-200">
            <></>
          </Card>
          <Card className="h-[435px] animate-pulse bg-slate-200">
            <></>
          </Card>
        </>
      ) : (
        <>
          {myOrganization?.name ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold ">
                    Welcome back,{" "}
                    <span className=" font-extrabold uppercase">
                      {myOrganization?.name}
                    </span>
                    !
                  </h1>
                  <p>
                    Here's what's happening with your team's learning progress.
                  </p>
                </div>
                <div className="flex gap-3 z-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddMember()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
              </div>
              <OrganizationDashboardStats stats={stats} />
              {myOrganization && <OrganizationDetails org={myOrganization} />}
              <div className="w-full">
                <DynamicTable
                  title="Organization Members"
                  columns={columns}
                  data={users}
                  loading={loading}
                  className="h-[435px] overflow-auto"
                />
              </div>
            </>
          ) : (
            <>
              <div className="app bg-white text-black ">
                <div className="flex justify-center w-full">
                  <div className="flex  flex-col items-center justify-center">
                    <h2 className="text-[28px] font-semibold dark:text-white  text-black mb-2">
                      Welcome to Organization section
                    </h2>
                    <p className="text-[16px] dark:text-darkBackGround-400 text-gray-600  mb-8">
                      Currently you don't have any organization
                    </p>
                    <div
                      className="topic-pills"
                      style={{ marginBottom: "32px" }}
                    >
                      <DynamicButton
                        label="Create an Organization"
                        variant="secondary"
                        onClick={() => createOrganization()}
                        className="py-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
