import React from 'react';
import { Sparkles, FileText, Target, Zap, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
    isOpen: boolean;
    onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ isOpen, onContinue }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl mb-4 shadow-lg">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 mb-3">
                        JobFit
                    </h1>
                    <p className="text-xl text-slate-600">
                        Your AI-powered job application assistant
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                            <Target className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Analyze Job Fit</h3>
                        <p className="text-sm text-slate-600">
                            See how well your resume matches job requirements
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-violet-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Generate Cover Letters</h3>
                        <p className="text-sm text-slate-600">
                            Create tailored cover letters in seconds
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Get AI Feedback</h3>
                        <p className="text-sm text-slate-600">
                            Improve your applications with expert critiques
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onContinue}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
