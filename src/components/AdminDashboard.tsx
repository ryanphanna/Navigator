import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
    Activity, Clock, CheckCircle2, AlertCircle,
    Terminal, Bot, Zap, RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff,
    Users, BarChart3, TrendingUp, ShieldCheck
} from 'lucide-react';

interface LogEntry {
    id: string;
    event_type: string;
    model_name: string;
    prompt_text: string;
    response_text?: string;
    latency_ms?: number;
    status: 'success' | 'error';
    error_message?: string;
    metadata?: any;
    created_at: string;
    user_id?: string;
}

export const AdminDashboard: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm] = useState('');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [showRaw, setShowRaw] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'logs' | 'analytics'>('logs');
    const [sysStats, setSysStats] = useState({
        totalUsers: 0,
        betaTesters: 0,
        admins: 0,
        totalLogs: 0
    });

    const fetchSystemStats = async () => {
        const [users, testers, admins, logsCount] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_tester', true),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
            supabase.from('logs').select('*', { count: 'exact', head: true })
        ]);

        setSysStats({
            totalUsers: users.count || 0,
            betaTesters: testers.count || 0,
            admins: admins.count || 0,
            totalLogs: logsCount.count || 0
        });
    };

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            setLogs(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
        fetchSystemStats();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.error_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.prompt_text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateAvgLatency = (eventTypes: string[]) => {
        const filtered = logs.filter(l => eventTypes.includes(l.event_type));
        if (filtered.length === 0) return 0;
        return Math.round(filtered.reduce((acc, l) => acc + (l.latency_ms || 0), 0) / filtered.length);
    };

    const stats = {
        avgLatency: logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + (l.latency_ms || 0), 0) / logs.length) : 0,
        resumeLatency: calculateAvgLatency(['parsing', 'tailoring_block']),
        jobLatency: calculateAvgLatency(['listing_parse', 'analysis']),
        docLatency: calculateAvgLatency(['cover_letter', 'tailored_summary', 'critique']),
        successRate: logs.length > 0 ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) : 0,
        total: logs.length
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-600" />
                        Admin Console
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor system performance and AI interactions.</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 mr-2">
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Terminal className="w-4 h-4" />
                        AI Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                    </button>
                </div>
                <button
                    onClick={() => { fetchLogs(); fetchSystemStats(); }}
                    disabled={loading}
                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {
                activeTab === 'analytics' ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                                    <Users className="w-4 h-4 text-indigo-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{sysStats.totalUsers}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Beta Testers</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{sysStats.betaTesters}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider">AI Generations</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{sysStats.totalLogs}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-4">
                                    <Activity className="w-4 h-4 text-rose-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Avg. Response Times (ms)</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Resumes</span>
                                        <span className="text-slate-900 dark:text-white font-black">{stats.resumeLatency}ms</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Jobs</span>
                                        <span className="text-slate-900 dark:text-white font-black">{stats.jobLatency}ms</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Documents</span>
                                        <span className="text-slate-900 dark:text-white font-black">{stats.docLatency}ms</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-indigo-600">
                                        <span>Overall</span>
                                        <span>{stats.avgLatency}ms</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Usage Distribution */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Execution Mix</h4>
                                <div className="space-y-4">
                                    {['analysis', 'parsing', 'cover_letter'].map(type => {
                                        const count = logs.filter(l => l.event_type === type).length;
                                        const percent = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;
                                        return (
                                            <div key={type} className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                                    <span className="text-slate-500">{type}</span>
                                                    <span className="text-slate-900 dark:text-white">{percent}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recent Health */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">System Health</h4>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.successRate}%</div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Success Rate</div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed italic">
                                    "{sysStats.totalLogs} total events tracked. System operating within normal performance parameters ({stats.avgLatency}ms)."
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards (Simplified for Logs view) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Avg. Response Time (ms)</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">
                                    {stats.avgLatency}<span className="text-sm font-medium ml-1 text-slate-400">ms</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Success Rate</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">
                                    {stats.successRate}<span className="text-sm font-medium ml-1 text-slate-400">%</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                                    <Activity className="w-4 h-4 text-rose-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Total Generations</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{sysStats.totalLogs}</div>
                            </div>
                        </div>

                        {/* Recent Activity Grid */}
                        <div className="grid grid-cols-1 gap-6">
                            {filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                                                    {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.event_type}</span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">{log.model_name}</span>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(log.created_at).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-slate-900 dark:text-white">{log.latency_ms}ms</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="group/code relative">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                    Prompt
                                                    <button
                                                        onClick={() => expandedLog === log.id ? setExpandedLog(null) : setExpandedLog(log.id)}
                                                        className="text-indigo-600 hover:text-indigo-700 transition-colors"
                                                    >
                                                        {expandedLog === log.id ? 'Collapse' : 'Expand'}
                                                    </button>
                                                </div>
                                                <div className={`text-xs font-mono p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 overflow-hidden transition-all ${expandedLog === log.id ? 'max-h-96 overflow-y-auto' : 'max-h-20'}`}>
                                                    {log.prompt_text}
                                                </div>
                                            </div>

                                            {log.status === 'success' ? (
                                                <div className="group/code relative">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                                        <span>Response</span>
                                                        <button
                                                            onClick={() => showRaw === log.id ? setShowRaw(null) : setShowRaw(log.id)}
                                                            className="text-indigo-600 hover:text-indigo-700 transition-colors"
                                                        >
                                                            {showRaw === log.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                    <div className={`text-xs font-mono p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 overflow-hidden transition-all ${showRaw === log.id ? 'max-h-96 overflow-y-auto' : 'max-h-12'}`}>
                                                        {log.response_text || 'No response data available.'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                                                    <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Error Details</div>
                                                    <div className="text-xs font-bold text-rose-500">{log.error_message}</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.status}</span>
                                                </div>
                                                {log.metadata?.cached && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Zap className="w-3 h-3 text-amber-500" />
                                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Cached</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Verified Log</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredLogs.length === 0 && !loading && (
                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Bot className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No logs found</h3>
                                    <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold">Try a different search term</p>
                                </div>
                            )}

                            {loading && logs.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Fetching data...</span>
                                </div>
                            )}
                        </div>
                    </>
                )
            }
        </div >
    );
};
