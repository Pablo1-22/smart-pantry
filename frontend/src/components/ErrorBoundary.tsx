import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-page">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <h1 style={{ marginBottom: 8 }}>Coś poszło nie tak</h1>
            <p className="auth-subtitle">
              {this.state.error?.message ?? "Nieznany błąd"}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
            >
              Wróć na stronę główną
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
