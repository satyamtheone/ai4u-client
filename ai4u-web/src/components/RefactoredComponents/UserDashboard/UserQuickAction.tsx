import { BarChart3, BookOpen, Clock, Play, Star, Target } from "lucide-react";
import { Button } from "../../shared/Button";
import { Card } from "../../shared/Card";

const UserQuickAction = () => {
  return (
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
  );
};

export default UserQuickAction;
