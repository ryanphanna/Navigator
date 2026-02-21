import React, { useState, useEffect, useRef } from 'react';
import type { ResumeProfile, ExperienceBlock, CustomSkill } from '../../types';
import { Upload, Loader2, Plus, Trash2, Briefcase, GraduationCap, Code, Layers, Calendar, Building2, UserCircle, FileText, Zap, Sparkles, Heart, ChevronUp, ChevronDown, Download } from 'lucide-react';
import { TRACKING_EVENTS } from '../../constants';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useResumeContext } from './context/ResumeContext';
import { EventService } from '../../services/eventService';
import { UnifiedUploadHero } from '../../components/common/UnifiedUploadHero';

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
    { type: 'summary', label: 'Professional Summary', icon: <UserCircle className="w-5 h-5" /> },
    { type: 'work', label: 'Work Experience', icon: <Briefcase className="w-5 h-5" /> },
    { type: 'education', label: 'Education', icon: <GraduationCap className="w-5 h-5" /> },
    { type: 'volunteer', label: 'Volunteer', icon: <Heart className="w-5 h-5" /> },
    { type: 'project', label: 'Projects', icon: <Code className="w-5 h-5" /> },
    { type: 'other', label: 'Other', icon: <Layers className="w-5 h-5" /> },
];

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
    const [hasStartedManually, setHasStartedManually] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
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
            setLastSaved(new Date());
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

    const moveBlock = (id: string, direction: 'up' | 'down') => {
        const index = blocks.findIndex(b => b.id === id);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === blocks.length - 1) return;

        const newBlocks = [...blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
        setBlocks(newBlocks);
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

    const headerActions = (
        <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            variant="accent"
            icon={isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
        >
            {isParsing ? 'Parsing...' : 'Import Resume'}
        </Button>
    );

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
                        /* Remove cards/shadown for a paper-clean look */
                        .print-card {
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin-bottom: 2rem !important;
                            background: transparent !important;
                            backdrop-filter: none !important;
                        }
                        .print-card > div {
                            padding: 0 !important;
                        }
                        /* Ensure text is black/readable */
                        .print-text-main {
                            color: #111 !important;
                        }
                        .print-text-muted {
                            color: #555 !important;
                        }
                        /* Hide interaction elements */
                        .print-hide {
                            display: none !important;
                        }
                    }
                `}
            </style>
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
                                const sectionBlocks = blocks.filter(b => b.type === section.type);

                                return (
                                    <div key={section.type} className="scroll-mt-20 print-card">
                                        <div className="flex items-center gap-2 mb-6 border-b border-neutral-100 dark:border-neutral-800/50 pb-3 no-print">
                                            <div className={`p-2 rounded-xl ${getTypeColor(section.type)} bg-opacity-10 border shadow-sm`}>
                                                {section.icon}
                                            </div>
                                            <div className="flex flex-col">
                                                <h2 className="text-lg font-black text-neutral-900 dark:text-white items-center flex gap-2">
                                                    {section.label}
                                                    {sectionBlocks.length > 0 && (
                                                        <span className="text-[10px] font-black text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">
                                                            {sectionBlocks.length}
                                                        </span>
                                                    )}
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {sectionBlocks.map((block) => (
                                                <Card
                                                    key={block.id}
                                                    variant="premium"
                                                    className={`group relative transition-all duration-300 border-neutral-200 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-xl print-card ${!block.isVisible ? 'opacity-50 no-print' : ''}`}
                                                >
                                                    <div className="p-6 md:p-8">
                                                        {/* Floating Controls (Right Side) */}
                                                        <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 no-print">
                                                            <button
                                                                onClick={() => moveBlock(block.id, 'up')}
                                                                className="p-1.5 text-neutral-300 hover:text-indigo-500 hover:bg-white dark:hover:bg-neutral-800 rounded-lg shadow-sm border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700 transition-all"
                                                                title="Move Up"
                                                            >
                                                                <ChevronUp className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => moveBlock(block.id, 'down')}
                                                                className="p-1.5 text-neutral-300 hover:text-indigo-500 hover:bg-white dark:hover:bg-neutral-800 rounded-lg shadow-sm border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700 transition-all"
                                                                title="Move Down"
                                                            >
                                                                <ChevronDown className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => removeBlock(block.id)}
                                                                className="p-1.5 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg shadow-sm border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 transition-all"
                                                                title="Delete Block"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-6">
                                                            {/* Title Area */}
                                                            {block.type !== 'summary' && (
                                                                <div className="pr-12">
                                                                    <textarea
                                                                        value={block.title}
                                                                        onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                                                        className="w-full text-2xl font-black text-neutral-900 dark:text-white bg-transparent border-none placeholder:text-neutral-200 focus:ring-0 p-0 resize-none overflow-hidden leading-tight"
                                                                        placeholder={block.type === 'skill' ? "Technical Skills" : "Role / Title"}
                                                                        rows={1}
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
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <div className="p-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-400">
                                                                            <Building2 className="w-4 h-4 shrink-0" />
                                                                        </div>
                                                                        <textarea
                                                                            value={block.organization}
                                                                            onChange={(e) => updateBlock(block.id, 'organization', e.target.value)}
                                                                            className="w-full text-lg font-bold text-neutral-700 dark:text-neutral-300 bg-transparent border-none placeholder:text-neutral-200 focus:ring-0 p-0 resize-none overflow-hidden"
                                                                            placeholder="Organization / Company"
                                                                            rows={1}
                                                                            onInput={(e) => {
                                                                                const target = e.target as HTMLTextAreaElement;
                                                                                target.style.height = 'auto';
                                                                                target.style.height = target.scrollHeight + 'px';
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center gap-2 text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 px-3 py-1.5 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-inner">
                                                                        <Calendar className="w-3.5 h-3.5" />
                                                                        <input
                                                                            value={block.dateRange}
                                                                            onChange={(e) => updateBlock(block.id, 'dateRange', e.target.value)}
                                                                            className="bg-transparent text-[10px] font-black text-neutral-500 w-32 focus:outline-none text-right"
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
                                                                                className={`w-full text-neutral-700 dark:text-neutral-300 leading-relaxed bg-transparent border-none focus:ring-0 p-0 resize-none overflow-hidden focus:outline-none transition-all placeholder:text-neutral-300 ${block.type === 'summary' ? 'text-lg font-medium' : 'text-sm'}`}
                                                                                placeholder={block.type === 'summary' ? "Write a brief, high-impact professional overview..." : "Detail your accomplishments here..."}
                                                                                rows={1}
                                                                                onInput={(e) => {
                                                                                    const target = e.target as HTMLTextAreaElement;
                                                                                    target.style.height = 'auto';
                                                                                    target.style.height = target.scrollHeight + 'px';
                                                                                }}
                                                                            />
                                                                            <button
                                                                                onClick={() => removeBullet(block.id, idx)}
                                                                                className="opacity-0 group-hover/line:opacity-100 p-1 text-neutral-200 hover:text-rose-400 transition-opacity"
                                                                                tabIndex={-1}
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {block.type !== 'summary' && (
                                                                    <button
                                                                        onClick={() => addBullet(block.id)}
                                                                        className="mt-2 ml-4 px-3 py-1.5 rounded-lg border border-dashed border-neutral-100 dark:border-neutral-800 text-[10px] font-black text-neutral-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 flex items-center gap-1.5 transition-all no-print"
                                                                    >
                                                                        <Plus className="w-3 h-3" /> Add Achievement
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}

                                            {/* Empty State for Section */}
                                            {sectionBlocks.length === 0 && (
                                                <div className="text-center py-10 border-2 border-dashed border-neutral-100 dark:border-neutral-800/50 rounded-[2rem] bg-neutral-50/50 dark:bg-neutral-900/20 no-print">
                                                    <p className="text-xs font-bold text-neutral-400">No {section.label.toLowerCase()} items found</p>
                                                    <button
                                                        onClick={() => addBlock(section.type)}
                                                        className="mt-4 text-[10px] font-black text-indigo-500 hover:underline"
                                                    >
                                                        Initialize Section
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar */}
                    <aside className="hidden lg:block sticky top-8 w-72 shrink-0 space-y-8 animate-in slide-in-from-right-4 duration-700 no-print">
                        {/* Status Card */}
                        <Card variant="premium" className="p-6 border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.3)]`} />
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                        {isSaving ? 'Syncing...' : 'Saved'}
                                    </span>
                                </div>
                                {lastSaved && !isSaving && (
                                    <span className="text-[9px] font-bold text-neutral-300">
                                        {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {headerActions}
                                <Button
                                    onClick={handlePrint}
                                    variant="secondary"
                                    className="w-full"
                                    icon={<Download className="w-4 h-4" />}
                                >
                                    Download PDF
                                </Button>
                                <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-neutral-400 mb-3">Quick Add</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {SECTIONS.filter(s => s.type !== 'summary' || !blocks.some(b => b.type === 'summary')).map(section => (
                                            <button
                                                key={section.type}
                                                onClick={() => addBlock(section.type)}
                                                className="w-full py-2.5 px-4 flex items-center gap-3 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 text-left group"
                                            >
                                                <div className={`p-1.5 rounded-lg ${getTypeColor(section.type)} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                                                    {section.icon}
                                                </div>
                                                {section.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Tips Card */}
                        <Card variant="premium" className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                            <Sparkles className="w-8 h-8 mb-4 text-indigo-200" />
                            <h3 className="text-lg font-black mb-2 leading-tight">Pro Tip</h3>
                            <p className="text-xs font-medium text-indigo-100 leading-relaxed mb-4">
                                Keep your achievements focused on results. Use strong action verbs and quantify your impact whenever possible.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-white/60">
                                <Zap className="w-3 h-3" /> AI Optimized
                            </div>
                        </Card>
                    </aside>
                </div>
            )}
        </SharedPageLayout>
    );
};

export default ResumeEditor;
