import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from "./components/RefactoredComponents/SideBar";

export default function AppLayout() {
  return (
    <div className="min-h-screen transition-all duration-100 ">
      {/* Right side content */}
      <div className="flex w-full">
        <SideBar />
        <div className="w-full  ">
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
