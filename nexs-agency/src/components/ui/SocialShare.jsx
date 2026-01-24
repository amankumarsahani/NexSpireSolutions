import { useState } from 'react';

export default function SocialShare({ url, title, className = '' }) {
    const [copied, setCopied] = useState(false);

    const shareUrl = url || window.location.href;
    const shareTitle = title || document.title;

    const shareLinks = [
        {
            name: 'LinkedIn',
            icon: 'ri-linkedin-fill',
            color: 'hover:bg-[#0077B5] hover:text-white',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'Twitter',
            icon: 'ri-twitter-x-fill',
            color: 'hover:bg-black hover:text-white',
            href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
        },
        {
            name: 'Facebook',
            icon: 'ri-facebook-fill',
            color: 'hover:bg-[#1877F2] hover:text-white',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'WhatsApp',
            icon: 'ri-whatsapp-fill',
            color: 'hover:bg-[#25D366] hover:text-white',
            href: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`
        }
    ];

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm font-medium text-gray-500 mr-2">Share:</span>
            {shareLinks.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 transition-all duration-300 ${link.color}`}
                    title={`Share on ${link.name}`}
                >
                    <i className={`${link.icon} text-lg`}></i>
                </a>
            ))}
            <button
                onClick={handleCopyLink}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                title={copied ? 'Copied!' : 'Copy link'}
            >
                <i className={copied ? 'ri-check-line text-lg' : 'ri-link text-lg'}></i>
            </button>
        </div>
    );
}

// Floating version for blog articles
export function FloatingSocialShare({ url, title }) {
    const [copied, setCopied] = useState(false);

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareTitle = title || (typeof document !== 'undefined' ? document.title : '');

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareLinks = [
        {
            name: 'LinkedIn',
            icon: 'ri-linkedin-fill',
            color: 'hover:bg-[#0077B5]',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'Twitter',
            icon: 'ri-twitter-x-fill',
            color: 'hover:bg-black',
            href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
        },
        {
            name: 'WhatsApp',
            icon: 'ri-whatsapp-fill',
            color: 'hover:bg-[#25D366]',
            href: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`
        }
    ];

    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
            {shareLinks.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-500 transition-all duration-300 hover:text-white hover:scale-110 ${link.color}`}
                    title={`Share on ${link.name}`}
                >
                    <i className={`${link.icon} text-lg`}></i>
                </a>
            ))}
            <button
                onClick={handleCopyLink}
                className={`w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition-all duration-300 hover:scale-110 ${copied
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-100'
                    }`}
                title={copied ? 'Copied!' : 'Copy link'}
            >
                <i className={copied ? 'ri-check-line text-lg' : 'ri-link text-lg'}></i>
            </button>
        </div>
    );
}
