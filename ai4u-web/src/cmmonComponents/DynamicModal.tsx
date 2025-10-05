import { Heading, X } from "lucide-react";
import { JSX } from "react";
import ModalCloseButton from "./ModalCloseButton";

const DynamicModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  child: JSX.Element;
  headerIcon?: JSX.Element | string;
  HeadingDescription?: string;
  HeadingText?: string;
  sizes?: "xl" | "lg" | "md" | "sm" | "full";
}> = ({
  isOpen,
  onClose,
  child,
  sizes,
  headerIcon,
  HeadingDescription,
  HeadingText,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0  bg-[rgba(0,0,0,0.8)] backdrop-blur-[8px] flex items-center justify-center z-[1000]"
      style={{
        animation: "fadeInBackdrop 0.3s ease-out",
      }}
    >
      <div
        className={`bg-[#1a1a1a] border-2 border-[#404040] rounded-[20px] p-4  max-w-${
          sizes ? sizes : "[450px]"
        } w-[90%] max-h-[90vh] overflow-auto relative`}
        style={{
          animation: "slideInQuiz 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        {/* Close button */}
        <ModalCloseButton onClick={onClose} />

        {/* Auth form header */}
        <div className="text-center mb-6">
          <div className="text-[48px] mb-4">{headerIcon}</div>
          <h2 className="text-white text-[24px] font-semibold mb-2">
            {HeadingText}
          </h2>
          <p className="text-[#b3b3b3] text-[14px]">{HeadingDescription}</p>
        </div>

        {/* V2 Auth Component */}
        <div className="w-full flex justify-center">{child}</div>
      </div>
    </div>
  );
};

export default DynamicModal;
