import React, { useState } from 'react';
import { parseTranscript } from '../../services/geminiService';
import type { Transcript } from '../../types';
import { FileUploader } from '../../components/common/FileUploader';

interface TranscriptUploadProps {
    onUploadComplete: (transcript: Transcript) => void;
}

export const TranscriptUpload: React.FC<TranscriptUploadProps> = ({ onUploadComplete }) => {
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];

        // Basic validation (FileUploader also does some based on accept, but good to be safe)
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
                } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Failed to parse transcript');
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

    return (
        <div className="w-full max-w-2xl mx-auto">
            <FileUploader
                onUpload={handleUpload}
                accept=".pdf"
                title="Upload Transcript"
                description="Drag & drop your PDF here or click to browse"
                loadingText="Analyzing Transcript..."
                isLoading={isParsing}
                error={error}
                variant="compact"
            />
        </div>
    );
};
