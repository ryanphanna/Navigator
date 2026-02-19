import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface DetailTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    themeColor?: 'accent' | 'neutral';
}

export const DetailTabs: React.FC<DetailTabsProps> = ({
    tabs,
    activeTab,
    onTabChange,
}) => {
    return (
        <div className="px-6 pb-6 pt-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex p-1 bg-neutral-100/80 dark:bg-neutral-800/80 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2
                            ${activeTab === tab.id
                                ? `bg-white dark:bg-neutral-700 text-accent-primary-hex shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-600`
                                : `text-neutral-500 hover:text-accent-primary-hex hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50`
                            }
                        `}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
