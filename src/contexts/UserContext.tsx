import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface UserContextType {
    user: User | null;
    userTier: 'free' | 'pro' | 'admin';
    isTester: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userTier, setUserTier] = useState<'free' | 'pro' | 'admin'>('free');
    const [isTester, setIsTester] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
                    setUserTier(data.subscription_tier as 'free' | 'pro' | 'admin');
                    setIsAdmin(data.is_admin || false);
                    setIsTester(data.is_tester || false);

                    // Sync tier for admin convenience
                    if (data.is_admin) {
                        setUserTier('admin');
                    }
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
            }
        } else {
            setUserTier('free');
            setIsTester(false);
            setIsAdmin(false);
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
        setUserTier('free');
        setIsAdmin(false);
        setIsTester(false);
    };

    return (
        <UserContext.Provider value={{ user, userTier, isTester, isAdmin, isLoading, signOut }}>
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
