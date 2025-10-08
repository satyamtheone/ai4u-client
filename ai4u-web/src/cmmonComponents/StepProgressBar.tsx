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
                  : "dark:bg-gray-200 bg-gray-300 dark:text-gray-600 text-gray-800"
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
                ${
                  currentStep > step
                    ? "bg-blue-600"
                    : "dark:bg-gray-200 bg-gray-800"
                }
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
