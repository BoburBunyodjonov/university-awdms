import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary', error, info);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md p-8 text-center">
          <p className="text-sm font-semibold text-red-700">
            Something went wrong.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {this.state.error.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
