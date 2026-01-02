import React, { useState, useEffect, useMemo } from 'react';
import { ServiceProfile, ServiceCategory } from '../../types';
import { serviceDirectory } from '../../services/ServiceDirectory';
import { ServiceRow } from './ServiceRow';
import { InfoTooltip } from '../market/InfoTooltip';
import { Search, Filter, X, Zap, Hammer, Truck, Scissors, Home, Sparkles, Wrench, Package, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Stats Header Component
const StatsHeader = ({ profiles }: { profiles: ServiceProfile[] }) => {
    const { t } = useTranslation();

    const stats = useMemo(() => {
        const now = Date.now();
        const active = profiles.filter(p => (now - p.lastSeenAny) < 4 * 60 * 60 * 1000).length; // < 4h
        const newProviders = profiles.filter(p => (now - p.services[0].evidenceCount < 5)).length; // simplistic "new" proxy or use firstSeen

        // Calculate Top Category
        const catCounts: Record<string, number> = {};
        profiles.forEach(p => {
            const cat = p.services[0].category;
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
        const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

        return { active, newProviders, topCat };
    }, [profiles]);

    return (
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500 mb-6 select-none">
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-emerald-500/50" />
                <span className="text-slate-400">{stats.active} Active</span>
            </div>
            <span className="text-slate-700">•</span>
            <div>
                <span className="text-slate-400">{stats.newProviders} New</span>
                <span className="text-slate-600 ml-1">(&lt;1h)</span>
            </div>
            {stats.topCat && (
                <>
                    <span className="text-slate-700">•</span>
                    <div>
                        <span className="text-slate-600">Top:</span>
                        <span className="text-indigo-400 ml-1">{stats.topCat[0]} ({stats.topCat[1]})</span>
                    </div>
                </>
            )}
        </div>
    );
};

// Filter Pill Component
const FilterPill = ({
    active,
    label,
    icon: Icon,
    onClick,
    onClear
}: {
    active: boolean;
    label: string;
    icon?: any;
    onClick: () => void;
    onClear?: (e: React.MouseEvent) => void;
}) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all group/pill
            ${active
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'}
        `}
    >
        {Icon && <Icon size={12} className={active ? 'text-indigo-100' : 'text-slate-500'} />}
        {label}
        {active && onClear && (
            <span
                onClick={(e) => { e.stopPropagation(); onClear(e); }}
                className="ml-1 hover:text-red-200 rounded-full p-0.5 hover:bg-white/20 transition-colors"
                title="Clear filter"
            >
                <X size={10} />
            </span>
        )}
    </button>
);

export const ServiceDirectoryView: React.FC = () => {
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState<ServiceProfile[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | undefined>();
    const [selectedServer, setSelectedServer] = useState<string | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadProfiles();
        const interval = setInterval(loadProfiles, 30000);
        return () => clearInterval(interval);
    }, [selectedCategory, selectedServer]);

    const loadProfiles = () => {
        const filter = {
            category: selectedCategory,
            server: selectedServer
        };
        const data = serviceDirectory.getProfiles(filter);
        setProfiles(data);
    };

    const filteredProfiles = profiles.filter(p =>
        p.nick.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Icon Mapping for Pills
    const getCategoryIcon = (cat: ServiceCategory) => {
        switch (cat) {
            case ServiceCategory.IMPING: return Hammer;
            case ServiceCategory.ENCHANTING: return Zap;
            case ServiceCategory.SMITHING: return Wrench;
            case ServiceCategory.LEATHERWORK: return Scissors;
            case ServiceCategory.TAILORING: return Scissors;
            case ServiceCategory.MASONRY: return Home;
            case ServiceCategory.LOGISTICS: return Truck;
            case ServiceCategory.OTHER: return Sparkles;
            default: return Package;
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            {/* Header Section */}
            <div className="mb-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-white tracking-tight">{t('service_directory.title')}</h1>
                        <InfoTooltip text={t('service_directory.title_tooltip')} />
                    </div>

                    {/* Search Input - Compact */}
                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('service_directory.search_placeholder')}
                            className="w-64 pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg 
                                       text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 
                                       focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Filter Pills - Scrollable container */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mask-linear-fade">
                    <FilterPill
                        active={!selectedCategory && !selectedServer}
                        label={t('service_directory.all_categories')}
                        onClick={() => { setSelectedCategory(undefined); setSelectedServer(undefined); }}
                    />

                    <div className="w-px h-4 bg-slate-800 mx-1 flex-shrink-0" /> {/* Divider */}

                    {/* Server Filter Pill (Only appears if selected) */}
                    {selectedServer && (
                        <>
                            <FilterPill
                                active={true}
                                label={`Server: ${selectedServer}`}
                                icon={Globe}
                                onClick={() => { }} // No-op, use clear X
                                onClear={() => setSelectedServer(undefined)}
                            />
                            <div className="w-px h-4 bg-slate-800 mx-1 flex-shrink-0" />
                        </>
                    )}

                    {Object.values(ServiceCategory).map(cat => (
                        <FilterPill
                            key={cat}
                            active={selectedCategory === cat}
                            label={cat}
                            icon={getCategoryIcon(cat)}
                            onClick={() => setSelectedCategory(cat)}
                        />
                    ))}
                </div>
            </div>

            {/* Stats Header (Dashboard/HUD) */}
            <StatsHeader profiles={profiles} />

            {/* Main List Content */}
            {filteredProfiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 pb-20">
                    <Filter size={48} className="text-slate-700 mb-4" />
                    <p className="text-slate-500 font-medium">{t('service_directory.empty_title')}</p>
                    <p className="text-slate-600 text-sm mt-1">{t('service_directory.empty_description')}</p>
                    <button
                        onClick={() => { setSelectedCategory(undefined); setSelectedServer(undefined); setSearchTerm(''); }}
                        className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm underline"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">

                        <div className="divide-y divide-indigo-500/5">
                            {filteredProfiles.map((profile, index) => (
                                <ServiceRow
                                    key={profile.nick}
                                    profile={profile}
                                    onServerClick={(srv) => setSelectedServer(srv)}
                                    style={{
                                        animation: `fadeIn 0.3s ease-out forwards`,
                                        animationDelay: `${Math.min(index * 0.03, 0.5)}s`, // Cap delay at 0.5s
                                        opacity: 0, // Start hidden for animation
                                        transform: 'translateY(4px)' // Start offset
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bottom padding for scroll */}
                    <div className="h-8" />
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
