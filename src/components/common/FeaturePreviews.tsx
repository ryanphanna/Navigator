/**
 * Feature Preview Components
 * Shared mini-illustrations used inside BentoCards across all pages.
 *
 * Each preview is a small visual that represents its feature.
 * Both the homepage and features page use the same previews.
 */
import React from 'react';
import {
    Sparkles, PenTool, RefreshCw, Zap, Shield, Bookmark,
    TrendingUp, Users, FileText, Mail, Globe,
    GraduationCap, Search, MessageSquare, Target, ShieldCheck, UserCircle
} from 'lucide-react';
import type { FeatureColor } from '../../featureRegistry';

// ─── Job Features ──────────────────────────────────────────────────────

const JobfitPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
        <div className={`absolute inset-0 ${color.glow} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />
        <div className="relative w-20 h-20 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-xl">
                <circle cx="40" cy="40" r="34" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-neutral-100 dark:text-neutral-800" />
                <circle cx="40" cy="40" r="34" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="213.63" strokeDashoffset="213.63" className={`${color.text} stroke-cap-round transition-all duration-1000 ease-out group-hover:stroke-dash-offset-[42.72]`} style={{ strokeDashoffset: '42.72' }} />
                <circle cx="40" cy="40" r="34" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="213.63" strokeDashoffset="42.72" className={`${color.text} stroke-cap-round animate-[dash_2s_ease-in-out_forwards] group-hover:animate-pulse`} />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-xl font-black ${color.text}`}>92%</span>
                <span className="text-[10px] font-bold text-neutral-400 -mt-1">Match</span>
            </div>
        </div>
        {/* Floating elements */}
        <div className="absolute top-2 -left-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-2 font-mono text-[7px] w-24 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-700 delay-100 flex flex-col gap-1">
            <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-bold">Fit Analysis</span>
                <Sparkles className={`w-2 h-2 ${color.text}`} />
            </div>
            <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className={`h-full ${color.iconBg} w-4/5`} />
            </div>
        </div>
        <div className="absolute bottom-4 -right-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-700 delay-200">
            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">Perfect Fit!</span>
        </div>
    </div>
);

const AiSafetyPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-10 group-hover:opacity-25 transition-opacity`} />
        <div className="relative flex flex-col items-center gap-2 group-hover:scale-105 transition-transform duration-500">
            <div className={`w-11 h-11 rounded-xl ${color.iconBg} flex items-center justify-center text-white shadow-lg relative`}>
                <div className={`absolute inset-0 ${color.iconBg} rounded-xl blur-md opacity-0 group-hover:opacity-60 group-hover:animate-pulse transition-opacity`} />
                <Shield className="w-5 h-5 relative z-10" />
            </div>
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[7px] font-black text-red-400">AI Banned</span>
            </div>
        </div>
    </div>
);

const ResumeTailoringPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-10`} />
        <div className="relative flex items-center gap-2">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-1.5 w-14 opacity-50">
                <div className="space-y-1">
                    {[1, 2].map(i => <div key={i} className="h-0.5 bg-neutral-200 dark:bg-neutral-600 rounded-full w-full" />)}
                    <div className="h-0.5 bg-red-300 dark:bg-red-500/40 rounded-full w-2/3 line-through" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
                <RefreshCw className={`w-3 h-3 ${color.text} animate-spin`} style={{ animationDuration: '3s' }} />
            </div>
            <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-lg border-2 ${color.accent} p-1.5 w-14 group-hover:scale-110 transition-transform duration-500`}>
                <div className="space-y-1">
                    {[1, 2].map(i => <div key={i} className="h-0.5 bg-neutral-200 dark:bg-neutral-600 rounded-full w-full" />)}
                    <div className={`h-0.5 ${color.iconBg} rounded-full w-full`} />
                </div>
                <div className={`mt-1 text-[5px] font-black ${color.text} text-center`}>TAILORED</div>
            </div>
        </div>
    </div>
);

const KeywordsPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative flex flex-wrap items-center justify-center gap-2 px-4 h-24 overflow-hidden">
        {['Python', 'React', 'Cloud Architect', 'Leadership', 'TypeScript', 'AWS'].map((skill, i) => (
            <div
                key={skill}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all duration-500 scale-90 group-hover:scale-100 ${i % 2 === 0
                    ? `${color.bg.replace('/50', '/80')} ${color.text} border-${color.text.split('-')[1]}-200/50`
                    : 'bg-white dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                    }`}
                style={{
                    transitionDelay: `${i * 50}ms`,
                    transform: `translateY(${Math.sin(i) * 5}px)`
                }}
            >
                {i % 2 === 0 ? '✓ ' : '+ '}{skill}
            </div>
        ))}
    </div>
);

const ResumesPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative flex items-center justify-center w-full h-24">
        <div className="absolute w-16 h-20 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 transform -rotate-12 -translate-x-8 opacity-40 scale-90 group-hover:-translate-x-10 transition-transform duration-700 animate-[float_4s_ease-in-out_infinite]" />
        <div className="absolute w-16 h-20 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 transform rotate-6 translate-x-6 opacity-40 scale-95 group-hover:translate-x-8 transition-transform duration-700 animate-[float_6s_ease-in-out_infinite_1s]" />
        <div className="relative w-20 h-24 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 group-hover:-translate-y-4 transition-transform duration-500 z-10 p-3 gap-2 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-3 h-3 rounded-full ${color.iconBg}/20 flex items-center justify-center`}><FileText className={`w-2 h-2 ${color.text}`} /></div>
                <div className={`w-full h-1.5 ${color.iconBg}/40 rounded-full`} />
            </div>
            <div className="space-y-1.5">
                <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full" />
                <div className="h-1 w-5/6 bg-neutral-100 dark:bg-neutral-700 rounded-full" />
                <div className="h-1 w-4/6 bg-neutral-100 dark:bg-neutral-700 rounded-full" />
            </div>
            <div className={`mt-auto w-full h-4 rounded-lg ${color.bg} border border-${color.text.split('-')[1]}-100 dark:border-${color.text.split('-')[1]}-900 flex items-center justify-center`}>
                <div className={`w-3 h-0.5 ${color.iconBg} rounded-full animate-pulse`} />
            </div>
        </div>
    </div>
);

const CoverLettersPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full px-8 h-24 flex items-center justify-center">
        <div className="relative w-32 h-20 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden p-2.5 group-hover:scale-110 transition-transform duration-700 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 mb-1">
                <PenTool className={`w-3 h-3 ${color.text}`} />
                <div className="h-2 w-16 bg-neutral-100 dark:bg-neutral-700 rounded-full" />
            </div>
            <div className="space-y-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 bg-neutral-50 dark:bg-neutral-700/50 rounded-full ${i === 3 ? 'w-2/3' : 'w-full'}`} />
                ))}
            </div>
            <div className="mt-2 space-y-1">
                {[1, 2].map(i => (
                    <div key={i} className={`h-1 bg-neutral-50 dark:bg-neutral-700/50 rounded-full ${i === 2 ? 'w-1/2' : 'w-full'}`} />
                ))}
            </div>
            <div className={`absolute bottom-0 right-0 w-12 h-12 ${color.bg} blur-xl opacity-40`} />
        </div>
    </div>
);

const QualityLoopPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center gap-2">
        {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-1 transition-all duration-500" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className={`w-8 h-8 rounded-lg ${i === 3 ? color.iconBg : 'bg-neutral-100 dark:bg-neutral-800'} flex items-center justify-center ${i === 3 ? 'text-white scale-110' : 'text-neutral-400'} group-hover:scale-110 transition-transform`}>
                    <RefreshCw className="w-4 h-4" />
                </div>
                <span className={`text-[7px] font-black ${i === 3 ? color.text : 'text-neutral-400'}`}>Pass {i}</span>
            </div>
        ))}
    </div>
);

const HistoryPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative flex flex-col gap-2.5 w-full px-8 h-24 justify-center">
        {[
            { score: 98, name: 'Senior Dev', icon: '⚡️' },
            { score: 87, name: 'Product Lead', icon: '🎨' },
            { score: 92, name: 'Cloud Eng', icon: '☁️' }
        ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-700 ${i > 0 ? 'opacity-30 group-hover:opacity-60' : ''}`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="text-[10px] w-4">{item.icon}</div>
                <div className="flex-grow flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[7px] font-black text-neutral-400">
                        <span>{item.name}</span>
                        <span className={color.text}>{item.score}%</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${color.iconBg} rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                            style={{ width: `${item.score}%`, transition: 'width 1.5s cubic-bezier(0.23, 1, 0.32, 1)', transitionDelay: `${i * 200}ms` }}
                        />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const FeedPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex flex-col justify-center gap-2 group-hover:scale-105 transition-transform duration-500">
        {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-700 shadow-sm opacity-60 group-hover:opacity-100 transition-opacity">
                <div className={`w-8 h-8 rounded-lg ${color.iconBg} flex items-center justify-center shrink-0`}>
                    <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="h-2 w-2/3 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                    <div className="h-1.5 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                </div>
                <div className={`px-1.5 py-0.5 rounded-md ${color.bg} ${color.text} text-[8px] font-bold`}>
                    92%
                </div>
            </div>
        ))}
    </div>
);

const MailInPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-30`} />
        <div className="relative bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-10 flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-xl ${color.iconBg} flex items-center justify-center text-white shadow-lg`}>
                <Mail className="w-6 h-6" />
            </div>
            <div className="flex gap-1">
                <span className={`w-1 h-1 rounded-full ${color.iconBg} animate-bounce`} />
                <span className={`w-1 h-1 rounded-full ${color.iconBg} animate-bounce delay-75`} />
                <span className={`w-1 h-1 rounded-full ${color.iconBg} animate-bounce delay-150`} />
            </div>
        </div>
    </div>
);

