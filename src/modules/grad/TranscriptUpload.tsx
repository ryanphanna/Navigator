import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
import { parseTranscript } from '../../services/geminiService';
import type { Transcript } from '../../types';

interface TranscriptUploadProps {
    onUploadComplete: (transcript: Transcript) => void;
}

export const TranscriptUpload: React.FC<TranscriptUploadProps> = ({ onUploadComplete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.includes('pdf')) {
            setError('Please upload a PDF transcript.');
            return;
        }

        setIsParsing(true);
        setError(null);

        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                try {
                    const transcript = await parseTranscript(base64, file.type);
                    onUploadComplete(transcript);
                } catch (err: any) {
                    setError(err.message || 'Failed to parse transcript');
                } finally {
                    setIsParsing(false);
                }
            };
            reader.onerror = () => {
                setError('Failed to read file');
                setIsParsing(false);
            };
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'An unexpected error occurred');
            setIsParsing(false);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !isParsing && fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                    ${isDragging
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]'
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }
                    ${isParsing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    disabled={isParsing}
                />

                <div className="flex flex-col items-center gap-4">
                    {isParsing ? (
                        <>
                            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center animate-pulse">
                                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Analyzing Transcript...</h3>
                                <p className="text-neutral-500 dark:text-neutral-400">Extracting courses, grades, and GPA</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                                <Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                    Upload Transcript
                                </h3>
                                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                                    Drag & drop your PDF here, or click to browse
                                </p>
                            </div>
                            <div className="flex gap-4 text-xs text-neutral-400">
                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF only</span>
                                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Encrypted & Private</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
                </div>
            )}
        </div>
    );
};
