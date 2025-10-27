import React from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AI4U App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <div className="main-content">
            <div className="welcome-state">
              <div className="welcome-icon" style={{ fontSize: "48px" }}>
                ⚠️
              </div>
              <h2 className="welcome-title">Oops! Something went wrong</h2>
              <p className="welcome-subtitle">
                AI4U encountered an unexpected error. Please refresh the page to
                try again.
              </p>

              <div className="topic-pills">
                <button
                  className="topic-pill"
                  onClick={() => window.location.reload()}
                  style={{ background: "#2563eb", color: "white" }}
                >
                  🔄 Refresh Page
                </button>
                <button
                  className="topic-pill"
                  onClick={() => (window.location.href = "/")}
                  style={{ background: "#10b981", color: "white" }}
                >
                  🏠 Go to Home
                </button>
              </div>

              {process.env.NODE_ENV === "development" && (
                <details
                  style={{
                    marginTop: "24px",
                    textAlign: "left",
                    background: "#2a2a2a",
                    border: "1px solid #404040",
                    borderRadius: "8px",
                    padding: "16px",
                    maxWidth: "600px",
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#b3b3b3",
                      marginBottom: "8px",
                    }}
                  >
                    Technical Details (Development Only)
                  </summary>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      fontFamily: "monospace",
                      overflow: "auto",
                      maxHeight: "200px",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                      Error:
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      {this.state.error?.message}
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                      Stack Trace:
                    </div>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        fontSize: "11px",
                        lineHeight: "1.4",
                      }}
                    >
                      {this.state.error?.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