// ─── Coach Features ────────────────────────────────────────────────────

const CoachPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="w-full px-8 h-24 flex flex-col justify-center gap-4">
        <div className="relative h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
                className={`absolute inset-0 h-full ${color.iconBg} w-2/3 animate-[shimmer_2s_infinite]`}
                style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
            />
        </div>
        <div className="flex justify-between items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${color.iconBg}/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all`}>
                <TrendingUp className={`w-4 h-4 ${color.text}`} />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color.iconBg} w-4/5 rounded-full`} />
                </div>
                <div className="h-1.5 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color.iconBg} w-2/5 rounded-full opacity-60`} />
                </div>
            </div>
        </div>
    </div>
);

const RoleModelsPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-10`} />
        <div className="relative flex items-end gap-3 group-hover:scale-105 transition-transform duration-500">
            <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <Users className="w-4 h-4 text-neutral-400" />
                </div>
                <span className="text-[6px] font-bold text-neutral-400">You</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 mb-3">
                <div className={`h-0.5 w-8 ${color.iconBg} rounded-full opacity-50`} />
                <TrendingUp className={`w-3 h-3 ${color.text}`} />
                <div className={`h-0.5 w-8 ${color.iconBg} rounded-full opacity-50`} />
            </div>
            <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full ${color.iconBg}/20 flex items-center justify-center border-2 ${color.accent}`}>
                    <Users className={`w-4 h-4 ${color.text}`} />
                </div>
                <span className={`text-[6px] font-bold ${color.text}`}>Mentor</span>
            </div>
        </div>
    </div>
);

const SkillsInterviewPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-10`} />
        <div className="relative flex items-center gap-2">
            {['Q1', 'Q2', 'Q3'].map((q, i) => (
                <div key={q} className="flex flex-col items-center gap-1 transition-all duration-500 group-hover:scale-110" style={{ transitionDelay: `${i * 80}ms` }}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[8px] font-black ${i < 2 ? `${color.iconBg} text-white` : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                        {i < 2 ? '✓' : '?'}
                    </div>
                    <span className={`text-[6px] font-bold ${i < 2 ? color.text : 'text-neutral-400'}`}>{q}</span>
                </div>
            ))}
        </div>
    </div>
);

const InterviewAdvisorPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-10`} />
        <div className="relative flex flex-col gap-1.5 w-28">
            {[{ align: 'items-end', w: 'w-20' }, { align: 'items-start', w: 'w-16' }, { align: 'items-end', w: 'w-18' }].map((msg, i) => (
                <div key={i} className={`flex ${msg.align} transition-all duration-500`} style={{ transitionDelay: `${i * 100}ms` }}>
                    <div className={`${msg.w} h-3 rounded-full ${i % 2 === 0 ? `${color.iconBg} opacity-80` : 'bg-neutral-200 dark:bg-neutral-700'} group-hover:scale-105 transition-transform`} />
                </div>
            ))}
            <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-4 h-4 rounded-full ${color.iconBg} flex items-center justify-center`}>
                    <MessageSquare className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="flex gap-0.5">
                    {[0, 1, 2].map(i => <span key={i} className={`w-0.5 h-0.5 rounded-full ${color.iconBg} animate-bounce`} style={{ animationDelay: `${i * 100}ms` }} />)}
                </div>
            </div>
        </div>
    </div>
);

// ─── Education Features ────────────────────────────────────────────────

const EduPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full px-8 h-24 flex items-center justify-center">
        <div className="relative group-hover:scale-110 transition-transform duration-700">
            <div className={`absolute -inset-4 ${color.glow} blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse`} />
            <div className={`w-14 h-14 rounded-2xl ${color.iconBg} flex items-center justify-center shadow-2xl shadow-amber-500/20 z-10 relative`}>
                <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-white dark:bg-neutral-800 rounded-full p-1.5 shadow-lg border border-neutral-100 dark:border-neutral-700 z-20 scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
                <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="w-8 h-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <div className="w-8 h-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
        </div>
    </div>
);

const EduTranscriptPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-10`} />
        <div className="relative bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-2.5 w-28 group-hover:-translate-y-1 transition-transform duration-500">
            <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap className={`w-3 h-3 ${color.text}`} />
                <span className="text-[7px] font-black text-neutral-500">TRANSCRIPT</span>
            </div>
            <div className="flex flex-col gap-1">
                {[{ c: 'CS 301', g: 'A' }, { c: 'MATH 240', g: 'A-' }, { c: 'ENG 102', g: 'B+' }].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <span className="text-[6px] text-neutral-400 font-medium">{row.c}</span>
                        <span className={`text-[7px] font-black ${i === 0 ? color.text : 'text-neutral-500'}`}>{row.g}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const EduExplorerPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-10`} />
        <div className="relative flex flex-col gap-1.5 w-28">
            {['MS CompSci', 'Boot Camp', 'AWS Cert'].map((prog, i) => (
                <div key={prog} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-500 group-hover:scale-105 ${i === 0 ? `${color.bg} ${color.accent}` : 'bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700'}`} style={{ transitionDelay: `${i * 60}ms` }}>
                    <Search className={`w-2.5 h-2.5 ${i === 0 ? color.text : 'text-neutral-400'}`} />
                    <span className={`text-[7px] font-bold ${i === 0 ? color.text : 'text-neutral-400'}`}>{prog}</span>
                </div>
            ))}
        </div>
    </div>
);

const EduGpaPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-10`} />
        <div className="relative flex flex-col items-center gap-1.5 group-hover:scale-110 transition-transform duration-500">
            <div className="flex items-baseline gap-0.5">
                <span className={`text-2xl font-black ${color.text}`}>3.7</span>
                <span className="text-[8px] font-bold text-neutral-400">/ 4.0</span>
            </div>
            <div className="w-20 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full ${color.iconBg} rounded-full`} style={{ width: '92%' }} />
            </div>
            <span className="text-[7px] font-bold text-neutral-400">Cumulative GPA</span>
        </div>
    </div>
);

// ─── Browser Extension ───────────────────────────────────────────────────────

const ExtensionPreview: React.FC<{ color: FeatureColor }> = ({ color }) => (
    <div className="relative w-full h-24 flex items-center justify-center">
        <div className={`absolute inset-0 ${color.glow} blur-3xl opacity-10`} />
        <div className="relative bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-2.5 flex flex-col gap-2 w-28 group-hover:-translate-y-1 transition-transform duration-500">
            <div className="flex items-center gap-1.5">
                <Globe className={`w-3 h-3 ${color.text}`} />
                <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-700 rounded-full" />
            </div>
            <div className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg ${color.iconBg} cursor-pointer`}>
                <Bookmark className="w-2.5 h-2.5 text-white" />
                <span className="text-[7px] font-black text-white">SAVE</span>
            </div>
        </div>
    </div>
);
// ─── System Notices ───────────────────────────────────────────────────

export const ArchetypeUpdatePreview: React.FC = () => {
    return (
        <div className="w-full flex flex-col h-24 justify-center gap-4 animate-in fade-in duration-700 overflow-hidden">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <UserCircle className="w-4 h-4" />
                </div>
                <div className="h-2 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl border border-indigo-500/20 bg-indigo-50/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <div className="h-1.5 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                </div>
                <div className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 opacity-40 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                    <div className="h-1.5 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                </div>
            </div>

            <div className="mt-auto flex items-center gap-2 text-[10px] font-bold text-indigo-500 leading-none">
                <Target className="w-3 h-3" />
                Refine trajectory
            </div>
        </div>
    );
};

export const PolicyUpdatePreview: React.FC = () => {
    return (
        <div className="w-full h-24 flex flex-col justify-center gap-3 animate-in fade-in duration-700 overflow-hidden">
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                    <div className="h-2 w-2/3 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                </div>
            </div>
        </div>
    );
};

// ─── Preview Map ───────────────────────────────────────────────────────

const PREVIEW_MAP: Record<string, React.FC<{ color: FeatureColor }>> = {
    'jobfit': JobfitPreview,
    'ai-safety': AiSafetyPreview,
    'resume-tailoring': ResumeTailoringPreview,
    'keywords': KeywordsPreview,
    'resumes': ResumesPreview,
    'cover_letters': CoverLettersPreview,
    'quality-loop': QualityLoopPreview,
    'history': HistoryPreview,
    'feed': FeedPreview,
    'mail-in': MailInPreview,
    'coach': CoachPreview,
    'role-modeling': RoleModelsPreview,
    'skills-verify': SkillsInterviewPreview,
    'interview-advisor': InterviewAdvisorPreview,
    'edu': EduPreview,
    'edu-transcript': EduTranscriptPreview,
    'edu-explorer': EduExplorerPreview,
    'edu-gpa': EduGpaPreview,
    'extension': ExtensionPreview,
    '_notice_archetype': ArchetypeUpdatePreview,
    '_notice_tos': PolicyUpdatePreview,
};

/**
 * Get the preview component for a feature.
 * Returns null if no preview is defined for the given feature ID.
 */
export const getPreviewComponent = (featureId: string, color: FeatureColor): React.ReactNode => {
    const PreviewComponent = PREVIEW_MAP[featureId];
    if (!PreviewComponent) return null;
    return <PreviewComponent color={color} />;
};
