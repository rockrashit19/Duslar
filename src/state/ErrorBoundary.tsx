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
        <div style={{ padding: 16 }}>
          <h2>❌ Непредвиденная ошибка</h2>
          <p>Попробуйте обновить страницу.</p>
          <button onClick={() => window.location.reload()}>Обновить</button>
        </div>
      );
    }
    return this.props.children;
  }
}
