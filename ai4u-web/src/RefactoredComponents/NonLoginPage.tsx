import DynamicButton from "../cmmonComponents/DynamicButton";
import DynamicModal from "../cmmonComponents/DynamicModal";
import { AuthMain } from "../components/auth";

const NonLoginPage = ({
  handleShowLogin,
  handleBypassAuth,
  showAuthModal,
  handleCloseAuthModal,
}: {
  handleShowLogin: () => void;
  handleBypassAuth: () => void;
  showAuthModal: boolean;
  handleCloseAuthModal: () => void;
}) => {
  return (
    <div className="app ">
      <div className="main-content">
        <div className="welcome-state">
          <div className="welcome-icon">🤖</div>
          <h2 className="welcome-title">Welcome to AI4U</h2>
          <p className="welcome-subtitle">
            Learn while you code with AI-powered assistance
          </p>

          <div className="topic-pills" style={{ marginBottom: "32px" }}>
            <DynamicButton
              label="🔐 Sign In / Sign Up"
              variant="primary"
              onClick={() => handleShowLogin()}
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
      <DynamicModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        headerIcon={"🔐"}
        HeadingText="Sign in to AI4U"
        HeadingDescription="Access your personalized learning experience"
        child={<AuthMain defaultView="login" redirectTo="/dashboard" />}
      />
    </div>
  );
};

export default NonLoginPage;
