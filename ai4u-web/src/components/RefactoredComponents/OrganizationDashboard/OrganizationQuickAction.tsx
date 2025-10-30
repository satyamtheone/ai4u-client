import { Award, TrendingUp, Users } from "lucide-react";
import { Card } from "../../shared/Card";

const OrganizationQuickAction = () => {
  return (
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
  );
};

export default OrganizationQuickAction;
