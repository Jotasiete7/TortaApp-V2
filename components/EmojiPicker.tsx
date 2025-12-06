import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Smile, Car, Leaf, Dog, Pizza, Gamepad2, Hash, Flag, Package, X } from 'lucide-react';

interface Emoji {
    hexcode: string;
    emoji: string;
    name: string;
    category: string;
    path: string;
}

interface EmojiPickerProps {
    onSelect: (emoji: Emoji) => void;
    onClose: () => void;
}

const CATEGORIES = [
    { id: 'all', icon: Hash, label: 'All' },
    { id: 'smileys', icon: Smile, label: 'Smileys' },
    { id: 'animals', icon: Dog, label: 'Animals' },
    { id: 'food', icon: Pizza, label: 'Food' },
    { id: 'activities', icon: Gamepad2, label: 'Activities' },
    { id: 'travel', icon: Car, label: 'Travel' },
    { id: 'nature', icon: Leaf, label: 'Nature' },
    { id: 'objects', icon: Package, label: 'Objects' },
    { id: 'symbols', icon: Hash, label: 'Symbols' },
    { id: 'flags', icon: Flag, label: 'Flags' },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
    const [emojis, setEmojis] = useState<Emoji[]>([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [visibleCount, setVisibleCount] = useState(100);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Carregar índice de emojis
        fetch('/openmoji/openmoji-index.json')
            .then(async res => {
                if (!res.ok) throw new Error(`Failed to load emojis: ${res.statusText}`);
                const data = await res.json();
                setEmojis(data);
            })
            .catch(err => console.error('Failed to load emojis:', err));
    }, []);

    const filteredEmojis = useMemo(() => {
        let filtered = emojis;

        if (category !== 'all') {
            filtered = filtered.filter(e => e.category === category);
        }

        if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter(e =>
                e.name.includes(term) ||
                e.hexcode.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [emojis, category, search]);

    const visibleEmojis = filteredEmojis.slice(0, visibleCount);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                setVisibleCount(prev => Math.min(prev + 100, filteredEmojis.length));
            }
        }
    };

    // Reset visible count when filter changes
    useEffect(() => {
        setVisibleCount(100);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [category, search]);

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-80 flex flex-col h-96 z-50">
            {/* Header */}
            <div className="p-3 border-b border-slate-700 flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search emojis..."
                        className="w-full bg-slate-800 text-white text-sm rounded pl-8 pr-2 py-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto p-2 gap-1 border-b border-slate-700 scrollbar-hide">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2 rounded hover:bg-slate-800 transition-colors ${category === cat.id ? 'bg-amber-500/20 text-amber-500' : 'text-slate-400'
                            }`}
                        title={cat.label}
                    >
                        <cat.icon className="w-5 h-5" />
                    </button>
                ))}
            </div>

            {/* Emoji Grid */}
            <div
                className="flex-1 overflow-y-auto p-2 grid grid-cols-6 gap-2 content-start"
                ref={scrollRef}
                onScroll={handleScroll}
            >
                {visibleEmojis.map(emoji => (
                    <button
                        key={emoji.hexcode}
                        type="button"
                        onClick={() => onSelect(emoji)}
                        className="w-10 h-10 p-1 hover:bg-slate-800 rounded flex items-center justify-center transition-transform hover:scale-110"
                        title={emoji.name}
                    >
                        <img
                            src={emoji.path}
                            alt={emoji.emoji}
                            className="w-full h-full object-contain"
                            loading="lazy"
                        />
                    </button>
                ))}
                {visibleEmojis.length === 0 && (
                    <div className="col-span-6 text-center py-8 text-slate-500 text-sm">
                        No emojis found
                    </div>
                )}
            </div>

            {/* Footer Status */}
            <div className="px-3 py-1 bg-slate-950 text-xs text-slate-500 border-t border-slate-800 flex justify-between">
                <span>{filteredEmojis.length} emojis</span>
                <span>OpenMoji</span>
            </div>
        </div>
    );
};
