const ErrorMessage = ({ error }: { error: string }) => {
  return (
    <div className="message bot">
      <div className="message-avatar bot" style={{ background: "#ef4444" }}>
        <span>!</span>
      </div>
      <div
        className="message-bubble bot"
        style={{
          borderColor: "#ef4444",
          background: "rgba(239, 68, 68, 0.1)",
        }}
      >
        <div style={{ color: "#ef4444", fontWeight: 500 }}>Error</div>
        <div style={{ fontSize: "13px", opacity: 0.9 }}>{error}</div>
      </div>
    </div>
  );
};

export default ErrorMessage;
