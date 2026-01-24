import { useEffect, useState } from 'react';

export default function TableOfContents({ content }) {
    const [headings, setHeadings] = useState([]);
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        // Parse headings from content
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const elements = Array.from(doc.querySelectorAll('h2, h3'));

        const headingData = elements.map((elem, index) => {
            const id = `heading-${index}`;
            // Ideally we'd modify the actual content to include these IDs,
            // but for now we'll rely on the fact that we're rendering HTML
            // and we might need to manually inject IDs into the rendered content 
            // or just scroll to text match (less reliable).
            // A better approach for the future: inject IDs on critical render.
            return {
                id,
                text: elem.textContent,
                level: Number(elem.tagName.substring(1))
            };
        });

        setHeadings(headingData);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '0px 0px -40% 0px' }
        );

        // This part requires the actual DOM elements to have IDs.
        // Since we are rendering dangerouslySetInnerHTML, we need to add IDs to the source HTML
        // or add them after render.

        return () => observer.disconnect();
    }, [content]);

    if (headings.length === 0) return null;

    return (
        <div className="hidden lg:block sticky top-32 w-64 flex-shrink-0">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Table of Contents
            </h4>
            <nav className="space-y-1 relative border-l border-gray-100">
                {headings.map((heading) => (
                    <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        onClick={(e) => {
                            e.preventDefault();
                            document.querySelector(`#${heading.id}`)?.scrollIntoView({
                                behavior: 'smooth'
                            });
                        }}
                        className={`block pl-4 py-1 text-sm border-l-2 transition-all duration-300 ${activeId === heading.id
                                ? 'border-blue-600 text-blue-600 font-medium'
                                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                            } ${heading.level === 3 ? 'ml-4' : ''}`}
                    >
                        {heading.text}
                    </a>
                ))}
            </nav>
        </div>
    );
}

// Helper to inject IDs into HTML content - export this to use in BlogArticle
export function addIdsToHeadings(htmlContent) {
    if (!htmlContent) return '';

    // Simple regex replacement for h2 and h3
    // Note: This is a basic implementation. For robust parsing, DOMParser is better but runs client-side.
    // Since we're in React, we can do this before rendering.

    let index = 0;
    return htmlContent.replace(/<(h[23])>(.*?)<\/\1>/g, (match, tag, content) => {
        const id = `heading-${index++}`;
        return `<${tag} id="${id}">${content}</${tag}>`;
    });
}
