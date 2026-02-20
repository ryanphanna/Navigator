import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Storage } from '../services/storageService';
import { getDeviceFingerprint } from '../utils/fingerprint';

import type { UserTier } from '../types';

interface UserContextType {
    user: User | null;
    userTier: UserTier;
    actualTier: UserTier; // Real tier from DB
    isTester: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    signOut: () => Promise<void>;
    setSimulatedTier: (tier: UserTier | null) => void; // Admin-only: simulate viewing as different tier
    simulatedTier: UserTier | null;
    updateProfile: (updates: Partial<{ first_name: string; last_name: string; device_id: string; journey: string }>) => Promise<void>;
    journey: string; // User's onboarding journey stage (student, job-hunter, etc.)
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [actualTier, setActualTier] = useState<UserTier>('free');
    const [simulatedTier, setSimulatedTier] = useState<UserTier | null>(null);
    const [isTester, setIsTester] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [journey, setJourney] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('navigator_user_journey') || 'job-hunter';
        }
        return 'job-hunter';
    });
    const [isLoading, setIsLoading] = useState(true);

    // The tier used by the app - simulated if set by admin, otherwise actual
    const userTier = simulatedTier ?? actualTier;

    const processUser = async (currentUser: User | null) => {
        setUser(currentUser);
        if (currentUser) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('subscription_tier, is_admin, is_tester')
                    .eq('id', currentUser.id)
                    .single();

                if (data && !error) {
                    const tier = data.subscription_tier as UserTier;
                    setActualTier(data.is_admin ? 'admin' : tier);
                    setIsAdmin(data.is_admin || false);
                    setIsTester(data.is_tester || false);

                    // If they have an account, they've implicitly accepted privacy/terms
                    // Sync this to localStorage to prevent redundant redirects
                    localStorage.setItem('navigator_privacy_accepted', 'true');

                    if ((data as any).journey) {
                        setJourney((data as any).journey);
                        localStorage.setItem('navigator_user_journey', (data as any).journey);
                    }

                    // Abuse Prevention: Sync device fingerprint
                    getDeviceFingerprint().then(fingerprint => {
                        if (data && (data as any).device_id !== fingerprint) {
                            supabase.from('profiles').update({ device_id: fingerprint }).eq('id', currentUser.id).then(({ error: syncError }) => {
                                if (syncError) {
                                    // Handle missing column gracefully - don't log as error if it's just a missing column
                                    if (syncError.code === 'PGRST204' || syncError.message?.includes('device_id')) {
                                        console.warn("Device fingerprinting skipped: 'device_id' column not found in profiles Table.");
                                    } else {
                                        console.error("Failed to sync device fingerprint", syncError);
                                    }
                                }
                            });
                        }
                    });
                } else if (error) {
                    if (import.meta.env.DEV) {
                        console.error('Error fetching user profile:', error);
                    }
                }
            } catch (err) {
                if (import.meta.env.DEV) {
                    console.error('Error fetching user profile:', err);
                }
            }
        } else {
            setActualTier('free');
            setIsTester(false);
            setIsAdmin(false);
            setSimulatedTier(null); // Clear simulation on logout
        }
        setIsLoading(false);
    };

    useEffect(() => {
        // Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            processUser(session?.user ?? null);
        });

        // Auth Change Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            processUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        // 1. Clear physical Storage
        await Storage.clearAllData();

        // 2. Sign out from Supabase
        await supabase.auth.signOut();

        // 3. Force hard reload to homepage to clear React memory
        window.location.href = '/';
    };

    const updateProfile = async (updates: Partial<{ first_name: string; last_name: string; device_id: string; journey: string }>) => {
        if (!user) {
            // If not logged in, just update local state/storage
            if (updates.journey) {
                setJourney(updates.journey);
                localStorage.setItem('navigator_user_journey', updates.journey);
            }
            return;
        }

        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
        if (error) {
            // Handle missing column gracefully in manual updates too
            if (error.code === 'PGRST204' || error.message?.includes('device_id')) {
                console.warn("Profile update partially skipped: some columns (like 'device_id') might be missing in DB.");
            } else {
                console.error("Failed to update profile context", error);
            }
        } else {
            if (updates.journey) {
                setJourney(updates.journey);
                localStorage.setItem('navigator_user_journey', updates.journey);
            }
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            userTier,
            actualTier,
            isTester,
            isAdmin,
            isLoading,
            signOut,
            simulatedTier,
            setSimulatedTier,
            updateProfile,
            journey
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
