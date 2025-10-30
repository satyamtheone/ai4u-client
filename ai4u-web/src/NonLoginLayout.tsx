import React from "react";
import { Outlet } from "react-router-dom";
import ThemeToggleButton from "./commonComponents/ThemeToggleButton";

export default function NonLoginLayout() {
  return (
    <div className="min-h-screen transition-all duration-100 ">
      <div className="absolute hidden">
        <ThemeToggleButton />
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
