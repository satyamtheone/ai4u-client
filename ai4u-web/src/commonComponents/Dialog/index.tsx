import React, { JSX } from "react";
import ModalCloseButton from "../ModalCloseButton";
export type TModalProps = {
  onClose: () => void;
  children?: JSX.Element;
  headerIcon?: JSX.Element | string;
  HeadingDescription?: string;
  HeadingText?: string;
  sizes?: "xl" | "lg" | "md" | "sm" | "full";
};
const Modal = ({
  onClose,
  children,
  sizes,
  headerIcon,
  HeadingDescription,
  HeadingText,
}: TModalProps) => {
  return (
    <div className="fixed inset-0  dark:bg-darkBackGround-1000 bg-white/65  backdrop-blur-[8px] flex items-center justify-center z-[1000] animate-fadeInBackdrop">
      <div
        data-cy="modal-container"
        className={`pt-10 dark:bg-darkBackGround-950 bg-white dark:text-white  text-black border-2  dark:border-darkBackGround-900 shadow-2xl  rounded-[20px] px-2 pb-4  max-w-${
          sizes ? sizes : "[450px]"
        } w-[95%] max-h-[95vh] overflow-auto relative animate-slideInQuiz`}
      >
        {/* Close button */}
        <ModalCloseButton onClick={onClose} />

        {/* Auth form header */}
        <div className="text-center mb-6">
          <div className="text-[48px] mb-4 flex justify-center">
            {headerIcon}
          </div>
          <h2 className="t text-[24px] font-semibold mb-2">{HeadingText}</h2>
          <p className=" text-[14px]">{HeadingDescription}</p>
        </div>

        {/* V2 Auth Component */}
        <div className="w-full flex justify-center ">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
