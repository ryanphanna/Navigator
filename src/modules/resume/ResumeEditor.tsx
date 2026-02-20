import React, { useState, useEffect, useRef } from 'react';
import type { ResumeProfile, ExperienceBlock, CustomSkill } from '../../types';
import { Upload, Loader2, Plus, Trash2, Briefcase, GraduationCap, Code, Layers, Calendar, Building2, UserCircle, FileText, Zap, Sparkles, Heart } from 'lucide-react';
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
        const handler = setTimeout(() => {
            const updatedProfile = { ...initialResume, blocks };
            onSave([updatedProfile]);
            // Track usage of resume builder
            EventService.trackUsage(TRACKING_EVENTS.RESUMES);
        }, 500);
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
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                            Intelligence Engine active
                        </span>
                    </div>
                </div>
            </SharedPageLayout>
        );
    }

    return (
        <SharedPageLayout className="relative min-h-screen pb-32" spacing="compact">
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
                title="Resume Editor"
                subtitle="Manage your professional history and accomplishments"
                variant="simple"
                actions={!showEmptyState ? headerActions : undefined}
                className="mb-12"
            />

            {showEmptyState ? (
                <div className="animate-in zoom-in-95 duration-700 overflow-hidden relative flex flex-col items-center justify-center py-12">
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
                <>
                    {importError && (
                        <div className="mb-10 max-w-3xl mx-auto">
                            <Alert
                                variant="error"
                                title="Recent Issue"
                                message={importError}
                                onClose={clearImportError}
                            />
                        </div>
                    )}

                    {/* Sections */}
                    <div className="space-y-10">
                        {SECTIONS.map((section) => {
                            const sectionBlocks = blocks.filter(b => b.type === section.type);

                            return (
                                <div key={section.type} className="scroll-mt-20">
                                    <div className="flex items-center gap-2 mb-4 border-b border-neutral-200 pb-2">
                                        <div className={`p-1.5 rounded-md ${getTypeColor(section.type)} bg-opacity-50`}>
                                            {section.icon}
                                        </div>
                                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{section.label}</h2>
                                        <span className="ml-auto text-xs font-medium text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                            {sectionBlocks.length}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {sectionBlocks.map((block) => (
                                            <Card
                                                key={block.id}
                                                variant="glass"
                                                className="group relative p-8 md:p-10 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 border-neutral-100 dark:border-neutral-800 rounded-[2rem]"
                                            >
                                                {/* Top Controls */}
                                                <div className="flex flex-col gap-6 mb-6">

                                                    <div className="flex justify-end items-start gap-2">
                                                        <div className="flex gap-2">
                                                            {/* Type Switcher (Hidden but accessible) */}
                                                            <div className="relative group/type">
                                                                <button className="p-2 text-neutral-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
                                                                    <Layers className="w-4 h-4" />
                                                                </button>
                                                                <select
                                                                    value={block.type}
                                                                    onChange={(e) => updateBlock(block.id, 'type', e.target.value)}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                                >
                                                                    {SECTIONS.map(s => <option key={s.type} value={s.type}>{s.label}</option>)}
                                                                </select>
                                                            </div>
                                                            <button
                                                                onClick={() => removeBlock(block.id)}
                                                                className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                                                                title="Delete Block"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {/* Title */}
                                                        {block.type !== 'summary' && (
                                                            <div className="w-full">
                                                                <textarea
                                                                    value={block.title}
                                                                    onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                                                    className="w-full text-2xl font-black text-neutral-900 dark:text-white bg-transparent border-none placeholder:text-neutral-300 focus:ring-0 p-0 resize-none overflow-hidden"
                                                                    placeholder={block.type === 'skill' ? "Technical Skills" : "Role / Title"}
                                                                    rows={1}
                                                                    ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Organization & Date Row */}
                                                        {block.type !== 'summary' && block.type !== 'skill' && (
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
                                                                    <textarea
                                                                        value={block.organization}
                                                                        onChange={(e) => updateBlock(block.id, 'organization', e.target.value)}
                                                                        className="w-full text-base font-bold text-neutral-600 dark:text-neutral-300 bg-transparent border-none placeholder:text-neutral-300 focus:ring-0 p-0 resize-none overflow-hidden"
                                                                        placeholder="Organization"
                                                                        rows={1}
                                                                        ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                                                    />
                                                                </div>

                                                                <div className="flex items-center gap-2 text-neutral-400 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-100 dark:border-neutral-700">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <input
                                                                        value={block.dateRange}
                                                                        onChange={(e) => updateBlock(block.id, 'dateRange', e.target.value)}
                                                                        className="bg-transparent text-xs font-bold text-neutral-500 uppercase tracking-wide w-32 focus:outline-none text-right"
                                                                        placeholder="JAN 2023 - PRESENT"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="space-y-4">
                                                            {/* Regular Bullet Editing */}
                                                            <div className="space-y-2">
                                                                {block.bullets.map((bullet: string, idx: number) => (
                                                                    <div key={idx} className="group/line flex items-start gap-3 relative pl-1">
                                                                        <span className={`mt-2.5 w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${bullet.trim() ? 'bg-neutral-400' : 'bg-neutral-200'} `} />
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
                                                                            className="w-full text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed bg-transparent border-b border-transparent hover:border-neutral-100 dark:hover:border-neutral-700 focus:border-indigo-300 rounded-none px-1 py-1 resize-none overflow-hidden focus:outline-none transition-all placeholder:text-neutral-400"
                                                                            placeholder="Add details..."
                                                                            rows={1}
                                                                            ref={(el) => {
                                                                                if (el) {
                                                                                    el.style.height = 'auto';
                                                                                    el.style.height = el.scrollHeight + 'px';
                                                                                }
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => removeBullet(block.id, idx)}
                                                                            className="absolute -right-2 top-1 opacity-0 group-hover/line:opacity-100 p-1 text-neutral-300 hover:text-red-400 transition-opacity"
                                                                            tabIndex={-1}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <button
                                                                onClick={() => addBullet(block.id)}
                                                                className="mt-2 ml-4 text-[10px] font-bold uppercase tracking-wider text-neutral-300 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" /> Add Point
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}

                                        {/* Empty State for Section */}
                                        {sectionBlocks.length === 0 && (
                                            <div className="text-center py-6 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-xl">
                                                <p className="text-xs text-neutral-400 mb-2">No {section.label.toLowerCase()} added yet.</p>
                                            </div>
                                        )}

                                        {/* Add Block Button for Section */}
                                        <button
                                            onClick={() => addBlock(section.type)}
                                            className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-neutral-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-all border-dashed"
                                        >
                                            <Plus className="w-4 h-4" /> Add {section.label}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </SharedPageLayout>
    );
};

export default ResumeEditor;
