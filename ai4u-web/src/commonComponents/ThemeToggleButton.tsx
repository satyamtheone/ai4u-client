import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeToggleButton: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 md:px-2 px-1 max-w-min md:py-2 py-1 rounded-full 
                transition-all duration-600 
                 shadow-md hover:shadow-lg hover:scale-105 animate-fadeInBackdrop ${
                   theme === "dark" ? "bg-white" : "bg-gray-800 "
                 }`}
    >
      {theme === "light" ? (
        <>
          <Sun className="w-5 h-5 font-extrabold text-white animate-slideInQuiz  " />
        </>
      ) : (
        <>
          <Moon className="w-5 h-5 text-blue-500 animate-slideInQuiz " />
        </>
      )}
    </button>
  );
};

export default ThemeToggleButton;
