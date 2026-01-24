export default function TrustBadges({ className = '' }) {
    const badges = [
        {
            icon: 'ri-shield-check-line',
            title: 'SSL Secured',
            subtitle: '256-bit encryption'
        },
        {
            icon: 'ri-lock-line',
            title: 'Data Protected',
            subtitle: 'GDPR Compliant'
        },
        {
            icon: 'ri-customer-service-2-line',
            title: '24/7 Support',
            subtitle: 'Always available'
        },
        {
            icon: 'ri-verified-badge-line',
            title: 'ISO Certified',
            subtitle: 'Quality assured'
        }
    ];

    return (
        <div className={`flex flex-wrap items-center justify-center gap-6 md:gap-10 ${className}`}>
            {badges.map((badge, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 text-gray-500"
                >
                    <i className={`${badge.icon} text-2xl text-blue-600`}></i>
                    <div className="text-left">
                        <div className="text-sm font-semibold text-gray-700">{badge.title}</div>
                        <div className="text-xs text-gray-400">{badge.subtitle}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Compact version for footers/CTA sections
export function TrustBadgesCompact({ className = '' }) {
    const badges = [
        { icon: 'ri-shield-check-fill', label: 'Secure' },
        { icon: 'ri-lock-fill', label: 'Private' },
        { icon: 'ri-verified-badge-fill', label: 'Trusted' }
    ];

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            {badges.map((badge, index) => (
                <div key={index} className="flex items-center gap-1.5 text-gray-400">
                    <i className={`${badge.icon} text-green-500`}></i>
                    <span className="text-xs font-medium">{badge.label}</span>
                </div>
            ))}
        </div>
    );
}
