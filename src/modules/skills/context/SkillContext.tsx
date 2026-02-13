import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CustomSkill } from '../../../types';
import { Storage } from '../../../services/storageService';
import { EventService } from '../../../services/eventService';

interface SkillContextType {
    skills: CustomSkill[];
    interviewSkill: string | null;
    isLoading: boolean;

    // Actions
    setInterviewSkill: (skill: string | null) => void;
    handleInterviewComplete: (proficiency: CustomSkill['proficiency'], evidence: string) => Promise<void>;
    updateSkills: (skills: CustomSkill[]) => void;
}

const SkillContext = createContext<SkillContextType | undefined>(undefined);

export const useSkillContext = () => {
    const context = useContext(SkillContext);
    if (!context) {
        throw new Error('useSkillContext must be used within a SkillProvider');
    }
    return context;
};

export const SkillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [skills, setSkills] = useState<CustomSkill[]>([]);
    const [interviewSkill, setInterviewSkill] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        Storage.getSkills().then(loadedSkills => {
            if (mounted) {
                setSkills(loadedSkills);
                setIsLoading(false);
            }
        });
        return () => { mounted = false; };
    }, []);

    const handleInterviewComplete = useCallback(async (proficiency: CustomSkill['proficiency'], evidence: string) => {
        if (!interviewSkill) return;

        const updatedSkill = await Storage.saveSkill({ name: interviewSkill, proficiency, evidence });
        EventService.trackUsage('keywords');
        setSkills(prev => {
            const exists = prev.some(s => s.name === interviewSkill);
            if (exists) {
                return prev.map(s => s.name === interviewSkill ? updatedSkill : s);
            }
            return [...prev, updatedSkill];
        });

        setInterviewSkill(null);
    }, [interviewSkill]);

    const updateSkills = useCallback((newSkills: CustomSkill[]) => {
        setSkills(newSkills);
        // Storage sync if needed? Usually we save individual updates.
    }, []);

    return (
        <SkillContext.Provider value={{
            skills,
            interviewSkill,
            isLoading,
            setInterviewSkill,
            handleInterviewComplete,
            updateSkills
        }}>
            {children}
        </SkillContext.Provider>
    );
};
