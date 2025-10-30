import { Loader, Search, Send } from "lucide-react";

const ChatInput = ({
  inputMessage,
  setInputMessage,
  isConnected,
  isLoading,
  handleKeyPress,
  handleSendMessage,
}: {
  inputMessage: string;
  setInputMessage: (value: React.SetStateAction<string>) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isConnected: boolean;
  isLoading: boolean;
  handleSendMessage: () => Promise<void>;
}) => {
  return (
    <div className="md:p-5 p-2 border-t border-darkBackGround-700 dark:bg-darkBackGround-950 ">
      <div className="flex items-end md:gap-3 gap-1 md:p-2 p-0.5 max-md:px-1 dark:bg-darkBackGround-300 border-2 border-darkBackGround-900 rounded-2xl  focus-within:border-blue-600">
        <Search className="text-gray-400 m-3 w-5 h-5" size={20} />

        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            isConnected
              ? "Ask me anything about coding..."
              : "Please connect to backend first"
          }
          disabled={!isConnected || isLoading}
          rows={1}
          className="flex-1 bg-transparent border-none inline dark:text-white text-black text-sm leading-relaxed resize-none outline-none py-3 max-h-[120px] overflow-hidden font-inherit placeholder:text-gray-500"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
        />

        <div className="flex items-center md:gap-2 gap-1">
          <button className="p-2 text-gray-400 rounded-md  hover:text-white dark:hover:bg-darkBackGround-900 hover:bg-gray-300">
            📎
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected || isLoading}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white  hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
