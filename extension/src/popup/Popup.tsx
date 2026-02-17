import React, { useEffect, useState } from 'react';
import { Briefcase, Link as LinkIcon, Save, Check, FileText, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const Popup = () => {
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [pageTitle, setPageTitle] = useState<string>('');
    const [pageContent, setPageContent] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'scraping' | 'ready' | 'saving' | 'saved' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        checkAuth();

        // Initialize Tab Info
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id && tabs[0]?.url) {
                setCurrentUrl(tabs[0].url);
                setPageTitle(tabs[0].title || '');
                scrapeContent(tabs[0].id);
            }
        });
    }, []);

    const checkAuth = async () => {
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsAuthenticated(true);
        }
        setAuthLoading(false);
    };

    const handleLogin = async () => {
        if (!email || !password) return;
        setAuthLoading(true);
        setErrorMessage("");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error || !data.session) {
            console.error(error);
            setErrorMessage("Invalid email or password.");
        } else {
            setIsAuthenticated(true);
        }
        setAuthLoading(false);
    };

    const scrapeContent = (tabId: number) => {
        setStatus('scraping');
        try {
            chrome.tabs.sendMessage(tabId, { action: 'scrape_page' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    setStatus('error');
                    setErrorMessage("Refresh page to activate Navigator");
                    return;
                }

                if (response && response.success) {
                    setPageContent(response.text);
                    setStatus('ready');
                } else {
                    setStatus('error');
                    setErrorMessage("Could not read page content");
                }
            });
        } catch (e) {
            setStatus('error');
            setErrorMessage("Connection failed");
        }
    };

    const handleSave = async () => {
        if (!pageContent) return;
        setStatus('saving');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setStatus('error');
                setIsAuthenticated(false);
                setErrorMessage("Session expired. Please log in again.");
                return;
            }

            const { error } = await supabase
                .from('jobs')
                .insert({
                    user_id: session.user.id,
                    title: pageTitle,
                    company: "Unknown Company",
                    job_url: currentUrl,
                    description: pageContent,
                    status: 'saved',
                    source: 'extension'
                });

            if (error) throw error;

            setStatus('saved');
        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setErrorMessage(e.message || "Failed to save job");
        }
    };

    if (authLoading) {
        return (
            <div className="w-[350px] h-[300px] flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="w-[350px] bg-neutral-50 p-6 font-sans text-neutral-900">
                <header className="text-center mb-6">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
                        <Briefcase size={24} />
                    </div>
                    <h1 className="font-bold text-xl">Navigator</h1>
                    <p className="text-xs text-neutral-500 mt-1">Sign in to your account</p>
                </header>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                            placeholder="••••••••"
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>

                    {errorMessage && (
                        <div className="flex items-start gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-xs">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            {errorMessage}
                        </div>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={!email || !password}
                        className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <LogIn size={16} />
                        <span>Sign In</span>
                    </button>

                    <p className="text-[10px] text-center text-neutral-400">
                        Don't have an account? <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="underline hover:text-neutral-600">Join Navigator</a>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[350px] bg-neutral-50 p-4 font-sans text-neutral-900">
            <header className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-200">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                    <Briefcase size={16} />
                </div>
                <h1 className="font-bold text-lg">Navigator</h1>

                {status === 'saved' && (
                    <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                        <Check size={12} /> Saved
                    </span>
                )}
            </header>

            <div className="bg-white rounded-xl p-3 shadow-sm border border-neutral-200 mb-4 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <LinkIcon size={16} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate pr-2">{pageTitle}</h3>
                        <p className="text-xs text-neutral-500 truncate">{currentUrl}</p>
                    </div>
                </div>

                {status === 'scraping' && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Analyzing page content...
                    </div>
                )}

                {status === 'ready' && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                            <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-medium text-sm">Content Extracted</h3>
                            <p className="text-xs text-neutral-500 truncate">
                                {pageContent.length.toLocaleString()} characters found
                            </p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-start gap-3 bg-rose-50 p-2 rounded-lg border border-rose-100">
                        <div className="text-rose-600 shrink-0 mt-0.5">
                            <AlertCircle size={14} />
                        </div>
                        <p className="text-xs text-rose-700">{errorMessage}</p>
                    </div>
                )}
            </div>

            <button
                onClick={handleSave}
                disabled={status !== 'ready'}
                className="w-full py-2.5 bg-black text-white rounded-xl font-medium text-sm hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'saving' ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving...</span>
                    </>
                ) : status === 'saved' ? (
                    <>
                        <Check size={16} />
                        <span>Saved to History</span>
                    </>
                ) : (
                    <>
                        <Save size={16} />
                        <span>Save to Navigator</span>
                    </>
                )}
            </button>
        </div>
    );
};
