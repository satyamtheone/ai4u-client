import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "../../shared/Button";
import DynamicButton from "../../../commonComponents/DynamicButton";

const IndividualSuccess = ({ className }: { className: string }) => {
  return (
    <div className={`text-center space-y-6 ${className}`}>
      <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Welcome to AI4U!</h2>
        <p className="text-gray-600">
          Your account has been created successfully. Start your personal
          learning journey.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📧 Please check your email to verify your account and unlock all
          features.
        </p>
      </div>
      <DynamicButton
        data-cy="go-to-dashboard-button"
        onClick={() => (window.location.href = "/dashboard")}
        variant="primary"
        label="Go to Dashboard"
        icon={<ArrowRight className="ml-2 h-4 w-4" />}
        className="w-full"
        iconPosition="flex-row-reverse"
      />
    </div>
  );
};

export default IndividualSuccess;
