import React, { useState } from 'react';
import { Users, Plus, Loader2 } from 'lucide-react';
import { EntityCard } from '../../../components/common/EntityCard';
import { RoleModelDetail } from '../RoleModelDetail';
import type { RoleModelProfile } from '../../../types';
import { LinkedInExportGuide } from './LinkedInExportGuide';
import { LinkedInExportSteps } from './LinkedInExportSteps';

interface RoleModelSectionProps {
    roleModels: RoleModelProfile[];
    selectedRoleModelId: string | null;
    setSelectedRoleModelId: (id: string | null) => void;
    isUploading: boolean;
    onDeleteRoleModel: (id: string) => Promise<void>;
    handleEmulateRoleModel: (id: string) => void;
    onUpload: (files: File[]) => void;
}

export const RoleModelSection: React.FC<RoleModelSectionProps> = ({
    roleModels,
    selectedRoleModelId,
    setSelectedRoleModelId,
    isUploading,
    onDeleteRoleModel,
    handleEmulateRoleModel,
    onUpload
}) => {
    const [showSteps, setShowSteps] = useState(false);

    // Helper to trigger the hidden file input (for the header button)
    // Note: This relies on the parent CoachDashboard rendering an input[type="file"] first in the DOM order.
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
        <div className="w-full max-w-7xl mx-auto px-6 space-y-6 animate-in fade-in duration-500">
            {roleModels.length > 0 && (
                <div className="flex items-center justify-between mb-10 max-w-4xl mx-auto">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center border-2 border-emerald-500/20">
                            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-neutral-900 dark:text-white">Role Models</h2>
                            <p className="text-neutral-500 dark:text-neutral-400">Manage the career paths you're studying.</p>
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
            )}

            {roleModels.length === 0 ? (
                <LinkedInExportGuide
                    onUpload={onUpload}
                    onViewSteps={() => setShowSteps(true)}
                    isUploading={isUploading}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
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

            <LinkedInExportSteps
                isOpen={showSteps}
                onClose={() => setShowSteps(false)}
            />
        </div>
    );
};
