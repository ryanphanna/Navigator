import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [actualTier, setActualTier] = useState<UserTier>('free');
    const [simulatedTier, setSimulatedTier] = useState<UserTier | null>(null);
    const [isTester, setIsTester] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
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
                } else if (error) {
                    console.error('Error fetching user profile:', error);
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
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
        await supabase.auth.signOut();
        setUser(null);
        setActualTier('free');
        setIsAdmin(false);
        setIsTester(false);
        setSimulatedTier(null);
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
            setSimulatedTier
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
