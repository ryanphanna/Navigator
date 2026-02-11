import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
    Activity, CheckCircle2, AlertCircle,
    Terminal, Zap, RefreshCw, ChevronRight,
    Users, BarChart3, TrendingUp, ShieldCheck, Search
} from 'lucide-react';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    ComposedChart, Bar, Area
} from 'recharts';

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

interface AnalyticsLog {
    id: string;
    created_at: string;
    status: 'success' | 'error';
    model_name: string;
    event_type: string;
    latency_ms: number;
}

export const AdminDashboard: React.FC = () => {
    // Data State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [analyticsLogs, setAnalyticsLogs] = useState<AnalyticsLog[]>([]);
    const [sysStats, setSysStats] = useState({
        totalUsers: 0,
        betaTesters: 0,
        admins: 0,
        totalLogs: 0,
        totalAICalls: 0,
        dailyAvg: 0
    });
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [dailyHighUsage, setDailyHighUsage] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [showRaw, setShowRaw] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'logs' | 'analytics'>('analytics');
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

    // Chart Colors
    const COLORS = {
        primary: '#4f46e5',
        success: '#10b981',
        error: '#f43f5e',
        grid: '#e2e8f0',
        text: '#94a3b8'
    };

    const fetchSystemStats = async () => {
        const today = new Date().toISOString().split('T')[0];

        const [users, testers, admins, logsCount, profilesData, leadData, dailyData, allDaily] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_tester', true),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
            supabase.from('logs').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('total_ai_calls'),
            supabase.from('profiles').select('email, total_ai_calls').order('total_ai_calls', { ascending: false }).limit(5),
            supabase.from('daily_usage')
                .select('request_count, email:profiles(email)')
                .eq('date', today)
                .order('request_count', { ascending: false })
                .limit(5),
            supabase.from('daily_usage').select('request_count').eq('date', today)
        ]);

        const totalAICalls = profilesData.data?.reduce((acc: any, p: any) => acc + (p.total_ai_calls || 0), 0) || 0;

        let averageUsage = 0;
        if (allDaily.data && allDaily.data.length > 0) {
            averageUsage = allDaily.data.reduce((acc, curr) => acc + (curr.request_count || 0), 0) / allDaily.data.length;
        }

        setSysStats({
            totalUsers: users.count || 0,
            betaTesters: testers.count || 0,
            admins: admins.count || 0,
            totalLogs: logsCount.count || 0,
            totalAICalls,
            dailyAvg: Math.round(averageUsage * 10) / 10
        });
        setTopUsers(leadData.data || []);
        setDailyHighUsage(dailyData.data || []);
    };

    const fetchAnalytics = async () => {
        const now = new Date();
        const past = new Date();
        if (timeRange === '24h') past.setHours(now.getHours() - 24);
        if (timeRange === '7d') past.setDate(now.getDate() - 7);
        if (timeRange === '30d') past.setDate(now.getDate() - 30);

        const { data, error } = await supabase
            .from('logs')
            .select('id, created_at, status, model_name, event_type, latency_ms')
            .gte('created_at', past.toISOString())
            .order('created_at', { ascending: true });

        if (!error && data) {
            setAnalyticsLogs(data as AnalyticsLog[]);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (!error && data) {
            setLogs(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
        fetchSystemStats();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const filteredLogs = logs.filter(log =>
        log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.error_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.prompt_text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateAvgLatency = (eventTypes: string[]) => {
        const filtered = analyticsLogs.filter(l => eventTypes.includes(l.event_type));
        if (filtered.length === 0) return 0;
        return Math.round(filtered.reduce((acc, l) => acc + (l.latency_ms || 0), 0) / filtered.length);
    };

    const stats = {
        avgLatency: analyticsLogs.length > 0 ? Math.round(analyticsLogs.reduce((acc, l) => acc + (l.latency_ms || 0), 0) / analyticsLogs.length) : 0,
        resumeLatency: calculateAvgLatency(['parsing', 'tailoring_block']),
        jobLatency: calculateAvgLatency(['listing_parse', 'analysis']),
        docLatency: calculateAvgLatency(['cover_letter', 'tailored_summary', 'critique']),
        successRate: analyticsLogs.length > 0 ? Math.round((analyticsLogs.filter(l => l.status === 'success').length / analyticsLogs.length) * 100) : 0,
        total: analyticsLogs.length
    };

    const toggleExpand = (id: string) => {
        setExpandedLog(expandedLog === id ? null : id);
    };

    const formatEventType = (type: string) => {
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        Command Center
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium ml-1">Real-time system intelligence and AI orchestration.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl flex gap-1 shadow-inner">
                        {['24h', '7d', '30d'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === range ? 'bg-white dark:bg-neutral-700 text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 mx-1"></div>

                    <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl flex gap-1 shadow-inner">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white dark:bg-neutral-700 text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-white dark:bg-neutral-700 text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        >
                            <Terminal className="w-3.5 h-3.5" />
                            Live Logs
                        </button>
                    </div>
                    <button
                        onClick={() => { fetchLogs(); fetchAnalytics(); fetchSystemStats(); }}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {activeTab === 'analytics' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Users', val: sysStats.totalUsers, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                            { label: 'Testers', val: sysStats.betaTesters, icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                            { label: `${timeRange === '24h' ? '24h' : timeRange} AI Calls`, val: analyticsLogs.length, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                            { label: 'Lifetime AI Calls', val: sysStats.totalAICalls, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
                        ].map((s, i) => (
                            <div key={i} className="bg-white dark:bg-neutral-900 p-5 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
                                <div className="flex gap-3 relative z-10">
                                    <div className={`p-3 rounded-xl ${s.bg}`}>
                                        <s.icon className={`w-5 h-5 ${s.color}`} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{s.val}</div>
                                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">{s.label}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <h4 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight mb-6">Performance</h4>
                            <div className="space-y-5">
                                {[
                                    { label: 'Resume Support', val: stats.resumeLatency, sub: 'Parsing & Tailoring' },
                                    { label: 'Job Analysis', val: stats.jobLatency, sub: 'Extraction' },
                                    { label: 'Docs & Letters', val: stats.docLatency, sub: 'Synthesis' }
                                ].map((row, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-end mb-1.5">
                                            <div>
                                                <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{row.label}</div>
                                                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{row.sub}</div>
                                            </div>
                                            <div className="text-lg font-black text-neutral-900 dark:text-white">{row.val}ms</div>
                                        </div>
                                        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-rose-500 rounded-full opacity-60"
                                                style={{ width: `${Math.min(100, (row.val / 10000) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <h4 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight mb-6">Top AI Users</h4>
                                <div className="space-y-4">
                                    {topUsers.map((u, i) => (
                                        <div key={i} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl">
                                            <div className="flex items-center gap-3 truncate">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">{i + 1}</div>
                                                <span className="truncate text-xs font-bold text-neutral-700 dark:text-neutral-200">{u.email || 'Anonymous'}</span>
                                            </div>
                                            <span className="text-sm font-black text-indigo-600 ml-2">{u.total_ai_calls || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight">Daily Alerts</h4>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        <AlertCircle className="w-3 h-3" /> Abuse Spotter
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {dailyHighUsage.map((u, i) => {
                                        const email = (u.email as any)?.email || 'Anonymous';
                                        const count = u.request_count || 0;
                                        // Threshold: 5x average or at least 10 for small samples
                                        const threshold = Math.max(10, sysStats.dailyAvg * 5);
                                        const isHigh = count >= threshold;

                                        return (
                                            <div key={i} className={`flex justify-between items-center p-3 rounded-2xl border ${isHigh ? 'bg-rose-50/50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800'}`}>
                                                <div className="flex items-center gap-3 truncate">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isHigh ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>{i + 1}</div>
                                                    <span className="truncate text-xs font-bold text-neutral-700 dark:text-neutral-200">{email}</span>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0 ml-2">
                                                    <span className={`text-sm font-black ${isHigh ? 'text-rose-600' : 'text-neutral-600'}`}>{count}</span>
                                                    {isHigh && sysStats.dailyAvg > 0 && (
                                                        <span className="text-[8px] font-black uppercase text-rose-500">{(count / sysStats.dailyAvg).toFixed(1)}x avg</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {dailyHighUsage.length === 0 && <div className="text-center py-10 text-xs text-neutral-400 font-bold uppercase tracking-widest">No activity today</div>}
                                </div>
                                {sysStats.dailyAvg > 0 && (
                                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">System Avg</span>
                                        <span className="text-sm font-black text-neutral-900 dark:text-white">{sysStats.dailyAvg} req/user</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-3 bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={analyticsLogs.reduce((acc: any[], log) => {
                                    const date = new Date(log.created_at);
                                    const label = timeRange === '24h' ? `${date.getHours()}:00` : `${date.getMonth() + 1}/${date.getDate()}`;
                                    const existing = acc.find(a => a.label === label);
                                    if (existing) { existing.total++; if (log.status === 'error') existing.errors++; }
                                    else { acc.push({ label, total: 1, errors: log.status === 'error' ? 1 : 0 }); }
                                    return acc;
                                }, []).slice(-20)}>
                                    <XAxis dataKey="label" stroke={COLORS.text} fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke={COLORS.text} fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="total" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.1} strokeWidth={3} />
                                    <Bar dataKey="errors" fill={COLORS.error} radius={[4, 4, 0, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Filter logs by event..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 py-5 pl-14 pr-6 rounded-[2rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                        />
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-6 py-5">Event</th>
                                    <th className="px-6 py-5">Model</th>
                                    <th className="px-6 py-5">Latency</th>
                                    <th className="px-8 py-5 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <React.Fragment key={log.id}>
                                        <tr onClick={() => toggleExpand(log.id)} className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer border-b border-neutral-50 dark:border-neutral-800 ${expandedLog === log.id ? 'bg-indigo-50/30' : ''}`}>
                                            <td className="px-8 py-4">{log.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}</td>
                                            <td className="px-6 py-4 text-xs font-black uppercase tracking-tight text-neutral-900 dark:text-white">{formatEventType(log.event_type)}</td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase">{log.model_name.replace('gemini-', '')}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-neutral-600">{log.latency_ms}ms</td>
                                            <td className="px-8 py-4 text-right"><ChevronRight className={`w-4 h-4 transition-transform ${expandedLog === log.id ? 'rotate-90' : ''}`} /></td>
                                        </tr>
                                        {expandedLog === log.id && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-8 bg-neutral-50/30 dark:bg-indigo-900/5">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Prompt</div>
                                                            <div className="p-4 bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">{log.prompt_text}</div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex justify-between">
                                                                <span>Response</span>
                                                                <button onClick={(e) => { e.stopPropagation(); setShowRaw(showRaw === log.id ? null : log.id); }} className="text-indigo-600">RAW</button>
                                                            </div>
                                                            <div className="p-4 bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">{showRaw === log.id ? log.response_text : log.response_text?.substring(0, 500)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                        {loading && <div className="py-20 text-center text-xs font-bold text-neutral-400 uppercase animate-pulse">Synchronizing Intelligence...</div>}
                    </div>
                </div>
            )}
        </div>
    );
};
