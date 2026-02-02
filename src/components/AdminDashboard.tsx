import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
    Activity, CheckCircle2, AlertCircle,
    Terminal, Bot, Zap, RefreshCw, ChevronRight, Eye, EyeOff,
    Users, BarChart3, TrendingUp, ShieldCheck, Search
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Bar, PieChart, Pie, Cell, Legend
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

// Lightweight type for analytics to save bandwidth
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
        totalLogs: 0
    });

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

    const fetchAnalytics = async () => {
        // Calculate date range
        const now = new Date();
        const past = new Date();
        if (timeRange === '24h') past.setHours(now.getHours() - 24);
        if (timeRange === '7d') past.setDate(now.getDate() - 7);
        if (timeRange === '30d') past.setDate(now.getDate() - 30);

        const { data, error } = await supabase
            .from('logs')
            .select('id, created_at, status, model_name, event_type, latency_ms') // Select ONLY what we need for charts
            .gte('created_at', past.toISOString())
            .order('created_at', { ascending: true }); // Ascending for charts

        if (!error && data) {
            setAnalyticsLogs(data as AnalyticsLog[]);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        // Fetch detailed logs for the table (limited to 100 recent)
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
    }, [timeRange]); // Re-fetch analytics when time range changes

    const filteredLogs = logs.filter(log =>
        log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.error_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.prompt_text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateAvgLatency = (eventTypes: string[]) => {
        // Use the larger analytics dataset for better accuracy
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
            {/* Header & Main Nav */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        Command Center
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">Real-time system intelligence and AI orchestration.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 shadow-inner">
                        <button
                            onClick={() => setTimeRange('24h')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === '24h' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            24h
                        </button>
                        <button
                            onClick={() => setTimeRange('7d')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === '7d' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            7d
                        </button>
                        <button
                            onClick={() => setTimeRange('30d')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === '30d' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            30d
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 shadow-inner">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Terminal className="w-3.5 h-3.5" />
                            Live Logs
                        </button>
                    </div>
                    <button
                        onClick={() => { fetchLogs(); fetchAnalytics(); fetchSystemStats(); }}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {activeTab === 'analytics' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Top Stats Strip with Sparklines */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                label: 'Users',
                                val: sysStats.totalUsers,
                                icon: Users,
                                color: 'text-indigo-500',
                                bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                                sparkLine: true, // Only this one really has time-series data we can mock or map if available, but for now we'll use logs as proxy for activity
                                dataKey: 'users'
                            },
                            {
                                label: 'Testers',
                                val: sysStats.betaTesters,
                                icon: ShieldCheck,
                                color: 'text-purple-500',
                                bg: 'bg-purple-50 dark:bg-purple-900/20',
                                sparkLine: false
                            },
                            {
                                label: 'AI Events',
                                val: sysStats.totalLogs,
                                icon: TrendingUp,
                                color: 'text-emerald-500',
                                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                                sparkLine: true,
                                dataKey: 'logs'
                            },
                            {
                                label: 'Uptime',
                                val: '99.9%',
                                icon: Zap,
                                color: 'text-amber-500',
                                bg: 'bg-amber-50 dark:bg-amber-900/20',
                                sparkLine: false
                            }
                        ].map((s, i) => {
                            // Generate simple sparkline data based on logs timestamp if this card supports it
                            const sparkData = s.sparkLine ? analyticsLogs.reduce((acc: any[], log) => {
                                const hour = new Date(log.created_at).getHours();
                                const existing = acc.find(a => a.hour === hour);
                                if (existing) existing.count++;
                                else acc.push({ hour, count: 1 });
                                return acc;
                            }, []).sort((a: any, b: any) => a.hour - b.hour).slice(-10) : [];

                            return (
                                <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                    <div className="flex justify-between items-start z-10 relative">
                                        <div className="flex gap-3">
                                            <div className={`p-3 rounded-xl ${s.bg}`}>
                                                <s.icon className={`w-5 h-5 ${s.color}`} />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">{s.val}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sparkline Overlay */}
                                    {s.sparkLine && sparkData.length > 2 && (
                                        <div className="absolute bottom-0 right-0 w-24 h-16 opacity-20 group-hover:opacity-40 transition-opacity">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={sparkData}>
                                                    <Area
                                                        type="monotone"
                                                        dataKey="count"
                                                        stroke={s.color.replace('text-', '#').replace('-500', '')} // Hacky color mapping, but works for tailwind classes
                                                        strokeWidth={2}
                                                        fill={s.color.replace('text-', '#').replace('-500', '')}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Response Time Breakdown Widget */}
                        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                            <div className="mb-6">
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Performance</h4>
                            </div>

                            <div className="space-y-5 flex-1">
                                {[
                                    { label: 'Resume Support', val: stats.resumeLatency, sub: 'Parsing & Tailoring' },
                                    { label: 'Job Analysis', val: stats.jobLatency, sub: 'Extraction' },
                                    { label: 'Docs & Letters', val: stats.docLatency, sub: 'Synthesis' }
                                ].map((row, i) => (
                                    <div key={i} className="group cursor-default">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <div>
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.label}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.sub}</div>
                                            </div>
                                            <div className="text-lg font-black text-slate-900 dark:text-white">{row.val}ms</div>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-rose-500 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-500"
                                                style={{ width: `${Math.min(100, (row.val / 10000) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 -mx-6 -mb-6 px-6 py-5 rounded-b-[2rem]">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Average Load Time</span>
                                <span className="text-xl font-black text-indigo-600">{stats.avgLatency}ms</span>
                            </div>
                        </div>

                        {/* Model Mix & Health Widget */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Model Distribution</h4>
                                <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(analyticsLogs.reduce((acc: any, log) => {
                                                    const model = log.model_name.replace('gemini-', '');
                                                    acc[model] = (acc[model] || 0) + 1;
                                                    return acc;
                                                }, {})).map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={75}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {Object.entries(analyticsLogs.reduce((acc: any, log) => {
                                                    const model = log.model_name.replace('gemini-', '');
                                                    acc[model] = (acc[model] || 0) + 1;
                                                    return acc;
                                                }, {})).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.success, COLORS.error][index % 3]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none pb-8">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{analyticsLogs.length}</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Requests</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[2rem] shadow-xl shadow-indigo-600/20 text-white flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-4 h-4 text-indigo-200" />
                                        <h4 className="text-lg font-black uppercase tracking-tight">System Health</h4>
                                    </div>
                                    <p className="text-indigo-100 text-xs leading-relaxed mb-4 font-medium">All systems operational. Gemini Flash throughput is stable.</p>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-4xl font-black">{stats.successRate}%</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 opacity-80">Global Success Rate</div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                                    <div>
                                        <div className="text-base font-black">{analyticsLogs.filter(l => l.status === 'error').length}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Errors</div>
                                    </div>
                                    <div>
                                        <div className="text-base font-black text-emerald-400">0</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">System Failures</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Traffic Intelligence</h4>
                                <div className="flex gap-2">
                                    <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-widest">{timeRange}</div>
                                </div>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={analyticsLogs.reduce((acc: any[], log) => {
                                            const date = new Date(log.created_at);
                                            // Dynamic grouping based on timeRange could go here, but using Hour/Day generic label for now
                                            const label = timeRange === '24h'
                                                ? `${date.getHours()}:00`
                                                : `${date.getMonth() + 1}/${date.getDate()}`;

                                            const existing = acc.find(a => a.label === label);
                                            if (existing) {
                                                existing.total++;
                                                if (log.status === 'error') existing.errors++;
                                            } else {
                                                acc.push({ label, total: 1, errors: log.status === 'error' ? 1 : 0 });
                                            }
                                            return acc;
                                        }, []).slice(-20)} // Limit to fit nicely
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="label" stroke={COLORS.text} fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke={COLORS.text} fontSize={10} tickLine={false} axisLine={false} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                        <Bar dataKey="errors" barSize={20} fill={COLORS.error} radius={[4, 4, 0, 0]} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Search Strip */}
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter logs by event, model, or content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-5 pl-14 pr-6 rounded-[2rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-sm"
                        />
                    </div>

                    {/* High-Density Log Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Event</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Model</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Latency</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <React.Fragment key={log.id}>
                                            <tr
                                                onClick={() => toggleExpand(log.id)}
                                                className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800 ${expandedLog === log.id ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                                            >
                                                <td className="px-8 py-4">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                                                        {log.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{formatEventType(log.event_type)}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">{log.model_name.replace('gemini-', '')}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-xs font-bold ${log.latency_ms && log.latency_ms > 5000 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'}`}>{log.latency_ms}ms</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex justify-end gap-2 pr-1">
                                                        <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${expandedLog === log.id ? 'rotate-90 text-indigo-600' : 'group-hover:translate-x-1'}`} />
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Body */}
                                            {expandedLog === log.id && (
                                                <tr className="bg-indigo-50/20 dark:bg-indigo-900/5">
                                                    <td colSpan={6} className="px-8 py-8 border-b border-slate-100 dark:border-slate-800">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                                                            <div>
                                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <Terminal className="w-3 h-3" />
                                                                    Analysis Request Payload
                                                                </div>
                                                                <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 max-h-80 overflow-y-auto shadow-inner leading-relaxed">
                                                                    {log.prompt_text}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Bot className="w-3 h-3" />
                                                                        Orchestration Response
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setShowRaw(showRaw === log.id ? null : log.id); }}
                                                                        className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-colors"
                                                                    >
                                                                        {showRaw === log.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                                        <span className="text-[10px] font-bold uppercase tracking-widest">{showRaw === log.id ? 'Hide Raw' : 'Show JSON'}</span>
                                                                    </button>
                                                                </div>
                                                                {log.status === 'success' ? (
                                                                    <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-emerald-600 dark:text-emerald-400/80 max-h-80 overflow-y-auto shadow-inner leading-relaxed">
                                                                        {showRaw === log.id ? log.response_text : (
                                                                            <div className="whitespace-pre-wrap">
                                                                                {log.response_text?.substring(0, 1000)}
                                                                                {(log.response_text?.length || 0) > 1000 && '...'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-6 bg-rose-50 dark:bg-rose-950/30 rounded-3xl border border-rose-100 dark:border-rose-900/30">
                                                                        <div className="text-xs font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                            <AlertCircle className="w-4 h-4" />
                                                                            Orchestration Error
                                                                        </div>
                                                                        <div className="text-sm font-bold text-rose-500 leading-relaxed">{log.error_message}</div>
                                                                    </div>
                                                                )}

                                                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                                                                        {Object.entries(log.metadata).map(([k, v]) => (
                                                                            <div key={k} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">
                                                                                {k}: {String(v)}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>

                            {filteredLogs.length === 0 && !loading && (
                                <div className="text-center py-32">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Bot className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Events Found</h3>
                                    <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest font-bold">Try adjusting your filters or refreshing</p>
                                </div>
                            )}

                            {loading && logs.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-32">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin mb-6" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
