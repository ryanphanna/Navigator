import { useState, useCallback } from 'react';
import {
    generateTailoredInterviewQuestions,
    generateGeneralBehavioralQuestions,
    analyzeInterviewResponse,
    generateFollowUp
} from '../../../services/ai/interviewAiService';
import type {
    InterviewQuestion,
    InterviewResponseAnalysis,
    SavedJob
} from '../types';
import type { ResumeProfile } from '../../resume/types';

export const useInterview = () => {
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, { response: string, analysis?: InterviewResponseAnalysis }>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadGeneralQuestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateGeneralBehavioralQuestions();
            setQuestions(result);
            setCurrentQuestionIndex(0);
            setResponses({});
        } catch (err: any) {
            setError(err.message || "Failed to load questions");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadTailoredQuestions = useCallback(async (job: SavedJob, resumes: ResumeProfile[]) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateTailoredInterviewQuestions(job.description, resumes, job.id, job.position);
            setQuestions(result);
            setCurrentQuestionIndex(0);
            setResponses({});
        } catch (err: any) {
            setError(err.message || "Failed to generate tailored questions");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitResponse = useCallback(async (questionId: string, responseText: string, job?: SavedJob) => {
        const questionIndex = questions.findIndex(q => q.id === questionId);
        const question = questions[questionIndex];

        if (!question) return;

        // 1. Save the response immediately
        setResponses(prev => ({
            ...prev,
            [questionId]: { response: responseText }
        }));

        setIsLoading(true);

        try {
            // 2. Parallel: Analyze the response AND check for follow-up (if not already a follow-up)
            // If it IS a follow-up, we don't ask another follow-up to prevent infinite loops.

            const analysisPromise = analyzeInterviewResponse(question.question, responseText, job?.description, job?.id);

            let followUpPromise: Promise<{ shouldFollowUp: boolean; question: string | null; rationale?: string }> | null = null;

            if (!question.isFollowUp) {
                // Only generate follow-up if this isn't already one
                followUpPromise = generateFollowUp(question.question, responseText, job?.description, job?.id);
            }

            const [analysis, followUpResult] = await Promise.all([
                analysisPromise,
                followUpPromise ? followUpPromise : Promise.resolve(null)
            ]);

            // 3. Save analysis
            setResponses(prev => ({
                ...prev,
                [questionId]: { response: responseText, analysis }
            }));

            // 4. Handle Follow-up Insertion
            if (followUpResult && followUpResult.shouldFollowUp && followUpResult.question) {
                const followUpQuestion: InterviewQuestion = {
                    id: crypto.randomUUID(),
                    question: followUpResult.question,
                    rationale: followUpResult.rationale || "Deepening the discussion based on your answer.",
                    category: question.category,
                    isFollowUp: true,
                    tips: "Be specific and address the follow-up directly."
                };

                // Insert the follow-up RIGHT AFTER the current question
                setQuestions(prev => {
                    const newQuestions = [...prev];
                    newQuestions.splice(questionIndex + 1, 0, followUpQuestion);
                    return newQuestions;
                });
            }

        } catch (err: any) {
            console.error("Failed to analyze response:", err);
        } finally {
            setIsLoading(false);
        }
    }, [questions]);

    const nextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [currentQuestionIndex, questions.length]);

    const prevQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }, [currentQuestionIndex]);

    return {
        questions,
        currentQuestionIndex,
        currentQuestion: questions[currentQuestionIndex],
        responses,
        isLoading,
        error,
        loadGeneralQuestions,
        loadTailoredQuestions,
        submitResponse,
        nextQuestion,
        prevQuestion,
        isLastQuestion: currentQuestionIndex === questions.length - 1,
        isFirstQuestion: currentQuestionIndex === 0,
        totalQuestions: questions.length
    };
};
