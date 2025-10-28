import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from "./components/RefactoredComponents/SideBar";

export default function AppLayout() {
  return (
    <div className="min-h-screen transition-all duration-300 ">
      {/* Fixed left sidebar */}
      <aside className=" inset-y-0 left-0 ">
        <SideBar />
      </aside>

      {/* Right side content */}
      <div className="ml-16   ">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
