import React, { useState, useMemo } from 'react';
import { ServiceProfile, ServiceCategory } from '../../types';
import { User, ChevronDown, ChevronUp, Hammer, Zap, Package, Scissors, Home, Sparkles, Truck, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ServiceRowProps {
    profile: ServiceProfile;
    style?: React.CSSProperties; // For staggered animation
}

// Category icon mapping for visual recognition
const getCategoryIcon = (category: ServiceCategory) => {
    const iconProps = { size: 14, className: "flex-shrink-0" };
    switch (category) {
        case ServiceCategory.IMPING: return <Hammer {...iconProps} />;
        case ServiceCategory.ENCHANTING: return <Zap {...iconProps} />;
        case ServiceCategory.SMITHING: return <Wrench {...iconProps} />;
        case ServiceCategory.LEATHERWORK: return <Scissors {...iconProps} />;
        case ServiceCategory.TAILORING: return <Scissors {...iconProps} />;
        case ServiceCategory.MASONRY: return <Home {...iconProps} />;
        case ServiceCategory.LOGISTICS: return <Truck {...iconProps} />;
        case ServiceCategory.OTHER: return <Sparkles {...iconProps} />;
        default: return <Package {...iconProps} />;
    }
};

// Deterministic Avatar Color (Hash -> Hue)
const getAvatarColor = (nick: string) => {
    let hash = 0;
    for (let i = 0; i < nick.length; i++) {
        hash = nick.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 50%)`; // Keep Saturation 60%, Lightness 50% for consistency
};

export const ServiceRow: React.FC<ServiceRowProps> = ({ profile, style }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    const primaryService = profile.services.reduce((best, current) =>
        current.score > best.score ? current : best
        , profile.services[0]);

    // SEMANTIC COLOR: Time-based
    const getActivityBarColor = (lastSeen: number) => {
        const hours = (Date.now() - lastSeen) / (1000 * 60 * 60);
        if (hours <= 12) return 'from-emerald-500 to-emerald-400';
        if (hours <= 48) return 'from-amber-500 to-amber-400';
        return 'from-blue-500 to-blue-400';
    };

    const getStatusDotColor = (lastSeen: number) => {
        const hours = (Date.now() - lastSeen) / (1000 * 60 * 60);
        if (hours <= 12) return 'bg-emerald-500 shadow-emerald-500/50';
        if (hours <= 48) return 'bg-amber-500 shadow-amber-500/50';
        return 'bg-blue-500 shadow-blue-500/30';
    };

    const getTimeAgo = (timestamp: number) => {
        const hours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
        if (hours < 1) return t('service_directory.time_just_now');
        if (hours < 24) return t('service_directory.time_hours_ago', { hours });
        const days = Math.floor(hours / 24);
        if (days === 1) return t('service_directory.time_yesterday');
        return t('service_directory.time_days_ago', { days });
    };

    const getTimeColor = (timestamp: number) => {
        const hours = (Date.now() - timestamp) / (1000 * 60 * 60);
        if (hours <= 12) return 'text-emerald-400';
        if (hours <= 168) return 'text-amber-400';
        return 'text-slate-500';
    };

    // Server Badges
    const getServerBadgeStyle = (server: string) => {
        const s = server.toLowerCase().substring(0, 3);
        if (s === 'cad') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
        if (s === 'har') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (s === 'mel') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        return 'bg-slate-700/30 text-slate-400 border-slate-700/50';
    };

    const getServerChip = (server: string) => {
        return server.substring(0, 3).toUpperCase();
    };

    const hasMultipleServices = profile.services.length > 1;
    const avatarColor = useMemo(() => getAvatarColor(profile.nick), [profile.nick]);

    return (
        <div className="group" style={style}>
            <div
                className="flex items-center gap-3 px-3 py-2.5 
                           border-b border-indigo-500/8
                           hover:bg-indigo-500/5 hover:border-l-2 hover:border-l-indigo-500/50
                           transition-all cursor-pointer relative"
                onClick={() => hasMultipleServices && setIsExpanded(!isExpanded)}
                title={`${profile.nick} - ${getTimeAgo(profile.lastSeenAny)}`}
            >
                {/* Avatar - Deterministic Color */}
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm transition-shadow"
                    style={{ backgroundColor: avatarColor }}
                >
                    <span className="text-white font-bold text-xs opacity-90">
                        {profile.nick.substring(0, 2).toUpperCase()}
                    </span>
                </div>

                {/* Name + Server Chip */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-white font-semibold text-sm truncate group-hover:text-indigo-300 transition-colors">
                        {profile.nick}
                    </span>
                    {/* Server badge */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getServerBadgeStyle(profile.server)} 
                                     font-mono uppercase tracking-wider flex-shrink-0`}>
                        {getServerChip(profile.server)}
                    </span>
                </div>

                {/* Primary Service with Icon */}
                <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
                    <span className="text-slate-400">
                        {getCategoryIcon(primaryService.category)}
                    </span>
                    <span className="text-sm text-slate-300 truncate">
                        {primaryService.category}
                    </span>
                </div>

                {/* Activity Bar with Percentage Tooltip */}
                <div className="relative group/bar flex-shrink-0">
                    <div className="w-20 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getActivityBarColor(primaryService.lastSeen)} transition-all`}
                            style={{ width: `${primaryService.score * 100}%` }}
                        />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 
                                    bg-slate-900 border border-slate-700 rounded px-2 py-1
                                    text-xs text-white font-mono whitespace-nowrap
                                    opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none
                                    shadow-lg z-10">
                        {Math.round(primaryService.score * 100)}%
                    </div>
                </div>

                {/* Time */}
                <div className={`text-[11px] w-16 text-right flex-shrink-0 font-medium ${getTimeColor(profile.lastSeenAny)}`}>
                    {getTimeAgo(profile.lastSeenAny)}
                </div>

                {/* Status Dot */}
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(profile.lastSeenAny)} 
                                 animate-pulse flex-shrink-0`}
                    title={getTimeAgo(profile.lastSeenAny)} />

                {/* Expand Icon */}
                {hasMultipleServices && (
                    <div className="text-slate-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                )}
            </div>

            {/* Expanded View */}
            {isExpanded && hasMultipleServices && (
                <div className="bg-slate-900/20 px-3 py-2.5 border-b border-indigo-500/8 pl-14">
                    <div className="flex flex-wrap gap-2">
                        {profile.services
                            .filter(s => s.category !== primaryService.category)
                            .map((service, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/40 
                                               rounded-md border border-slate-700/30 hover:border-indigo-500/30 transition-colors"
                                >
                                    <span className="text-slate-400">
                                        {getCategoryIcon(service.category)}
                                    </span>
                                    <span className="text-xs text-slate-300">{service.category}</span>
                                    <div className="w-12 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${getActivityBarColor(service.lastSeen)}`}
                                            style={{ width: `${service.score * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {Math.round(service.score * 100)}%
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};
