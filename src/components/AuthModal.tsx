import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Mail, Lock, Loader2, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isSignUp) {
                // Dynamic Invite Check (RPC)
                const { data: isValid, error: rpcError } = await supabase.rpc('redeem_invite_code', {
                    code_input: inviteCode
                });

                if (rpcError) {
                    console.error('Invite Check Error:', rpcError);
                    throw new Error("System Error checking invite code.");
                }

                if (!isValid) {
                    throw new Error("Invalid or Expired Invite Code.");
                }

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
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    {successMessage ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Check your email</h4>
                            <p className="text-slate-600 mb-6">{successMessage}</p>
                            <button
                                onClick={() => setIsSignUp(false)}
                                className="text-indigo-600 font-medium hover:underline"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSignUp && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Invite Code</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                                        <input
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono tracking-wider"
                                            placeholder="ENTER CODE"
                                        />
                                    </div>
                                    <p className="text-xs text-indigo-600 mt-1">
                                        Beta access is currently invite-only.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2 text-rose-600 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                {isSignUp ? 'Create Account' : 'Sign In'}
                            </button>

                            <div className="text-center pt-4 border-t border-slate-100 mt-6">
                                <p className="text-sm text-slate-500">
                                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                                    <button
                                        type="button"
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="text-indigo-600 font-medium hover:underline"
                                    >
                                        {isSignUp ? 'Sign In' : 'Sign Up'}
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
