import { LucideIcon } from "lucide-react";

const LoadingMessage = ({
  message,
  icon: Icon,
}: {
  message: string;
  icon: LucideIcon;
}) => {
  return (
    <div className="flex gap-3 items-start animate-chatInBot">
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-violet-500 text-white flex-shrink-0">
        <Icon size={16} />
      </div>

      {/* Message Bubble */}
      <div className="max-w-[70%] px-5 py-4 rounded-2xl border border-[#404040] dark:bg-[#2a2a2a] bg-zinc-300 dark:text-white text-black text-sm leading-relaxed rounded-bl-sm">
        <div className="flex items-center gap-2">
          {/* Animated Loading Dots */}
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full dark:bg-gray-400 bg-blue-600 animate-[loadingBounce_1.4s_ease-in-out_infinite] [animation-delay:-0.32s]" />
            <div className="w-2 h-2 rounded-full dark:bg-gray-400 bg-blue-600 animate-[loadingBounce_1.4s_ease-in-out_infinite] [animation-delay:-0.16s]" />
            <div className="w-2 h-2 rounded-full dark:bg-gray-400 bg-blue-600 animate-[loadingBounce_1.4s_ease-in-out_infinite]" />
          </div>

          {/* Loading Text */}
          <span className="ml-2 text-sm">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage;
