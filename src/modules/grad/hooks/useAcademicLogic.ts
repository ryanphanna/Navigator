import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import type { Transcript, Course } from '../types';

export const useAcademicLogic = () => {
    const [transcript, setTranscript] = useLocalStorage<Transcript | null>('NAVIGATOR_TRANSCRIPT_CACHE', null);
    const [targetCredits, setTargetCredits] = useLocalStorage<number>('NAVIGATOR_TARGET_CREDITS', 20.0);
    const [tempTranscript, setTempTranscript] = useState<Transcript | null>(null);
    const [showVerification, setShowVerification] = useState(false);
    const [editingCourse, setEditingCourse] = useState<{
        semIndex: number;
        courseIndex: number;
        course: Course
    } | null>(null);

    const handleUploadComplete = useCallback((parsed: Transcript) => {
        setTempTranscript(parsed);
        setShowVerification(true);
    }, []);

    const handleVerificationSave = useCallback((verified: Transcript) => {
        setTranscript(verified);
        setTempTranscript(null);
    }, [setTranscript]);

    const handleCourseUpdate = useCallback((updated: Course) => {
        if (!transcript || !editingCourse) return;

        const newSemesters = transcript.semesters.map((sem, idx) => {
            if (idx !== editingCourse.semIndex) return sem;
            const newCourses = [...sem.courses];
            newCourses[editingCourse.courseIndex] = updated;
            return { ...sem, courses: newCourses };
        });

        setTranscript({ ...transcript, semesters: newSemesters });
        setEditingCourse(null);
    }, [transcript, editingCourse, setTranscript]);

    const handleCourseDelete = useCallback(() => {
        if (!transcript || !editingCourse) return;

        const newSemesters = transcript.semesters.map((sem, idx) => {
            if (idx !== editingCourse.semIndex) return sem;
            const newCourses = [...sem.courses];
            newCourses.splice(editingCourse.courseIndex, 1);
            return { ...sem, courses: newCourses };
        });

        setTranscript({ ...transcript, semesters: newSemesters });
        setEditingCourse(null);
    }, [transcript, editingCourse, setTranscript]);

    const totalCredits = useMemo(() => transcript
        ? transcript.semesters.reduce((acc, s) => acc + s.courses.reduce((cAcc, c) => cAcc + (c.credits || 0.5), 0), 0)
        : 0, [transcript]);

    const progressPercentage = useMemo(() => Math.min((totalCredits / targetCredits) * 100, 100), [totalCredits, targetCredits]);

    return {
        transcript,
        setTranscript,
        targetCredits,
        setTargetCredits,
        tempTranscript,
        showVerification,
        setShowVerification,
        editingCourse,
        setEditingCourse,
        handleUploadComplete,
        handleVerificationSave,
        handleCourseUpdate,
        handleCourseDelete,
        totalCredits,
        progressPercentage
    };
};
