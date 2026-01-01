import React, { useState, useEffect } from 'react';
import { ServiceProfile, ServiceCategory } from '../../types';
import { serviceDirectory } from '../../services/ServiceDirectory';
import { ServiceCard } from './ServiceCard';
import { Filter, Server, Search } from 'lucide-react';

export const ServiceDirectoryView: React.FC = () => {
    const [profiles, setProfiles] = useState<ServiceProfile[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | undefined>();
    const [selectedServer, setSelectedServer] = useState<string | undefined>();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
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

    const servers = Array.from(new Set(profiles.map(p => p.server)));
    const categories = Object.values(ServiceCategory);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Service Directory</h1>
                <p className="text-slate-400">Live directory of service providers based on trade chat activity</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            <Search size={14} className="inline mr-1" />
                            Search Provider
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Enter nickname..."
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            <Filter size={14} className="inline mr-1" />
                            Service Category
                        </label>
                        <select
                            value={selectedCategory || ''}
                            onChange={(e) => setSelectedCategory(e.target.value as ServiceCategory || undefined)}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            <Server size={14} className="inline mr-1" />
                            Server
                        </label>
                        <select
                            value={selectedServer || ''}
                            onChange={(e) => setSelectedServer(e.target.value || undefined)}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Servers</option>
                            {servers.map(server => (
                                <option key={server} value={server}>{server}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
                <p className="text-slate-400 text-sm">
                    Found <span className="text-white font-semibold">{filteredProfiles.length}</span> service providers
                </p>
                {selectedCategory || selectedServer || searchTerm ? (
                    <button
                        onClick={() => {
                            setSelectedCategory(undefined);
                            setSelectedServer(undefined);
                            setSearchTerm('');
                        }}
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Clear Filters
                    </button>
                ) : null}
            </div>

            {filteredProfiles.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-12 text-center">
                    <div className="text-slate-500 mb-2">
                        <Filter size={48} className="mx-auto opacity-30" />
                    </div>
                    <p className="text-slate-400 text-lg font-medium mb-1">No services detected yet</p>
                    <p className="text-slate-500 text-sm">
                        This directory populates automatically from live trade activity.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProfiles.map(profile => (
                        <ServiceCard key={profile.nick} profile={profile} />
                    ))}
                </div>
            )}
        </div>
    );
};
