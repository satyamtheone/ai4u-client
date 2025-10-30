import { Award, Calendar, Plus, Target } from "lucide-react";
import { Button } from "../../shared/Button";
import { Card } from "../../shared/Card";
import { RecentActivity } from "../../../pages/OrganizationDashboard";

const OrganizationRecentActivity = ({
  recentActivity,
}: {
  recentActivity: RecentActivity[];
}) => {
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
  return (
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
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
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
  );
};

export default OrganizationRecentActivity;
