import React from 'react';
import { ServiceProfile, ServiceCategory } from '../../types';
import { User, Clock, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ServiceCardProps {
    profile: ServiceProfile;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ profile }) => {
    const { t } = useTranslation();

    const primaryService = profile.services.reduce((best, current) =>
        current.score > best.score ? current : best
        , profile.services[0]);

    const getStatusColor = (score: number) => {
        if (score > 0.7) return 'bg-emerald-500 shadow-emerald-500/50';
        if (score > 0.4) return 'bg-amber-500 shadow-amber-500/50';
        return 'bg-slate-500 shadow-slate-500/30';
    };

    const getStatusLabel = (score: number) => {
        if (score > 0.7) return t('service_directory.status_active');
        if (score > 0.4) return t('service_directory.status_recent');
        return t('service_directory.status_historical');
    };

    const getTimeAgo = (timestamp: number) => {
        const hours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
        if (hours < 1) return t('service_directory.time_just_now');
        if (hours < 24) return t('service_directory.time_hours_ago', { hours });
        const days = Math.floor(hours / 24);
        if (days === 1) return t('service_directory.time_yesterday');
        return t('service_directory.time_days_ago', { days });
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <User size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg group-hover:text-indigo-400 transition-colors">
                            {profile.nick}
                        </h3>
                        <p className="text-slate-500 text-xs">{profile.server}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(profile.activityScore)} shadow-lg animate-pulse`} />
                    <span className="text-xs text-slate-400 font-medium">
                        {getStatusLabel(profile.activityScore)}
                    </span>
                </div>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 mb-3 border border-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                    <Award size={14} className="text-amber-500" />
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                        {t('service_directory.primary_service')}
                    </span>
                </div>
                <p className="text-white font-medium">{primaryService.category}</p>
                <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                            style={{ width: `${primaryService.score * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                        {Math.round(primaryService.score * 100)}%
                    </span>
                </div>
            </div>
            {profile.services.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {profile.services
                        .filter(s => s.category !== primaryService.category)
                        .slice(0, 3)
                        .map((service, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-slate-800/50 text-slate-400 rounded-md border border-slate-700/50"
                            >
                                {service.category}
                            </span>
                        ))}
                    {profile.services.length > 4 && (
                        <span className="text-xs px-2 py-1 text-slate-500">
                            {t('service_directory.more_services', { count: profile.services.length - 4 })}
                        </span>
                    )}
                </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800/50">
                <Clock size={12} />
                <span>{t('service_directory.last_seen')} {getTimeAgo(profile.lastSeenAny)}</span>
            </div>
        </div>
    );
};
