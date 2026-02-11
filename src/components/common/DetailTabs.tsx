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
    themeColor?: 'indigo' | 'emerald';
}

export const DetailTabs: React.FC<DetailTabsProps> = ({
    tabs,
    activeTab,
    onTabChange,
    themeColor = 'indigo'
}) => {
    const activeTextClass = themeColor === 'emerald'
        ? 'text-emerald-600'
        : 'text-indigo-600';

    const hoverTextClass = themeColor === 'emerald'
        ? 'hover:text-emerald-700'
        : 'hover:text-indigo-700';

    return (
        <div className="px-6 pb-6 pt-2 border-b border-neutral-200">
            <div className="flex p-1 bg-neutral-100/80 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                            ${activeTab === tab.id
                                ? `bg-white ${activeTextClass} shadow-sm ring-1 ring-neutral-200`
                                : `text-neutral-500 ${hoverTextClass} hover:bg-neutral-200/50`
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
