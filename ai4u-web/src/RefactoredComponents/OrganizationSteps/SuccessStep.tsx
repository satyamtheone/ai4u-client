import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "../../components/shared/Button";
import DynamicButton from "../../commonComponents/DynamicButton";

const SuccessStep = ({ className }: { className: string }) => {
  return (
    <div className={`text-center space-y-6 ${className}`}>
      <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Organization Created Successfully!
        </h2>
        <p className="text-gray-600">
          Welcome to AI4U! You can now manage your team and start learning
          together.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm text-blue-800 font-medium">
          📧 Please check your email to verify your account
        </p>
        <p className="text-sm text-blue-700">
          👥 You can start inviting team members once your email is verified
        </p>
      </div>

      <Button
        onClick={() => (window.location.href = "/dashboard")}
        variant="primary"
        size="lg"
        className="w-full"
      >
        Go to Organization Dashboard
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      <DynamicButton
        label={"Go to Organization Dashboard"}
        iconPosition="flex-row-reverse"
        icon={<ArrowRight className="ml-2 h-4 w-4" />}
        className="w-full"
        onClick={() => (window.location.href = "/dashboard")}
      />
    </div>
  );
};

export default SuccessStep;
