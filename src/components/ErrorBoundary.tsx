import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

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
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4 font-sans">
                    <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-10 h-10" />
                        </div>

                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                            Something went wrong
                        </h1>

                        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                            {this.state.error?.message || "An unexpected error occurred. Don't worry, your data is safe in local storage."}
                        </p>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center gap-2 w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-3 rounded-xl font-semibold hover:scale-[1.02] active:scale-98 transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Reloading
                            </button>

                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center gap-2 w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 py-3 rounded-xl font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                            >
                                <Home className="w-4 h-4" />
                                Return Home
                            </button>
                        </div>

                        <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-400">
                                If this keep happening, please check your environment variables or clear your browser cache.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
