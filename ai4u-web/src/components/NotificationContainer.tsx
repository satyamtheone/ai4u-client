import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { removeNotification } from "../store/uiSlice";
import { X } from "lucide-react";
import { getIcon, typeStyles } from "../RefactoredComponents/Constants";

const NotificationContainer: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    notifications.forEach((n) => {
      if (n.type !== "error") {
        const t = setTimeout(() => {
          dispatch(removeNotification(n.id));
        }, 5000);
        return () => clearTimeout(t);
      }
    });
  }, [notifications, dispatch]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {notifications.map((n) => {
        const s = typeStyles(n.type);
        return (
          <div
            key={n.id}
            className={`relative flex items-center justify-center gap-3 rounded-xl border border-l-8 border-l-${s.highlight} max-sm:py-2 p-4 pr-10 shadow-lg backdrop-blur-lg animate-slideInQuiz ${s.wrap}`}
            role="status"
          >
            {/* Icon */}
            <div className={`mt-0.5 ${s.icon}`}>{getIcon(n.type)}</div>

            {/* Content */}
            <div className="min-w-0">
              <div
                className={`text-sm leading-5 break-words text-white ${s.message}`}
              >
                {n.message}
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => dispatch(removeNotification(n.id))}
              className={`absolute right-2 max-h-min shadow-sm shadow-white/40 border-${s.wrap}  rounded-full p-1 text-gray-300 hover:text-white hover:bg-white/10 transition`}
              aria-label="Dismiss notification"
              title="Dismiss"
            >
              <X size={16} className=" font-extrabold" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationContainer;
