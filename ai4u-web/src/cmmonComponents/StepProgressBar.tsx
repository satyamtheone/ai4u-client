import React from "react";

interface StepProgressProps {
  totalSteps: number;
  currentStep: number;
  className?: string;
}

export const StepProgressBar: React.FC<StepProgressProps> = ({
  totalSteps,
  currentStep,
  className = "",
}) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          {/* Step Circle */}
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center 
              text-sm font-medium transition-colors duration-300
              ${
                currentStep >= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }
            `}
          >
            {step}
          </div>

          {/* Connector Line (except after last step) */}
          {index < totalSteps - 1 && (
            <div
              className={`
                flex-1 h-1 mx-2 transition-colors duration-300
                ${currentStep > step ? "bg-blue-600" : "bg-gray-200"}
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
