import React from "react";

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { error: Error | null };

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(err: Error, info: any) {
    console.error(err, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h2 className="error-boundary__title">❌ Непредвиденная ошибка</h2>
          <p className="error-boundary__message">
            Попробуйте обновить страницу.
          </p>
          <button
            className="error-boundary__button"
            onClick={() => window.location.reload()}
          >
            Обновить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
