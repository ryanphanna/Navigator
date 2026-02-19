import React from 'react';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { SharedHeader } from '../../components/common/SharedHeader';
import { GPACalculator } from './GPACalculator';
import { useCoachContext } from '../career/context/CoachContext';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { ArrowLeft } from 'lucide-react';

export const GPACalculatorPage: React.FC = () => {
    const { transcript } = useCoachContext();

    return (
        <SharedPageLayout maxWidth="full" className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <Link to={ROUTES.EDUCATION_HOME} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Education
                    </Link>
                    <SharedHeader
                        title="GPA"
                        highlight="Calculator"
                        subtitle="Calculate your current GPA and forecast future performance scenarios."
                        theme="edu"
                    />
                </div>

                {transcript ? (
                    <GPACalculator transcript={transcript} />
                ) : (
                    <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Transcript Found</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 mb-6">Please upload your transcript to use the GPA Calculator.</p>
                        <Link
                            to={ROUTES.TRANSCRIPT}
                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Upload Transcript
                        </Link>
                    </div>
                )}
            </div>
        </SharedPageLayout>
    );
};
