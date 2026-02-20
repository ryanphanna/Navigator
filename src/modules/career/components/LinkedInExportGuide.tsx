import { Search, FileDown, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { DropZone } from '../../../components/common/DropZone';

interface LinkedInExportGuideProps {
    onUpload: (files: File[]) => void;
    onViewSteps: () => void;
    isUploading: boolean;
}

export const LinkedInExportGuide: React.FC<LinkedInExportGuideProps> = ({
    onUpload,
    onViewSteps,
    isUploading
}) => {
    return (
        <div className="animate-in zoom-in-95 duration-500 overflow-hidden relative -mt-8 -mx-4 sm:-mx-6 px-4 sm:px-6 py-20 min-h-[calc(100vh-12rem)]">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 -left-24 w-96 h-96 bg-emerald-500/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-teal-500/10 blur-[150px] rounded-full" />

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                        Map the <span className="text-emerald-600">Unseen Path</span>
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium text-lg max-w-2xl mx-auto">
                        Turn any career journey into your personal blueprint. Follow these three steps to ingest a mentor's profile.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    {/* Card 1: Identify */}
                    {/* ... (Identify Card content remains the same) ... */}
                    <div className="group relative flex flex-col p-8 md:p-10 rounded-[3rem] bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-white dark:border-neutral-800 shadow-xl shadow-neutral-200/20 dark:shadow-black/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2">
                        <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                            <Search className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full space-y-8">
                            <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] w-fit shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
                                <Search className="w-6 h-6" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Identify</h3>
                                <p className="text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                                    Find a Mentor or Role Model on LinkedIn whose career path you want to study or emulate.
                                </p>
                            </div>
                            <ul className="space-y-3 pt-4">
                                {['Target Titles', 'Desired Companies', 'Career Path Peaks'].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-xs font-bold text-neutral-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Card 2: Distill */}
                    {/* ... (Distill Card content remains the same) ... */}
                    <div className="group relative flex flex-col p-8 md:p-10 rounded-[3rem] bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-white dark:border-neutral-800 shadow-xl shadow-neutral-200/20 dark:shadow-black/50 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-2">
                        <div className="absolute top-0 right-0 p-8 text-teal-500/10 group-hover:text-teal-500/20 transition-colors">
                            <FileDown className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full space-y-8">
                            <div className="p-4 bg-teal-600 text-white rounded-[1.5rem] w-fit shadow-xl shadow-teal-500/30 group-hover:scale-110 transition-transform duration-500">
                                <FileDown className="w-6 h-6" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Distill</h3>
                                <p className="text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                                    On their profile, click <span className="text-neutral-900 dark:text-white font-bold">More</span> → <span className="text-neutral-900 dark:text-white font-bold">Save to PDF</span>. This captures their full journey.
                                </p>
                            </div>
                            <button
                                onClick={onViewSteps}
                                className="mt-auto group/help flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors"
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span>See exact steps</span>
                                <ChevronRight className="w-3 h-3 group-hover/help:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Card 3: Analyze (REPLACED WITH DROPZONE) */}
                    <DropZone
                        onUpload={onUpload}
                        accept=".pdf"
                        title="Analyze"
                        description="Drop their LinkedIn PDF to begin analyzing their blueprint."
                        loadingText="Distilling..."
                        isLoading={isUploading}
                        themeColor="emerald"
                        variant="card"
                        className="h-full"
                    >
                        <div className="flex flex-col items-center">
                            <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] w-fit shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-500 mb-6">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 text-center">
                                Safe & Anonymous Analysis
                            </p>
                        </div>
                    </DropZone>
                </div>
            </div>
        </div>
    );
};
