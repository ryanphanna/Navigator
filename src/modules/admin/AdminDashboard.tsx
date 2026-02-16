import React, { useEffect, useState, useMemo } from 'react';
import { getUsageOutliers, type UsageOutlier } from '../../services/adminService';
import { Loader2, AlertTriangle, ShieldAlert, Activity, RefreshCw, TrendingUp, Users } from 'lucide-react';

const StatsCard = ({ title, value, subtext, icon: Icon, color }: { title: string, value: string, subtext?: string, icon: any, color: string }) => (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white">{value}</h3>
            {subtext && <p className="text-xs text-neutral-500 mt-2">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
    </div>
);

export const AdminDashboard: React.FC = () => {
    const [outliers, setOutliers] = useState<UsageOutlier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cohortFilter, setCohortFilter] = useState<'all' | 'free' | 'pro'>('all');

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUsageOutliers();
            setOutliers(data);
        } catch (err) {
            setError('Failed to load usage data. Ensure you have admin permissions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- Dynamic Analytics Logic ---
    const stats = useMemo(() => {
        const calculateMedian = (values: number[]) => {
            if (values.length === 0) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        };

        const processCohort = (users: UsageOutlier[]) => {
            if (users.length === 0) return { count: 0, meanOutput: 0, medianOutput: 0 };
            const outputs = users.map(u => u.total_output_tokens);
            const total = outputs.reduce((a, b) => a + b, 0);
            return {
                count: users.length,
                meanOutput: Math.round(total / users.length),
                medianOutput: calculateMedian(outputs)
            };
        };

        // Inference: Pro users typically have > 50 operations (arbitrary heuristic for now, or based on strict usage tiers if joined)
        const proUsers = outliers.filter(u => u.total_operations > 50);
        const freeUsers = outliers.filter(u => u.total_operations <= 50);

        return {
            all: processCohort(outliers),
            pro: processCohort(proUsers),
            free: processCohort(freeUsers)
        };
    }, [outliers]);

    const activeStats = stats[cohortFilter];

    // Filter the displayed list
    const displayedUsers = outliers; // Show all for now since the view already filters for outliers


    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8 text-indigo-600" />
                            Admin Console
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                            Dynamic usage analysis based on network behavior.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex bg-white dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            {(['all', 'free', 'pro'] as const).map(tier => (
                                <button
                                    key={tier}
                                    onClick={() => setCohortFilter(tier)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${cohortFilter === tier
                                        ? 'bg-neutral-900 text-white shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                        }`}
                                >
                                    {tier}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        title="Cohort Size"
                        value={activeStats.count.toString()}
                        subtext={`${cohortFilter} users tracked`}
                        icon={Users}
                        color="bg-blue-500"
                    />
                    <StatsCard
                        title="Avg Output Tokens"
                        value={activeStats.meanOutput.toLocaleString()}
                        subtext="Baseline for 'Normal'"
                        icon={Activity}
                        color="bg-indigo-500"
                    />
                    <StatsCard
                        title="Median Output"
                        value={activeStats.medianOutput.toLocaleString()}
                        subtext="Typical user consumption"
                        icon={TrendingUp}
                        color="bg-emerald-500"
                    />
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Main Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-neutral-400 text-sm">Crunching numbers...</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800">
                                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">User ID</th>
                                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Calls</th>
                                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Input Tokens</th>
                                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Output Tokens</th>
                                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Deviation</th>
                                        <th className="p-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                    {displayedUsers.map((row) => {
                                        // Dynamic Outlier Logic based on CURRENT COHORT stats
                                        const mean = activeStats.meanOutput;
                                        const multiplier = mean > 0 ? (row.total_output_tokens / mean) : 0;

                                        // Flag levels
                                        const isExtreme = multiplier > 3.0; // 3x Average
                                        const isHigh = multiplier > 1.5;    // 1.5x Average

                                        return (
                                            <tr
                                                key={row.user_id}
                                                className={`transition-colors border-l-4 ${isExtreme ? 'bg-red-50/50 border-red-500' :
                                                    isHigh ? 'bg-amber-50/30 border-amber-400' :
                                                        'hover:bg-neutral-50 border-transparent'
                                                    }`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isExtreme ? 'bg-red-100 text-red-700' :
                                                            isHigh ? 'bg-amber-100 text-amber-700' :
                                                                'bg-neutral-100 text-neutral-500'
                                                            }`}>
                                                            {row.user_id.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="font-mono text-xs text-neutral-500 truncate max-w-[120px]" title={row.user_id}>
                                                            {row.user_id}
                                                        </span>
                                                        {isExtreme && (
                                                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
                                                                Extreme
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-medium text-neutral-700 dark:text-neutral-300">
                                                    {row.total_operations.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right text-neutral-500">
                                                    {row.total_input_tokens.toLocaleString()}
                                                </td>
                                                <td className={`p-4 text-right font-bold ${isExtreme ? 'text-red-700' : isHigh ? 'text-amber-700' : 'text-neutral-700'}`}>
                                                    {row.total_output_tokens.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className={`text-xs font-bold ${isHigh ? 'text-amber-600' : 'text-neutral-400'
                                                        }`}>
                                                        {multiplier.toFixed(1)}x avg
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-neutral-500 flex items-center gap-2">
                                                    <Activity className="w-3 h-3 text-neutral-300" />
                                                    {new Date(row.last_active).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {displayedUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-neutral-400">
                                                No users found in this cohort.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
