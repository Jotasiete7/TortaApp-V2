import React, { useState } from 'react';
import { ServiceProfile, ServiceCategory } from '../../types';
import { User, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ServiceRowProps {
    profile: ServiceProfile;
}

export const ServiceRow: React.FC<ServiceRowProps> = ({ profile }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    const primaryService = profile.services.reduce((best, current) =>
        current.score > best.score ? current : best
        , profile.services[0]);

    // SEMANTIC COLOR: Time-based, not arbitrary
    const getActivityBarColor = (lastSeen: number) => {
        const hours = (Date.now() - lastSeen) / (1000 * 60 * 60);
        if (hours <= 12) return 'from-emerald-500 to-emerald-400'; // Green = Fresh (0-12h)
        if (hours <= 48) return 'from-amber-500 to-amber-400';     // Yellow = Recent (12-48h)
        return 'from-blue-500 to-blue-400';                        // Blue = Historical (2-7d)
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

    // Server abbreviation (Cadence → Cad, Harmony → Har, etc.)
    const getServerChip = (server: string) => {
        return server.substring(0, 3).toUpperCase();
    };

    const hasMultipleServices = profile.services.length > 1;

    return (
        <div className="group">
            <div
                className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-800/50 
                           hover:bg-slate-800/30 transition-all cursor-pointer"
                onClick={() => hasMultipleServices && setIsExpanded(!isExpanded)}
                title={`${profile.nick} - ${getTimeAgo(profile.lastSeenAny)}`}
            >
                {/* Avatar - Compact */}
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 
                                rounded-md flex items-center justify-center flex-shrink-0
                                shadow-sm group-hover:shadow-indigo-500/30 transition-shadow">
                    <User size={14} className="text-white" />
                </div>

                {/* Name + Server Chip */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-white font-medium text-sm truncate group-hover:text-indigo-400 transition-colors">
                        {profile.nick}
                    </span>
                    {/* Server as minimal chip */}
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/40 rounded text-slate-500 
                                     font-mono uppercase tracking-wider flex-shrink-0">
                        {getServerChip(profile.server)}
                    </span>
                </div>

                {/* Primary Service */}
                <div className="text-sm text-slate-300 w-28 truncate flex-shrink-0">
                    {primaryService.category}
                </div>

                {/* Activity Bar - SEMANTIC (color = time, length = score) */}
                <div className="w-20 h-1.5 bg-slate-800/50 rounded-full overflow-hidden flex-shrink-0"
                    title={`Activity: ${Math.round(primaryService.score * 100)}%`}>
                    <div
                        className={`h-full bg-gradient-to-r ${getActivityBarColor(primaryService.lastSeen)} transition-all`}
                        style={{ width: `${primaryService.score * 100}%` }}
                    />
                </div>

                {/* Time - Compact */}
                <div className="text-[11px] text-slate-500 w-16 text-right flex-shrink-0 font-medium">
                    {getTimeAgo(profile.lastSeenAny)}
                </div>

                {/* Status Dot - NO TEXT, just signal */}
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(profile.lastSeenAny)} 
                                 animate-pulse flex-shrink-0`}
                    title={getTimeAgo(profile.lastSeenAny)} />

                {/* Expand Icon (if multiple services) */}
                {hasMultipleServices && (
                    <div className="text-slate-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                )}
            </div>

            {/* Expanded View - Additional Services */}
            {isExpanded && hasMultipleServices && (
                <div className="bg-slate-900/20 px-3 py-2 border-b border-slate-800/50">
                    <div className="flex flex-wrap gap-2 ml-9">
                        {profile.services
                            .filter(s => s.category !== primaryService.category)
                            .map((service, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/40 
                                               rounded-md border border-slate-700/30"
                                    title={`${service.category}: ${Math.round(service.score * 100)}% activity`}
                                >
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
