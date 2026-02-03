import React, { useState, useEffect } from 'react';
import { Calculator, Target, TrendingUp, AlertCircle } from 'lucide-react';
import type { Transcript } from '../../types';

interface GPACalculatorProps {
    transcript: Transcript;
}

// Simple OMSAS / UofT Scale
// Normalization to 4.0 Scale (OMSAS/Ontario Standard)
const getGradePoint = (grade: string | number): number => {
    // 1. Handle Numeric Grades (Percentages or Scale points)
    if (typeof grade === 'number') {
        // York 9.0 Scale detection
        if (grade <= 9.0 && grade > 4.0) {
            // York 9-point scale to 4.0
            if (grade >= 9) return 4.0; // A+
            if (grade >= 8) return 3.8; // A
            if (grade >= 7) return 3.3; // B+
            if (grade >= 6) return 3.0; // B
            if (grade >= 5) return 2.3; // C+
            if (grade >= 4) return 2.0; // C
            if (grade >= 3) return 1.3; // D+
            if (grade >= 2) return 1.0; // D
            return 0.0;
        }

        // Standard 4.0 Scale
        if (grade <= 4.0) return grade;

        // Percentage (Humber / Standard) -> OMSAS 4.0
        if (grade >= 90) return 4.0; // A+
        if (grade >= 85) return 3.9; // A
        if (grade >= 80) return 3.7; // A-
        if (grade >= 77) return 3.3; // B+
        if (grade >= 73) return 3.0; // B
        if (grade >= 70) return 2.7; // B-
        if (grade >= 67) return 2.3; // C+
        if (grade >= 63) return 2.0; // C
        if (grade >= 60) return 1.7; // C-
        if (grade >= 57) return 1.3; // D+
        if (grade >= 53) return 1.0; // D
        if (grade >= 50) return 0.7; // D-
        return 0.0;
    }

    // 2. Handle String Grades (Letters)
    const g = grade.toUpperCase().trim();
    if (g === 'A+' || g === 'A*') return 4.0;
    if (g === 'A') return 3.8; // Conservative 3.8 (York A), vs 3.9 OMSAS
    if (g === 'A-') return 3.7;
    if (g === 'B+') return 3.3;
    if (g === 'B') return 3.0;
    if (g === 'B-') return 2.7;
    if (g === 'C+') return 2.3;
    if (g === 'C') return 2.0;
    if (g === 'C-') return 1.7;
    if (g === 'D+') return 1.3;
    if (g === 'D') return 1.0;
    if (g === 'D-') return 0.7;

    // Try parsing number from string "85%" or "85.5"
    const num = parseFloat(g.replace('%', ''));
    if (!isNaN(num)) return getGradePoint(num);

    return 0.0;
};

export const GPACalculator: React.FC<GPACalculatorProps> = ({ transcript }) => {
    const [stats, setStats] = useState<{ cGPA: number; totalCredits: number }>({ cGPA: 0, totalCredits: 0 });
    const [targetGPA, setTargetGPA] = useState<number>(4.0);
    const [remainingCredits, setRemainingCredits] = useState<number>(2.5); // Default ~5 courses
    const [requiredGPA, setRequiredGPA] = useState<number | null>(null);

    // Calculate Real Stats on Load
    useEffect(() => {
        let totalPoints = 0;
        let totalCredits = 0;

        transcript.semesters.forEach(sem => {
            sem.courses.forEach(c => {
                const points = getGradePoint(c.grade);
                // Assume standard credit weight of 0.5 if missing (standard semester course)
                const weight = c.credits || 0.5;

                // Only count graded courses (skip Pass/Fail or pending)
                if (c.grade && !c.grade.toLowerCase().includes('progress')) {
                    totalPoints += points * weight;
                    totalCredits += weight;
                }
            });
        });

        const calculatedGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
        setStats({
            cGPA: parseFloat(calculatedGPA.toFixed(2)),
            totalCredits
        });
    }, [transcript]);

    // Simulator Logic
    useEffect(() => {
        if (stats.totalCredits === 0) return;

        // Formula: (TargetAvg * FinalTotalCredits) - (CurrentAvg * CurrentCredits) / RemainingCredits
        // FinalTotalCredits = CurrentCredits + RemainingCredits

        const currentPoints = stats.cGPA * stats.totalCredits;
        const finalTotalCredits = stats.totalCredits + remainingCredits;
        const targetPoints = targetGPA * finalTotalCredits;

        const pointsNeeded = targetPoints - currentPoints;
        const avgNeeded = pointsNeeded / remainingCredits;

        setRequiredGPA(parseFloat(avgNeeded.toFixed(2)));
    }, [stats, targetGPA, remainingCredits]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">GPA Simulator</h3>
                    <p className="text-sm text-slate-500">Calculate what you need to hit your goals.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Stats */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="text-sm text-slate-500 mb-1">Current cGPA</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.cGPA}</div>
                    <div className="text-xs text-slate-400 mt-1">Based on {stats.totalCredits} credits</div>
                    <div className="mt-2 text-[10px] text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        Normalized to OMSAS 4.0 scale. Handles % (Humber) & Letters (York).
                    </div>
                </div>

                {/* Simulation Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Target Cumulative GPA
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0" max="4.0" step="0.01"
                                value={targetGPA}
                                onChange={(e) => setTargetGPA(parseFloat(e.target.value))}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                            <Target className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Remaining Credits
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0.5" max="20" step="0.5"
                                value={remainingCredits}
                                onChange={(e) => setRemainingCredits(parseFloat(e.target.value))}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                            <TrendingUp className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                </div>

                {/* Result */}
                <div className={`p-4 rounded-lg flex flex-col justify-center ${requiredGPA && requiredGPA > 4.0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                    requiredGPA && requiredGPA > 3.7 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
                        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    }`}>
                    <div className="text-sm font-medium mb-1 flex items-center gap-2">
                        Requires Average of:
                        {requiredGPA && requiredGPA > 4.0 && <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div className="text-3xl font-bold">
                        {requiredGPA ? requiredGPA : '---'}
                    </div>
                    <div className="text-xs opacity-80 mt-1">
                        {requiredGPA && requiredGPA > 4.0
                            ? "Impossible with standard grading."
                            : "Average needed in remaining courses."}
                    </div>
                </div>
            </div>
        </div>
    );
};
