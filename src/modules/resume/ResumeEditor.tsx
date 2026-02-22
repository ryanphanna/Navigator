import React, { useState, useEffect, useRef } from 'react';
import type { ResumeProfile, ExperienceBlock, CustomSkill } from '../../types';
import { Upload, Loader2, Plus, Trash2, Briefcase, GraduationCap, Code, Layers, Calendar, UserCircle, FileText, Zap, Sparkles, Heart, Download, ArrowRightLeft } from 'lucide-react';
import { TRACKING_EVENTS } from '../../constants';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useResumeContext } from './context/ResumeContext';
import { EventService } from '../../services/eventService';
import { UnifiedUploadHero } from '../../components/common/UnifiedUploadHero';
import { ResumePreview } from './components/ResumePreview';

interface ResumeEditorProps {
    resumes: ResumeProfile[];
    skills: CustomSkill[];
    onSave: (resumes: ResumeProfile[]) => void;
    onImport: (file: File) => void;
    isParsing: boolean;
    importError: string | null;
    importTrigger: number;
}

type SectionType = ExperienceBlock['type'];

const SECTIONS: { type: SectionType; label: string; icon: React.ReactNode }[] = [
    { type: 'summary', label: 'Professional Summary', icon: <UserCircle className="w-4 h-4" /> },
    { type: 'work', label: 'Work Experience', icon: <Briefcase className="w-4 h-4" /> },
    { type: 'education', label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
    { type: 'volunteer', label: 'Volunteer', icon: <Heart className="w-4 h-4" /> },
    { type: 'project', label: 'Projects', icon: <Code className="w-4 h-4" /> },
    { type: 'other', label: 'Other', icon: <Layers className="w-4 h-4" /> },
];

const getSortDate = (dateRange: string) => {
    if (!dateRange) return 0;
    const parts = dateRange.split(/[-–—]| to /).map(p => p.trim());
    const end = parts[parts.length - 1] || parts[0];
    if (!end) return 0;
    const lowerEnd = end.toLowerCase();
    if (lowerEnd.includes('present') || lowerEnd.includes('current')) return Date.now() + 1000000;
    const date = new Date(end);
    if (!isNaN(date.getTime())) return date.getTime();
    const yearMatch = end.match(/\d{4}/);
    if (yearMatch) return new Date(`${yearMatch[0]}-12-31`).getTime();
    return 0;
};

const ResumeEditor: React.FC<ResumeEditorProps> = ({
    resumes,
    onSave,
    onImport,
    isParsing,
    importError,
    importTrigger
}) => {
    const initialResume = resumes.length > 0 ? resumes[0] : { id: 'primary', name: 'Primary Experience', blocks: [] };

    const [blocks, setBlocks] = useState<ExperienceBlock[]>(initialResume.blocks || []);
    const [movingBlockId, setMovingBlockId] = useState<string | null>(null);
    const [hasStartedManually, setHasStartedManually] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { clearImportError } = useResumeContext();

    useEffect(() => {
        if (resumes.length > 0) {
            setBlocks(resumes[0].blocks);
        }
    }, [importTrigger, resumes]);

    // Clear error on unmount
    useEffect(() => {
        return () => {
            clearImportError();
        };
    }, [clearImportError]);

    useEffect(() => {
        setIsSaving(true);
        const handler = setTimeout(() => {
            const updatedProfile = { ...initialResume, blocks };
            onSave([updatedProfile]);
            setIsSaving(false);
            // Track usage of resume builder
            EventService.trackUsage(TRACKING_EVENTS.RESUMES);
        }, 800);
        return () => clearTimeout(handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocks, initialResume.id]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onImport(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addBlock = (type: SectionType) => {
        if (type === 'summary' && blocks.some(b => b.type === 'summary')) return;
        const newBlock: ExperienceBlock = {
            id: crypto.randomUUID(),
            type: type,
            title: type === 'summary' ? 'Professional Summary' : '',
            organization: '',
            dateRange: '',
            bullets: [''],
            isVisible: true
        };
        setBlocks([...blocks, newBlock]);
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const updateBlock = (id: string, field: keyof ExperienceBlock, value: string | string[] | boolean) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const updateBullet = (blockId: string, index: number, value: string) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            const newBullets = [...b.bullets];
            newBullets[index] = value;
            return { ...b, bullets: newBullets };
        }));
    };

    const addBullet = (blockId: string, text: string = '') => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            // If the last bullet is empty, use that instead of adding new one
            const newBullets = [...b.bullets];
            if (newBullets.length > 0 && newBullets[newBullets.length - 1] === '') {
                newBullets[newBullets.length - 1] = text;
            } else {
                newBullets.push(text);
            }
            return { ...b, bullets: newBullets };
        }));
    };

    const removeBullet = (blockId: string, index: number) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            return { ...b, bullets: b.bullets.filter((_: string, i: number) => i !== index) };
        }));
    };

    const handleApplySuggestion = (suggestion: any) => {
        if (suggestion.type === 'add' || suggestion.type === 'update') {
            // Find summary block or add one
            const summaryBlock = blocks.find(b => b.type === 'summary');
            if (summaryBlock) {
                addBullet(summaryBlock.id, suggestion.suggestion);
            } else {
                const newBlock: ExperienceBlock = {
                    id: crypto.randomUUID(),
                    type: 'summary',
                    title: 'Professional Summary',
                    organization: '',
                    dateRange: '',
                    bullets: [suggestion.suggestion],
                    isVisible: true
                };
                setBlocks([newBlock, ...blocks]);
            }
        }
        handleDismissSuggestion(suggestion.id);
    };

    const handleDismissSuggestion = (suggestionId: string) => {
        const updatedProfile = {
            ...initialResume,
            suggestedUpdates: (initialResume.suggestedUpdates || []).filter(s => s.id !== suggestionId)
        };
        onSave([updatedProfile]);
    };

    const handlePrint = () => {
        window.print();
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'summary': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'work': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            case 'education': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'volunteer': return 'text-rose-600 bg-rose-50 border-rose-200';
            case 'project': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'other': return 'text-neutral-600 bg-neutral-50 border-neutral-200';
            default: return 'text-neutral-600 bg-neutral-50 border-neutral-200';
        }
    };

    const showEmptyState = blocks.length === 0 && !hasStartedManually && !isParsing;



    if (isParsing) {
        return (
            <SharedPageLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />
                        <Card variant="glass" className="relative p-8 rounded-[3rem] shadow-2xl border-indigo-100 dark:border-neutral-800">
                            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                        </Card>
                    </div>
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                            Analyzing your history...
                        </h2>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium max-w-sm mx-auto leading-relaxed">
                            Our AI is extracting your achievements and mapping your professional impact.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-bounce" />
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                            Intelligence Engine active
                        </span>
                    </div>
                </div>
            </SharedPageLayout>
        );
    }

    return (
        <SharedPageLayout className="relative min-h-screen pb-32" maxWidth="5xl" spacing="compact">
            <style>
                {`
                    @media print {
                        body { 
                            background: white !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .print-only {
                            display: block !important;
                        }
                        /* Reset layout for print */
                        .print-container {
                            display: block !important;
                            max-width: 100% !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                    }
                `}
            </style>

            <div id="resume-preview" className="hidden print-only">
                <ResumePreview blocks={blocks} />
            </div>
            {/* Contextual Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-purple-500/5 blur-[150px] rounded-full" />
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="application/pdf,image/png,image/jpeg"
                className="hidden"
            />

            <PageHeader
                title="Resume"
                subtitle="Manage your professional history and accomplishments"
                variant="simple"
                className="mb-8 no-print"
            />

            {showEmptyState ? (
                <div className="animate-in zoom-in-95 duration-700 overflow-hidden relative flex flex-col items-center justify-center py-12 no-print">
                    <div className="relative z-10 w-full max-w-5xl mx-auto">
                        {importError && (
                            <div className="mb-8 max-w-2xl mx-auto">
                                <Alert
                                    variant="error"
                                    title="Import Status"
                                    message={importError}
                                    onClose={clearImportError}
                                />
                            </div>
                        )}

                        {/* Unified Upload Hero */}
                        <UnifiedUploadHero
                            title="Upload"
                            description="Drop your resume to begin analysis"
                            onUpload={(files) => onImport(files[0])}
                            onManualEntry={() => setHasStartedManually(true)}
                            themeColor="indigo"
                            cards={{
                                foundation: {
                                    title: "Foundation",
                                    description: "We need your history to build a strong foundation. Upload your current resume to provide the essential data for your profile.",
                                    icon: FileText,
                                    benefits: ['Smart File Import', 'Automatic Cleanup', 'Privacy-First Engine']
                                },
                                intelligence: {
                                    title: "Intelligence",
                                    description: "Our AI processes your data to discover your unique strengths. We analyze your past experience to highlight your true impact and potential.",
                                    icon: Zap,
                                    benefits: ['Achievement Analysis', 'Skill Discovery', 'Career Alignment']
                                }
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8 items-start relative print-container">
                    {/* Left Column: Editor Sections */}
                    <div className="flex-1 space-y-12 animate-in slide-in-from-left-4 duration-700">
                        {importError && (
                            <div className="mb-10">
                                <Alert
                                    variant="error"
                                    title="Recent Issue"
                                    message={importError}
                                    onClose={clearImportError}
                                />
                            </div>
                        )}

                        {/* Sections */}
                        <div className="space-y-12">
                            {SECTIONS.map((section) => {
                                const sectionBlocks = blocks
                                    .filter(b => b.type === section.type)
                                    .sort((a, b) => getSortDate(b.dateRange) - getSortDate(a.dateRange));

                                return (
                                    <div key={section.type} className="scroll-mt-20 print-card">
                                        <div className="flex items-center gap-2 mb-6 border-b border-neutral-100 dark:border-neutral-800/50 pb-3 no-print">
                                            <div className={`p-2 rounded-xl ${getTypeColor(section.type)} bg-opacity-10 border shadow-sm`}>
                                                {section.icon}
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <h2 className="text-lg font-black text-neutral-900 dark:text-white items-center flex gap-2">
                                                    {section.label}
                                                    {sectionBlocks.length > 0 && section.type !== 'summary' && (
                                                        <span className="text-[10px] font-black text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">
                                                            {sectionBlocks.length}
                                                        </span>
                                                    )}
                                                </h2>
                                            </div>
                                            {(section.type !== 'summary' || sectionBlocks.length === 0) && (
                                                <button
                                                    onClick={() => addBlock(section.type)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-indigo-800 text-neutral-500 hover:text-indigo-600 rounded-xl transition-all group/add shadow-sm hover:shadow-md"
                                                >
                                                    <Plus className="w-3.5 h-3.5 group-hover/add:rotate-90 transition-transform duration-300" />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">Add {section.label === 'Professional Summary' ? 'Summary' : 'Entry'}</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            {sectionBlocks.map((block) => (
                                                <Card
                                                    key={block.id}
                                                    variant="premium"
                                                    className={`group relative transition-all duration-300 border-neutral-200 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-xl print-card ${!block.isVisible ? 'opacity-50 no-print' : ''}`}
                                                >
                                                    <div className="p-6 md:p-8">
                                                        <div className="space-y-6">
                                                            {/* Title Area */}
                                                            {block.type !== 'summary' && (
                                                                <div className="pr-12">
                                                                    <textarea
                                                                        value={block.title}
                                                                        onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                                                        className="w-full text-2xl font-black text-neutral-900 dark:text-white bg-transparent border-none placeholder:text-neutral-200 focus:ring-0 p-0 resize-none overflow-hidden leading-tight whitespace-pre-wrap break-words"
                                                                        placeholder={block.type === 'skill' ? "Technical Skills" : "Role / Title"}
                                                                        rows={1}
                                                                        ref={(el) => {
                                                                            if (el) {
                                                                                el.style.height = 'auto';
                                                                                el.style.height = el.scrollHeight + 'px';
                                                                            }
                                                                        }}
                                                                        onInput={(e) => {
                                                                            const target = e.target as HTMLTextAreaElement;
                                                                            target.style.height = 'auto';
                                                                            target.style.height = target.scrollHeight + 'px';
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Organization & Date Row */}
                                                            {block.type !== 'summary' && block.type !== 'skill' && (
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-12">
                                                                    <div className="flex items-center gap-2 flex-1">

                                                                        <textarea
                                                                            value={block.organization}
                                                                            onChange={(e) => updateBlock(block.id, 'organization', e.target.value)}
                                                                            className="w-full text-lg font-bold text-neutral-700 dark:text-neutral-300 bg-transparent border-none placeholder:text-neutral-200 focus:ring-0 p-0 resize-none overflow-hidden whitespace-pre-wrap break-words"
                                                                            placeholder="Organization / Company"
                                                                            rows={1}
                                                                            ref={(el) => {
                                                                                if (el) {
                                                                                    el.style.height = 'auto';
                                                                                    el.style.height = el.scrollHeight + 'px';
                                                                                }
                                                                            }}
                                                                            onInput={(e) => {
                                                                                const target = e.target as HTMLTextAreaElement;
                                                                                target.style.height = 'auto';
                                                                                target.style.height = target.scrollHeight + 'px';
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center gap-2 text-neutral-400 bg-neutral-50/50 dark:bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-100 dark:border-neutral-800 transition-all focus-within:border-indigo-200/50 focus-within:bg-white dark:focus-within:bg-neutral-800">
                                                                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                                                                        <input
                                                                            value={block.dateRange}
                                                                            onChange={(e) => updateBlock(block.id, 'dateRange', e.target.value)}
                                                                            className="bg-transparent text-[11px] font-bold text-neutral-500 w-32 focus:outline-none text-right"
                                                                            placeholder="Jan 2023 - Present"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Bullets */}
                                                            <div className="space-y-4">
                                                                <div className="space-y-3">
                                                                    {block.bullets.map((bullet: string, idx: number) => (
                                                                        <div key={idx} className="group/line flex items-start gap-3 relative">
                                                                            {block.type !== 'summary' && (
                                                                                <div className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-500 ${bullet.trim() ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-neutral-200 dark:bg-neutral-800'} `} />
                                                                            )}
                                                                            <textarea
                                                                                value={bullet}
                                                                                onChange={(e) => updateBullet(block.id, idx, e.target.value)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        e.preventDefault();
                                                                                        addBullet(block.id);
                                                                                    }
                                                                                    if (e.key === 'Backspace' && bullet === '' && block.bullets.length > 1) {
                                                                                        e.preventDefault();
                                                                                        removeBullet(block.id, idx);
                                                                                    }
                                                                                }}
                                                                                className={`flex-1 min-w-0 text-neutral-700 dark:text-neutral-300 leading-relaxed bg-transparent border-none focus:ring-0 p-0 resize-none overflow-hidden focus:outline-none transition-all placeholder:text-neutral-300 pr-12 text-sm whitespace-pre-wrap break-words`}
                                                                                placeholder={block.type === 'summary' ? "Write a brief, high-impact professional overview..." : "Detail your accomplishments here..."}
                                                                                rows={1}
                                                                                ref={(el) => {
                                                                                    if (el) {
                                                                                        el.style.height = 'auto';
                                                                                        el.style.height = el.scrollHeight + 'px';
                                                                                    }
                                                                                }}
                                                                                onInput={(e) => {
                                                                                    const target = e.target as HTMLTextAreaElement;
                                                                                    target.style.height = 'auto';
                                                                                    target.style.height = target.scrollHeight + 'px';
                                                                                }}
                                                                            />
                                                                            {block.type !== 'summary' && (
                                                                                <button
                                                                                    onClick={() => removeBullet(block.id, idx)}
                                                                                    className="opacity-0 group-hover/line:opacity-100 p-1 text-neutral-200 hover:text-rose-400 transition-opacity"
                                                                                    tabIndex={-1}
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {block.type !== 'summary' && (
                                                                    <div className="mt-4 flex items-center gap-1 no-print">
                                                                        <button
                                                                            onClick={() => addBullet(block.id)}
                                                                            className="px-3 py-1.5 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 text-[10px] font-black text-neutral-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 flex items-center gap-1.5 transition-all"
                                                                        >
                                                                            <Plus className="w-3 h-3" /> Add Achievement
                                                                        </button>
                                                                        <div className="w-px h-4 bg-neutral-100 dark:bg-neutral-800 mx-1" />
                                                                        <div className="relative">
                                                                            <button
                                                                                onClick={() => setMovingBlockId(movingBlockId === block.id ? null : block.id)}
                                                                                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border ${movingBlockId === block.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'text-neutral-400 border-transparent hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'}`}
                                                                                title="Move to Section"
                                                                            >
                                                                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                                                                <span className="text-[10px] font-black">Move</span>
                                                                            </button>

                                                                            {movingBlockId === block.id && (
                                                                                <>
                                                                                    <div className="fixed inset-0 z-40" onClick={() => setMovingBlockId(null)} />
                                                                                    <div className="absolute bottom-full mb-3 left-0 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden min-w-[200px] animate-in slide-in-from-bottom-2 duration-200">
                                                                                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                                                                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Move to Section</p>
                                                                                        </div>
                                                                                        <div className="p-1.5">
                                                                                            {SECTIONS.map(s => (
                                                                                                <button
                                                                                                    key={s.type}
                                                                                                    onClick={() => {
                                                                                                        updateBlock(block.id, 'type', s.type);
                                                                                                        setMovingBlockId(null);
                                                                                                    }}
                                                                                                    className={`w-full px-3 py-2.5 text-left text-xs font-bold rounded-xl transition-all flex items-center gap-3 ${block.type === s.type ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'}`}
                                                                                                >
                                                                                                    <div className={`p-1.5 rounded-lg ${getTypeColor(s.type)} bg-opacity-10 border border-current border-opacity-10 shadow-sm`}>
                                                                                                        {s.icon}
                                                                                                    </div>
                                                                                                    {s.label}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => removeBlock(block.id)}
                                                                            className="p-1.5 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                                            title="Delete Block"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}


                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar */}
                    <aside className="hidden lg:block sticky top-32 w-80 shrink-0 space-y-6 animate-in slide-in-from-right-8 duration-1000 no-print pt-14">
                        {/* Discovery Bank / Suggestions */}
                        {initialResume.suggestedUpdates && initialResume.suggestedUpdates.length > 0 && (
                            <Card variant="premium" className="p-5 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/10 dark:bg-indigo-950/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex flex-col">
                                        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Discovery Bank</h3>
                                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight">AI Captured Suggestions</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {initialResume.suggestedUpdates.map((suggestion) => (
                                        <div key={suggestion.id} className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-indigo-100 dark:border-indigo-500/10 space-y-2 group/sug">
                                            <div className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                                                {suggestion.suggestion}
                                            </div>
                                            {suggestion.impact && (
                                                <p className="text-[9px] text-neutral-500 leading-relaxed italic">{suggestion.impact}</p>
                                            )}
                                            <div className="flex items-center gap-2 pt-1 border-t border-neutral-50 dark:border-neutral-800">
                                                <button
                                                    onClick={() => handleApplySuggestion(suggestion)}
                                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-tight transition-all"
                                                >
                                                    Apply
                                                </button>
                                                <button
                                                    onClick={() => handleDismissSuggestion(suggestion.id)}
                                                    className="px-2 py-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Resume Strength */}
                        <Card variant="premium" className="p-5 border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Resume Strength</h3>
                                    <p className="text-xl font-black text-neutral-900 dark:text-white">
                                        {Math.min(100, (blocks.reduce((acc, b) => acc + b.bullets.filter(bul => bul.trim()).length, 0) * 10) + (blocks.length * 5))}%
                                    </p>
                                </div>
                                <div className="relative w-12 h-12">
                                    <svg className="w-12 h-12 -rotate-90">
                                        <circle cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-neutral-100 dark:text-neutral-800" />
                                        <circle
                                            cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" strokeWidth="4"
                                            strokeDasharray={125.6}
                                            strokeDashoffset={125.6 - (125.6 * Math.min(100, (blocks.reduce((acc, b) => acc + b.bullets.filter(bul => bul.trim()).length, 0) * 10) + (blocks.length * 5))) / 100}
                                            className="text-indigo-600 transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                                {blocks.length < 3 ? 'Add more sections to improve your visibility.' : 'Great start! Focus on quantifying your achievements.'}
                            </p>
                        </Card>

                        {/* Top Skills Tag Wall */}
                        <Card variant="premium" className="p-5 border-neutral-100 dark:border-neutral-800">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-4">Top Skills Extracted</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {blocks.flatMap(b => b.bullets)
                                    .join(' ')
                                    .match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) // Very basic skill extraction for demo
                                    ?.filter((v, i, a) => a.indexOf(v) === i && v.length > 3)
                                    .slice(0, 12)
                                    .map(skill => (
                                        <span key={skill} className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 rounded-lg border border-neutral-100 dark:border-neutral-700">
                                            {skill}
                                        </span>
                                    )) || <p className="text-[10px] text-neutral-400 italic">No skills identified yet.</p>
                                }
                            </div>
                        </Card>

                        {/* Pro Tip */}
                        <div className="px-5 py-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100/50 dark:border-amber-900/20 relative overflow-hidden group">
                            <Sparkles className="absolute -right-2 -top-2 w-12 h-12 text-amber-200/20 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                            <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Pro Tip</h4>
                            <p className="text-[11px] text-amber-800/80 dark:text-amber-400 leading-relaxed font-medium">
                                Use action verbs like "Spearheaded", "Architected", or "Negotiated" to make your achievements stand out.
                            </p>
                        </div>

                        {/* Status Card */}
                        <Card variant="premium" className="p-6 border-indigo-100/50 dark:border-indigo-500/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none relative group overflow-visible">
                            {/* Decorative Glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />

                            <div className="flex items-center justify-center mb-6">
                                <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                                    <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.4)] shrink-0`} />
                                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-tight">
                                        {isSaving ? 'Updating...' : 'Experience synced'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2.5">
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isParsing}
                                        variant="premium"
                                        size="md"
                                        className="w-full h-12 text-sm font-black group/btn transition-all duration-300"
                                        icon={isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />}
                                    >
                                        {isParsing ? 'Processing...' : 'Import Resume'}
                                    </Button>
                                    <Button
                                        onClick={handlePrint}
                                        variant="secondary"
                                        size="md"
                                        className="w-full h-12 text-sm bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 group/btn transition-all duration-300"
                                        icon={<Download className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />}
                                    >
                                        Download PDF
                                    </Button>
                                </div>


                            </div>
                        </Card>
                    </aside>

                </div>
            )}
        </SharedPageLayout>
    );
};

export default ResumeEditor;
