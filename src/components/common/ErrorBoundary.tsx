import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="p-4 bg-red-50 rounded-full mb-6">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Something went wrong</h2>
                    <p className="text-neutral-500 max-w-md mb-8 leading-relaxed">
                        We encountered an unexpected error. This has been logged and we're looking into it.
                    </p>

                    {this.state.error && (
                        <div className="mb-8 p-4 bg-neutral-900 rounded-lg text-left max-w-lg w-full overflow-hidden">
                            <code className="text-xs font-mono text-red-300 block break-all">
                                {this.state.error.message}
                            </code>
                        </div>
                    )}

                    <button
                        onClick={this.handleRetry}
                        className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
