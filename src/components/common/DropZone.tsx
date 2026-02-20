import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface DropZoneProps {
    onUpload: (files: File[]) => Promise<void> | void;
    accept?: string;
    multiple?: boolean;
    title?: string;
    description?: string;
    isLoading?: boolean;
    loadingText?: string;
    error?: string | null;
    className?: string;
    themeColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
    variant?: 'hero' | 'card' | 'compact';
    children?: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({
    onUpload,
    accept = '.pdf',
    multiple = false,
    title = 'Upload File',
    description = 'Drag & drop or click to browse',
    isLoading = false,
    loadingText = 'Processing...',
    error,
    className = '',
    themeColor = 'indigo',
    variant = 'hero',
    children
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const themes = {
        indigo: 'border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5 text-indigo-600',
        emerald: 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-500/5 text-emerald-600',
        amber: 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-500/5 text-amber-600',
        rose: 'border-rose-500/50 bg-rose-50/30 dark:bg-rose-500/5 text-rose-600',
        slate: 'border-neutral-500/50 bg-neutral-50/30 dark:bg-neutral-500/5 text-neutral-600'
    };

    const iconColors = {
        indigo: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
        emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
        rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
        slate: 'bg-neutral-100 dark:bg-neutral-500/20 text-neutral-600 dark:text-neutral-400'
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isLoading) setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (isLoading) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) await onUpload(files);
    };

    const isCompact = variant === 'compact';
    const isHero = variant === 'hero';

    return (
        <div
            className={`relative group transition-all duration-500 flex flex-col h-full ${isDragging ? 'scale-[1.01]' : ''} ${className}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={(e) => onUpload(Array.from(e.target.files || []))}
                disabled={isLoading}
            />

            <div className={`
                relative transition-all duration-500 cursor-pointer overflow-hidden flex flex-col flex-1 h-full
                ${variant === 'hero' ? 'p-12 rounded-[3.5rem]' : 'p-8 rounded-[2.5rem]'}
                ${variant === 'compact' ? 'p-6 rounded-[2rem]' : ''}
                border-2 border-dashed
                ${isDragging
                    ? themes[themeColor]
                    : 'border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm hover:shadow-xl hover:shadow-neutral-200/20 dark:hover:shadow-black/20'
                }
            `}>
                <div className={`flex flex-col items-center text-center flex-1 h-full w-full`}>
                    <div className={`flex-1 flex flex-col items-center justify-center w-full ${isCompact ? 'space-y-4' : 'space-y-6'} mb-6`}>
                        {isLoading ? (
                            <div className={`${isCompact ? 'w-12 h-12 rounded-2xl' : 'w-20 h-20 rounded-3xl'} ${iconColors[themeColor]} flex items-center justify-center animate-pulse`}>
                                <Loader2 className={`${isCompact ? 'w-6 h-6' : 'w-10 h-10'} animate-spin`} />
                            </div>
                        ) : (
                            <div className={`
                                ${isCompact ? 'w-12 h-12 rounded-2xl' : 'w-20 h-20 rounded-3xl'} 
                                transition-all duration-500 flex items-center justify-center 
                                ${isDragging
                                    ? iconColors[themeColor]
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-white dark:group-hover:bg-neutral-700 shadow-sm'
                                }
                            `}>
                                <Upload className={isCompact ? 'w-6 h-6' : 'w-10 h-10'} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <h3 className={`font-black tracking-tight text-neutral-900 dark:text-white ${isHero ? 'text-2xl' : 'text-xl'} ${isCompact ? 'text-lg' : ''}`}>
                                {isLoading ? loadingText : title}
                            </h3>
                            {description && (
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium max-w-xs mx-auto leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>

                        {!isLoading && !isCompact && (
                            <div className="flex items-center gap-3 pt-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:bg-white dark:group-hover:bg-neutral-700 transition-colors">
                                    <FileText className="w-3.5 h-3.5" />
                                    {accept.replace(/\./g, '').split(',')[0].toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>

                    {children && (
                        <div className="w-full mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800/50" onClick={(e) => e.stopPropagation()}>
                            {children}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/50 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};
