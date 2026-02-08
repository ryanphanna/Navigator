import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Mail, Lock, Loader2, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { getUserFriendlyError } from '../utils/errorMessages';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0); // 0: Email, 1: Password/Invite
    const [isSignUp, setIsSignUp] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        } else {
            // Reset state on close
            setStep(0);
            setEmail('');
            setPassword('');

            setError(null);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Check if user exists via RPC
            // This allows us to seamlessly route to Login vs Join Beta
            const { data: exists, error: checkError } = await supabase.rpc('check_user_exists', {
                email_input: email.toLowerCase().trim()
            });

            if (!checkError) {
                setIsSignUp(!exists);
            } else {
                // Background fallback: If RPC fails, we'll default to login
                // but keep a way to switch if needed.
                console.warn('check_user_exists RPC failed or not found. Defaulting to Sign In.');
                setIsSignUp(false);
            }

            setStep(1);
        } catch (err: any) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isSignUp) {


                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setSuccessMessage("Account created! Please check your email to confirm.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Sync data after successful login
                await import('../services/storageService').then(m => m.Storage.syncLocalToCloud());
                onClose(); // Close on successful login
            }
        } catch (err: any) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20 ring-1 ring-slate-900/5 dark:ring-white/10">
                <div className="px-8 py-6 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-900/20 dark:to-violet-900/20">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
                        {successMessage ? 'Success' : step === 0 ? 'Sign In or Join' : isSignUp ? 'Join the Beta' : 'Welcome Back'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    {successMessage ? (
                        <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Check your inbox</h4>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">{successMessage}</p>
                            <button
                                onClick={onClose}
                                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl"
                            >
                                Close
                            </button>
                        </div>
                    ) : step === 0 ? (
                        <form onSubmit={handleEmailSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md text-slate-500 dark:text-slate-400 group-focus-within:bg-slate-800 dark:group-focus-within:bg-slate-200 group-focus-within:text-white dark:group-focus-within:text-slate-900 transition-colors">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-14 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 dark:text-white"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Continue</span>}
                                <ArrowRight className="w-5 h-5" />
                            </button>

                            <p className="text-center text-xs text-slate-400">
                                Use your work email for direct access.
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleAuthSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-700 mb-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{email}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep(0)}
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Change
                                </button>
                            </div>



                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                                    {!isSignUp && (
                                        <button type="button" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md text-slate-500 dark:text-slate-400 group-focus-within:bg-slate-800 dark:group-focus-within:bg-slate-200 group-focus-within:text-white dark:group-focus-within:text-slate-900 transition-colors">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-14 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 dark:text-white"
                                        placeholder="••••••••"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-sm animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                    {isSignUp ? 'Actually, I have an account' : "Wait, I don't have an account"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
