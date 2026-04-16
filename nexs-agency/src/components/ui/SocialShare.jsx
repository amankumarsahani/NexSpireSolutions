import { useState, useRef, useEffect } from 'react';
import { RiCheckLine, RiLink } from 'react-icons/ri';
import Icon from './Icon';

export default function SocialShare({ url, title, className = '' }) {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef(null);
    useEffect(() => () => clearTimeout(timerRef.current), []);

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
            timerRef.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API not available — try legacy fallback
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            timerRef.current = setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm font-medium text-slate-500 mr-2">Share:</span>
            {shareLinks.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-slate-600 transition-all duration-300 ${link.color}`}
                    title={`Share on ${link.name}`}
                >
                    <Icon name={link.icon} className="text-lg" />
                </a>
            ))}
            <button
                onClick={handleCopyLink}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                title={copied ? 'Copied!' : 'Copy link'}
            >
                {copied ? <RiCheckLine className="text-lg" /> : <RiLink className="text-lg" />}
            </button>
        </div>
    );
}

// Floating version for blog articles
export function FloatingSocialShare({ url, title }) {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef(null);
    useEffect(() => () => clearTimeout(timerRef.current), []);

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareTitle = title || (typeof document !== 'undefined' ? document.title : '');

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            timerRef.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            timerRef.current = setTimeout(() => setCopied(false), 2000);
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
                    className={`w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-500 transition-all duration-300 hover:text-white  ${link.color}`}
                    title={`Share on ${link.name}`}
                >
                    <Icon name={link.icon} className="text-lg" />
                </a>
            ))}
            <button
                onClick={handleCopyLink}
                className={`w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition-all duration-300  ${copied
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-gray-100'
                    }`}
                title={copied ? 'Copied!' : 'Copy link'}
            >
                {copied ? <RiCheckLine className="text-lg" /> : <RiLink className="text-lg" />}
            </button>
        </div>
    );
}
