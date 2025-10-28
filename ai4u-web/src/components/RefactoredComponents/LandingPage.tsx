import { useState } from "react";
import DynamicButton from "../../commonComponents/DynamicButton";
import { AuthMain, useAuth } from "../auth";
import { useNavigate } from "react-router-dom";
import { useDialog } from "../../commonComponents/Dialog/DialogProvider";
import ModalProvider from "../../commonComponents/Dialog/ModalProvider";

const LandingPage = () => {
  const { openDialog, closeDialog } = useDialog();
  const { isAuthenticated, user } = useAuth();

  const navigate = useNavigate();
  const handleCloseAuthModal = () => {
    closeDialog();
    window.history.replaceState(
      {},
      "",
      (() => {
        const u = new URL(window.location.href);
        u.searchParams.delete("view");
        return u;
      })()
    );
  };

  const handleBypassAuth = () => {
    if (!isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleLogin = () => {
    openDialog({
      children: (
        <ModalProvider
          onClose={() => handleCloseAuthModal()}
          children={<AuthMain defaultView="login" redirectTo="/dashboard" />}
        />
      ),
    });
  };

  return (
    <div className="app bg-white text-black ">
      <div className="flex justify-center w-full">
        <div className="flex  flex-col items-center justify-center">
          <div className="welcome-icon">🤖</div>
          <h2 className="text-[28px] font-semibold dark:text-white  text-black mb-2">
            Welcome to AI4U
          </h2>
          <p className="text-[16px] dark:text-darkBackGround-400 text-gray-600  mb-8">
            Learn while you code with AI-powered assistance
          </p>

          <div className="topic-pills" style={{ marginBottom: "32px" }}>
            <DynamicButton
              label="🔐 Sign In / Sign Up"
              variant="primary"
              onClick={() => handleLogin()}
              className="py-0"
            />
            <DynamicButton
              label="🚀 Continue Without Account"
              variant="secondary"
              onClick={() => handleBypassAuth()}
            />
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#666666",
              maxWidth: "500px",
              lineHeight: "1.5",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <span style={{ color: "#10b981", fontWeight: "600" }}>
                ✨ With Account:
              </span>{" "}
              Save progress, learning analytics, personalized experience
            </div>
            <div>
              <span style={{ color: "#2563eb", fontWeight: "600" }}>
                ⚡ Without Account:
              </span>{" "}
              Full access to AI chat, no data saved
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {/* <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} /> */}
    </div>
  );
};

export default LandingPage;
