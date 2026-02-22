import React, { useState, useRef } from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { EventService } from '../../services/eventService';
import type { CustomSkill, RoleModelProfile, TargetJob, Transcript } from '../../types';
import { TRACKING_EVENTS } from '../../constants';

// Refactored Components
import { CoachHero } from './components/CoachHero';
import { RoleModelSection } from './components/RoleModelSection';
import { GapAnalysisSection } from './components/GapAnalysisSection';
import { RoleModelComparison } from './components/RoleModelComparison';
import { GrowthPage } from './components/GrowthPage';
import { useHeadlines } from '../../hooks/useHeadlines';
import { PageHeader } from '../../components/ui/PageHeader';
import type { ResumeProfile } from '../resume/types';
import type { CoachViewType } from './types';

interface CoachDashboardProps {
    userSkills: CustomSkill[];
    roleModels: RoleModelProfile[];
    targetJobs: TargetJob[];
    resumes: ResumeProfile[];
    transcript: Transcript | null;
    view: CoachViewType;
    onViewChange: (view: CoachViewType) => void;
    onAddRoleModel: (file: File) => Promise<void>;
    onAddTargetJob: (url: string) => Promise<void>;
    onUpdateTargetJob: (job: TargetJob) => Promise<void>;
    onEmulateRoleModel: (id: string) => void;
    onDeleteRoleModel: (id: string) => Promise<void>;
    onRunGapAnalysis: (targetJobId: string) => Promise<void>;
    onGenerateRoadmap: (targetJobId: string) => Promise<void>;
    onToggleMilestone: (targetJobId: string, milestoneId: string) => Promise<void>;
    activeAnalysisIds?: Set<string>;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({
    userSkills,
    roleModels,
    targetJobs,
    resumes,
    transcript,
    view,
    onAddRoleModel,
    onAddTargetJob,
    onUpdateTargetJob,
    onDeleteRoleModel,
    onRunGapAnalysis,
    onGenerateRoadmap,
    onToggleMilestone,
    onEmulateRoleModel,
    onViewChange,
    activeAnalysisIds = new Set()
}) => {
    // State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [selectedRoleModelId, setSelectedRoleModelId] = useState<string | null>(null);
    const [comparisonRoleModelId, setComparisonRoleModelId] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const [isScrapingUrl, setIsScrapingUrl] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeHeadline = useHeadlines('goal');

    // Handlers
    const handleFiles = async (files: File[]) => {
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadProgress({ current: 0, total: files.length });

        try {
            for (let i = 0; i < files.length; i++) {
                setUploadProgress(prev => ({ ...prev, current: i + 1 }));
                await onAddRoleModel(files[i]);
                EventService.trackUsage(TRACKING_EVENTS.COACH);
            }
        } finally {
            setIsUploading(false);
            setUploadProgress({ current: 0, total: 0 });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFiles(files);
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const handleTargetJobSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim() || isScrapingUrl) return;

        setIsScrapingUrl(true);
        setError(null);

        try {
            await onAddTargetJob(url);
            EventService.trackUsage('coach');
            setUrl('');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save dream job");
        } finally {
            setIsScrapingUrl(false);
        }
    };

    const handleEmulateRoleModel = (roleModelId: string) => {
        onEmulateRoleModel(roleModelId);
        setSelectedRoleModelId(null);
    };

    return (
        <SharedPageLayout maxWidth="full" animate={false} className="relative theme-coach" spacing="hero">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
            />

            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
            </div>

            {view === 'coach-home' && (
                <PageHeader
                    variant="hero"
                    title={activeHeadline.text}
                    highlight={activeHeadline.highlight}
                    subtitle="Distill career paths into your personalized growth roadmap."
                />
            )}

            {view === 'coach-home' && (
                <CoachHero
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    triggerUpload={triggerUpload}
                    handleTargetJobSubmit={handleTargetJobSubmit}
                    url={url}
                    setUrl={setUrl}
                    isScrapingUrl={isScrapingUrl}
                    error={error}
                    setError={setError}
                    roleModels={roleModels}
                    targetJobs={targetJobs}
                    userSkills={userSkills}
                    onViewChange={onViewChange}
                />
            )}

            {
                view === 'coach-role-models' && (
                    <RoleModelSection
                        roleModels={roleModels}
                        selectedRoleModelId={selectedRoleModelId}
                        setSelectedRoleModelId={setSelectedRoleModelId}
                        isUploading={isUploading}
                        onDeleteRoleModel={onDeleteRoleModel}
                        handleEmulateRoleModel={handleEmulateRoleModel}
                        onUpload={handleFiles}
                    />
                )
            }

            {
                view === 'coach-gap-analysis' && (
                    <GapAnalysisSection
                        targetJobs={targetJobs}
                        roleModels={roleModels}
                        transcript={transcript}
                        onUpdateTargetJob={onUpdateTargetJob}
                        onAddTargetJob={onAddTargetJob}
                        onRunGapAnalysis={onRunGapAnalysis}
                        onGenerateRoadmap={onGenerateRoadmap}
                        onToggleMilestone={onToggleMilestone}
                        onCompare={(id) => setComparisonRoleModelId(id)}
                        activeAnalysisIds={activeAnalysisIds}
                    />
                )
            }

            {
                view === 'career-growth' && (
                    <GrowthPage
                        targetJobs={targetJobs}
                        onToggleMilestone={onToggleMilestone}
                        onViewChange={onViewChange}
                    />
                )
            }

            {
                comparisonRoleModelId && resumes[0] && (
                    <RoleModelComparison
                        userProfile={resumes[0]}
                        roleModel={roleModels.find(rm => rm.id === comparisonRoleModelId)!}
                        onBack={() => setComparisonRoleModelId(null)}
                    />
                )
            }
        </SharedPageLayout >
    );
};
