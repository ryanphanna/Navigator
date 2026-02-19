import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';

export interface FileUploaderProps {
    onUpload: (files: File[]) => Promise<void> | void;
    accept?: string;
    multiple?: boolean;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    isLoading?: boolean;
    loadingText?: string;
    variant?: 'hero' | 'compact' | 'modal';
    error?: string | null;
    className?: string;
    disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    onUpload,
    accept = '.pdf',
    multiple = false,
    title = 'Upload File',
    description = 'Drag & drop or click to browse',
    icon,
    isLoading = false,
    loadingText = 'Uploading...',
    variant = 'hero',
    error,
    className = '',
    disabled = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            await onUpload(files);
        }
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isLoading && !disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (isLoading || disabled) return;

        const files = Array.from(e.dataTransfer.files);
        // Basic client-side filter based on accept prop (simple check)
        const validFiles = files.filter(file => {
            if (!accept) return true;
            const acceptedTypes = accept.split(',').map(s => s.trim());
            return acceptedTypes.some(type => {
                if (type.startsWith('.')) {
                    return file.name.toLowerCase().endsWith(type.toLowerCase());
                }
                return file.type.match(new RegExp(type.replace('*', '.*')));
            });
        });

        if (validFiles.length > 0) {
            await onUpload(validFiles);
        }
    };

    const triggerUpload = () => {
        if (!isLoading && !disabled) {
            fileInputRef.current?.click();
        }
    };

    // Styling logic based on variant
    const getContainerStyles = () => {
        const baseStyles = "relative transition-all duration-300 cursor-pointer overflow-hidden";

        switch (variant) {
            case 'hero':
                return `
                    ${baseStyles}
                    border-2 border-dashed rounded-[2rem] p-12 text-center
                    ${isDragging
                        ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-xl shadow-indigo-500/10'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }
                `;
            case 'compact': // Similar to TranscriptUpload
                return `
                    ${baseStyles}
                    border-2 border-dashed rounded-xl p-8 text-center
                    ${isDragging
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]'
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }
                `;
            case 'modal': // Similar to Resume Modal
                return `
                    ${baseStyles}
                    border-2 border-dashed rounded-xl p-8
                    ${isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-neutral-200 hover:border-indigo-400 hover:bg-neutral-50'
                    }
                `;
            default:
                return baseStyles;
        }
    };

    return (
        <div
            className={`${getContainerStyles()} ${isLoading || disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerUpload}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                disabled={isLoading || disabled}
            />

            {/* Background Effects for Hero Variant */}
            {variant === 'hero' && isDragging && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
            )}

            <div className="relative z-10 flex flex-col items-center gap-4">
                {isLoading ? (
                    <>
                        <div className={`rounded-full flex items-center justify-center animate-pulse ${variant === 'hero' ? 'w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30' : 'w-16 h-16 bg-indigo-50'}`}>
                            <Loader2 className={`${variant === 'hero' ? 'w-10 h-10' : 'w-8 h-8'} text-indigo-600 animate-spin`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{loadingText}</h3>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`
                            rounded-full flex items-center justify-center transition-transform duration-500
                            ${variant === 'hero' ? 'w-20 h-20' : 'w-16 h-16'}
                            ${isDragging
                                ? 'bg-indigo-100 text-indigo-600 scale-110'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:scale-105'
                            }
                        `}>
                            {icon || <Upload className={variant === 'hero' ? 'w-10 h-10' : 'w-8 h-8'} />}
                        </div>

                        <div className="space-y-1 text-center">
                            <h3 className={`font-semibold text-neutral-900 dark:text-white ${variant === 'hero' ? 'text-xl' : 'text-lg'}`}>
                                {title}
                            </h3>
                            <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                                {description}
                            </p>
                        </div>

                        {(variant === 'compact' || variant === 'modal') && (
                            <div className="flex gap-4 text-xs text-neutral-400 mt-2">
                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {accept.replace(/\./g, '').toUpperCase()}</span>
                                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Private</span>
                            </div>
                        )}
                    </>
                )}

                {error && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
