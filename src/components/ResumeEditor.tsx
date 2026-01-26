import React, { useState, useEffect, useRef } from 'react';
import type { ResumeProfile, ExperienceBlock } from '../types';
import { Upload, Loader2, Plus, Trash2, Briefcase, GraduationCap, Code, Layers, Calendar, Building2, UserCircle, Zap } from 'lucide-react';

interface ResumeEditorProps {
    resumes: ResumeProfile[];
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
    { type: 'project', label: 'Projects', icon: <Code className="w-5 h-5" /> },
    { type: 'skill', label: 'Skills', icon: <Zap className="w-5 h-5" /> },
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
    const initialResume = resumes.length > 0 ? resumes[0] : { id: 'master', name: 'Master Experience', blocks: [] };

    const [blocks, setBlocks] = useState<ExperienceBlock[]>(initialResume.blocks || []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (resumes.length > 0) {
            setBlocks(resumes[0].blocks);
        }
    }, [importTrigger, resumes]);

    useEffect(() => {
        const handler = setTimeout(() => {
            const updatedProfile = { ...initialResume, blocks };
            onSave([updatedProfile]);
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

    const addBullet = (blockId: string) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            return { ...b, bullets: [...b.bullets, ''] };
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
            case 'project': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'skill': return 'text-pink-600 bg-pink-50 border-pink-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="animate-in fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume</h1>
                    <p className="text-slate-500 text-sm">Manage your experience blocks.</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="application/pdf,image/png,image/jpeg"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsing}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isParsing ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Upload className="w-4 h-4" />}
                        {isParsing ? 'Parsing...' : 'Import Resume'}
                    </button>
                </div>
            </div>

            {importError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm animate-in slide-in-from-top-2">
                    {importError}
                </div>
            )}

            {/* Sections */}
            <div className="space-y-10">
                {SECTIONS.map((section) => {
                    const sectionBlocks = blocks.filter(b => b.type === section.type);

                    return (
                        <div key={section.type} className="scroll-mt-20">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                                <div className={`p-1.5 rounded-md ${getTypeColor(section.type)} bg-opacity-50`}>
                                    {section.icon}
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">{section.label}</h2>
                                <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {sectionBlocks.length}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {sectionBlocks.map((block) => (
                                    <div
                                        key={block.id}
                                        className="group relative bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200 overflow-hidden"
                                    >
                                        <div className={`absolute top-0 bottom-0 left-0 w-1 ${getTypeColor(block.type).split(' ')[1]}`} />

                                        <div className="pl-5 pr-4 py-4">
                                            {/* Top Controls */}
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                                    {/* Title */}
                                                    {block.type !== 'summary' && (
                                                        <div className={block.type === 'skill' ? 'md:col-span-12' : 'md:col-span-5'}>
                                                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                                                {block.type === 'education' ? 'Degree / Certificate' : block.type === 'skill' ? 'Skill Group / Category' : 'Role / Title'}
                                                            </label>
                                                            <textarea
                                                                value={block.title}
                                                                onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                                                className="w-full font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-slate-300 resize-none overflow-hidden"
                                                                placeholder={block.type === 'skill' ? "e.g. Technical Skills" : "e.g. Senior Manager"}
                                                                rows={1}
                                                                ref={(el) => {
                                                                    if (el) {
                                                                        el.style.height = 'auto';
                                                                        el.style.height = el.scrollHeight + 'px';
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Organization */}
                                                    {block.type !== 'summary' && block.type !== 'skill' && (
                                                        <div className="md:col-span-4">
                                                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                                                {block.type === 'education' ? 'School / Institution' : 'Organization'}
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                                <textarea
                                                                    value={block.organization}
                                                                    onChange={(e) => updateBlock(block.id, 'organization', e.target.value)}
                                                                    className="w-full text-sm font-medium text-slate-700 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors placeholder:text-slate-300 resize-none overflow-hidden"
                                                                    placeholder="e.g. Acme Corp"
                                                                    rows={1}
                                                                    ref={(el) => {
                                                                        if (el) {
                                                                            el.style.height = 'auto';
                                                                            el.style.height = el.scrollHeight + 'px';
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Date Range */}
                                                    {block.type !== 'summary' && block.type !== 'skill' && (
                                                        <div className="md:col-span-3 flex justify-end">
                                                            <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-2 py-1 rounded text-xs">
                                                                <Calendar className="w-3 h-3" />
                                                                <input
                                                                    value={block.dateRange}
                                                                    onChange={(e) => updateBlock(block.id, 'dateRange', e.target.value)}
                                                                    className="bg-transparent text-right w-32 focus:outline-none text-slate-600 font-medium"
                                                                    placeholder="Jan 2023 - Present"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => removeBlock(block.id)}
                                                        className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Delete Block"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    {/* Type Switcher (Hidden but accessible) */}
                                                    <div className="relative group/type">
                                                        <button className="text-slate-300 hover:text-indigo-500 p-1.5 rounded-md">
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
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {block.bullets.map((bullet: string, idx: number) => (
                                                    <div key={idx} className="group/line flex items-start gap-3 relative pl-1">
                                                        <span className={`mt-2.5 w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${bullet.trim() ? 'bg-slate-400' : 'bg-slate-200'}`} />
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
                                                            className="w-full text-sm text-slate-700 leading-relaxed bg-transparent border-b border-transparent hover:border-slate-100 focus:border-indigo-300 rounded-none px-1 py-1 resize-none overflow-hidden focus:outline-none transition-all placeholder:text-slate-300"
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
                                                            className="absolute -right-2 top-1 opacity-0 group-hover/line:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-opacity"
                                                            tabIndex={-1}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add Bullet Button (Only show if last bullet has content) */}
                                            <button
                                                onClick={() => addBullet(block.id)}
                                                className="mt-2 ml-4 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" /> Add Point
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Empty State for Section */}
                                {sectionBlocks.length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                                        <p className="text-xs text-slate-400 mb-2">No {section.label.toLowerCase()} added yet.</p>
                                    </div>
                                )}

                                {/* Add Block Button for Section */}
                                <button
                                    onClick={() => addBlock(section.type)}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100 hover:bg-indigo-50 rounded-lg transition-all border-dashed"
                                >
                                    <Plus className="w-4 h-4" /> Add {section.label}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ResumeEditor;
