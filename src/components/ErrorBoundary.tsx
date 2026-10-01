import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 p-6 text-slate-900 select-none">
          <div className="max-w-md w-full bg-white border border-slate-300 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Application Error Recovered</h2>
              <p className="text-xs text-slate-500 mt-1">
                A rendering issue was caught safely to prevent a blank screen.
              </p>
            </div>

            {this.state.error && (
              <pre className="p-3 rounded-xl bg-slate-900 text-rose-300 text-[11px] font-mono text-left overflow-x-auto max-h-36">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
