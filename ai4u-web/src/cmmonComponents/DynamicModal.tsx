import { JSX } from "react";
import ModalCloseButton from "./ModalCloseButton";

const DynamicModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  child?: JSX.Element;
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
    <div className="fixed inset-0  dark:bg-darkBackGround-1000 bg-white/65  backdrop-blur-[8px] flex items-center justify-center z-[1000] animate-fadeInBackdrop">
      <div
        className={` dark:bg-darkBackGround-950 bg-white dark:text-white  text-black border-2  dark:border-darkBackGround-900 shadow-2xl  rounded-[20px] p-4  max-w-${
          sizes ? sizes : "[450px]"
        } w-[90%] max-h-[90vh] overflow-auto relative animate-slideInQuiz`}
      >
        {/* Close button */}
        <ModalCloseButton onClick={onClose} />

        {/* Auth form header */}
        <div className="text-center mb-6">
          <div className="text-[48px] mb-4">{headerIcon}</div>
          <h2 className="t text-[24px] font-semibold mb-2">{HeadingText}</h2>
          <p className=" text-[14px]">{HeadingDescription}</p>
        </div>

        {/* V2 Auth Component */}
        <div className="w-full flex justify-center ">{child}</div>
      </div>
    </div>
  );
};

export default DynamicModal;
