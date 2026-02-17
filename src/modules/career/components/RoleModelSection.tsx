import React from 'react';
import { Users, Plus, Loader2, Sparkles } from 'lucide-react';
import { EntityCard } from '../../../components/common/EntityCard';
import { RoleModelDetail } from '../RoleModelDetail';
import type { RoleModelProfile } from '../../../types';

interface RoleModelSectionProps {
    roleModels: RoleModelProfile[];
    selectedRoleModelId: string | null;
    setSelectedRoleModelId: (id: string | null) => void;
    isUploading: boolean;
    handleFiles: (files: File[]) => Promise<void>;
    onDeleteRoleModel: (id: string) => Promise<void>;
    handleEmulateRoleModel: (id: string) => void;
}

export const RoleModelSection: React.FC<RoleModelSectionProps> = ({
    roleModels,
    selectedRoleModelId,
    setSelectedRoleModelId,
    isUploading,
    handleFiles,
    onDeleteRoleModel,
    handleEmulateRoleModel
}) => {
    const [isDragging, setIsDragging] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (files.length > 0) {
            await handleFiles(files);
        }
    };

    const triggerUpload = () => {
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        input?.click();
    };

    if (selectedRoleModelId) {
        return (
            <RoleModelDetail
                roleModel={roleModels.find(rm => rm.id === selectedRoleModelId)!}
                onBack={() => setSelectedRoleModelId(null)}
                onDelete={(id) => {
                    onDeleteRoleModel(id);
                    setSelectedRoleModelId(null);
                }}
                onEmulate={handleEmulateRoleModel}
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center border-2 border-emerald-500/20">
                        <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-neutral-900 dark:text-white">Role Models</h2>
                        <p className="text-neutral-500 dark:text-neutral-400">Manage the career paths you're analyzing.</p>
                    </div>
                </div>
                <button
                    onClick={triggerUpload}
                    disabled={isUploading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
                >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isUploading ? 'Parsing...' : 'Upload PDF'}
                </button>
            </div>

            {roleModels.length === 0 ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative group max-w-2xl mx-auto transition-all duration-300 ${isDragging ? 'scale-[1.02]' : ''}`}
                >
                    {/* Decorative background elements */}
                    <div className={`absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 rounded-[4rem] blur-2xl transition-opacity duration-1000 ${isDragging ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} />

                    <div className={`relative overflow-hidden bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl rounded-[3rem] border p-12 text-center transition-all duration-500 hover:border-emerald-500/20 shadow-2xl shadow-emerald-500/5 ${isDragging ? 'border-emerald-500/50 bg-emerald-500/5 ring-4 ring-emerald-500/10' : 'border-neutral-200/50 dark:border-white/5'}`}>
                        {/* Abstract pattern decoration */}
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl" />

                        <div className="relative">
                            <div className={`w-24 h-24 bg-gradient-to-br from-white to-emerald-50 dark:from-neutral-800 dark:to-neutral-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl border border-neutral-100 dark:border-neutral-800 transition-all duration-500 ${isDragging ? 'scale-110 rotate-6' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
                                <Users className={`w-10 h-10 transition-all duration-500 ${isDragging ? 'text-emerald-500 scale-110' : 'text-emerald-600/40 dark:text-emerald-400/30 group-hover:text-emerald-500 group-hover:scale-110'}`} />
                                <div className="absolute -top-2 -right-2">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-400 blur-md opacity-40 animate-pulse" />
                                        <div className="relative bg-emerald-500 p-1.5 rounded-lg">
                                            <Sparkles className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-3xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                                {isDragging ? 'Drop to Ingest' : <>Analyze <span className="text-emerald-600 dark:text-emerald-400 italic">Patterns</span></>}
                            </h3>

                            <p className="max-w-md mx-auto text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed mb-10">
                                {isDragging
                                    ? 'Release to start distilling world-class career paths.'
                                    : 'Drop your LinkedIn export PDFs here (or multiple at once) to identify the skills and sequences that lead to your dream roles.'}
                            </p>

                            <button
                                onClick={triggerUpload}
                                disabled={isUploading}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group/btn"
                            >
                                <span>{isUploading ? 'Ingesting...' : 'Select Profiles'}</span>
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300" />}
                            </button>

                            <div className="mt-10 pt-8 border-t border-neutral-200/20 dark:border-white/5">
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">How to export LinkedIn Profile</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[11px] font-bold text-neutral-500">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                                        <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px]">1</span>
                                        Visit Profile
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                                        <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px]">2</span>
                                        Click "More"
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                                        <span className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px]">3</span>
                                        Save to PDF
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roleModels.map(rm => (
                        <EntityCard
                            key={rm.id}
                            title={rm.name}
                            subtitle={rm.headline}
                            description={rm.careerSnapshot}
                            tags={rm.topSkills.slice(0, 3)}
                            variant="role-model"
                            icon={<Users className="w-6 h-6" />}
                            onClick={() => setSelectedRoleModelId(rm.id)}
                            onDelete={() => onDeleteRoleModel(rm.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
