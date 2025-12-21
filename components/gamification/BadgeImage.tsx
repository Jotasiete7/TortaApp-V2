import React from 'react';

interface BadgeImageProps {
    slug: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    alt?: string;
}

const SIZE_CLASSES = {
    sm: 'w-6 h-6',      // 24px - Leaderboard, compact views
    md: 'w-8 h-8',      // 32px - PlayerProfile main display
    lg: 'w-10 h-10',    // 40px - BadgeSelector, GamificationRules
    xl: 'w-12 h-12'     // 48px - Tooltips, large displays
};

/**
 * BadgeImage Component
 * 
 * Renders custom badge images from /public/badges/ folder
 * Falls back to generic badge if specific image not found
 * 
 * @param slug - Badge slug from database (e.g., 'merchant_king')
 * @param size - Predefined size (sm, md, lg, xl)
 * @param className - Additional CSS classes
 * @param alt - Alt text for accessibility
 * 
 * @example
 * <BadgeImage slug="merchant_king" size="md" />
 * <BadgeImage slug="trader_novice" size="lg" className="hover:scale-110" />
 */
export const BadgeImage: React.FC<BadgeImageProps> = ({ 
    slug, 
    size = 'md', 
    className = '',
    alt 
}) => {
    const [imageError, setImageError] = React.useState(false);
    
    // Path to custom badge image
    const imagePath = `/badges/${slug}.png`;
    
    // Fallback to generic badge if specific image not found
    const fallbackPath = '/badges/fallback.png';
    
    return (
        <img
            src={imageError ? fallbackPath : imagePath}
            alt={alt || slug.replace(/_/g, ' ')}
            className={`
                ${SIZE_CLASSES[size]} 
                ${className} 
                object-contain 
                select-none
                transition-transform
                duration-200
            `}
            onError={() => setImageError(true)}
            loading="lazy"
            draggable={false}
        />
    );
};
