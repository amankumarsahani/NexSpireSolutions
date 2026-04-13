// TODO: Replace console.error with Sentry or proper error tracking
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { blogAPI } from '../services/api';
import RelatedServices from '../components/seo/RelatedServices';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ReadingProgress from '../components/ui/ReadingProgress';
import { FloatingSocialShare } from '../components/ui/SocialShare';
import SocialShare from '../components/ui/SocialShare';
import AuthorBio from '../components/ui/AuthorBio';
import BackToTop from '../components/ui/BackToTop';
import TableOfContents, { addIdsToHeadings } from '../components/ui/TableOfContents';
import { SITE_URL } from '../constants/siteConfig';

const BlogArticle = () => {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);

    useEffect(() => {
        loadBlog();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const loadBlog = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.getBySlug(slug);
            setBlog(response.data.blog);

            // Load related posts
            const allResponse = await blogAPI.getAll();
            const allBlogs = allResponse.data.blogs || [];
            const related = allBlogs
                .filter(b => b.slug !== slug && b.category === response.data.blog?.category)
                .slice(0, 3);
            setRelatedPosts(related);
        } catch (err) {
            console.error('Error loading blog:', err);
            setError('Blog not found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white pt-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white pt-20">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">Blog Not Found</h1>
                    <p className="text-slate-600 mb-8">The article you're looking for doesn't exist.</p>
                    <Link to="/blog" className="text-[#0F766E] hover:underline font-medium">
                        ← Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": blog.title,
        "image": blog.image,
        "author": {
            "@type": "Person",
            "name": blog.author
        },
        "publisher": {
            "@type": "Organization",
            "name": "Nexspire Solutions",
            "logo": {
                "@type": "ImageObject",
                "url": `${SITE_URL}/logo.png`
            }
        },
        "datePublished": blog.created_at,
        "description": blog.excerpt
    };

    const authorBios = {
        'Aman Kumar': {
            role: 'Founder & Tech Lead',
            bio: 'Full-stack developer passionate about building scalable software solutions. 5+ years in web and mobile development.',
            linkedin: 'https://linkedin.com/in/amankumar',
            twitter: 'https://twitter.com/amankumar'
        },
        'Kshitij Bhardwaj': {
            role: 'Senior Developer',
            bio: 'Expert in React, Node.js, and cloud architecture. Loves creating intuitive user experiences.',
            linkedin: 'https://linkedin.com/in/kshitij',
            twitter: ''
        }
    };

    const authorInfo = authorBios[blog.author] || {
        role: 'Contributing Author',
        bio: 'Part of the Nexspire Solutions team, bringing insights on technology and digital innovation.',
        linkedin: '',
        twitter: ''
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-blue-600 selection:text-white pt-20">
            <Helmet>
                <title>{blog.title} | Nexspire Insights</title>
                <meta name="description" content={blog.excerpt} />
                <link rel="canonical" href={`${SITE_URL}/blog/${blog.slug}`} />
                <meta property="og:title" content={`${blog.title} | Nexspire Insights`} />
                <meta property="og:description" content={blog.excerpt} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={`${SITE_URL}/blog/${blog.slug}`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${blog.title} | Nexspire Insights`} />
                <meta name="twitter:description" content={blog.excerpt} />
                <script type="application/ld+json">
                    {JSON.stringify(articleSchema)}
                </script>
            </Helmet>

            {/* Reading Progress */}
            <ReadingProgress />

            {/* Floating Social Share */}
            <FloatingSocialShare
                url={`${SITE_URL}/blog/${blog.slug}`}
                title={blog.title}
            />

            {/* Breadcrumbs */}
            <div className="container-custom py-4">
                <Breadcrumbs />
            </div>

            <article className="max-w-4xl mx-auto px-6 py-8">
                {/* Article Header */}
                <div className="mb-12 text-center">
                    {blog.category && (
                        <span className="inline-block px-4 py-1.5 bg-[#0F766E]/10 text-[#0F766E] font-bold rounded-full text-sm mb-6">
                            {blog.category}
                        </span>
                    )}
                    <h1 className="text-4xl md:text-6xl font-bold font-serif leading-tight mb-6 text-slate-800">
                        {blog.title}
                    </h1>
                    <div className="flex items-center justify-center gap-6 text-slate-500 font-medium flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                {blog.author?.charAt(0) || 'A'}
                            </div>
                            <span>{blog.author}</span>
                        </div>
                        <span>•</span>
                        <span>{new Date(blog.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}</span>
                        {blog.read_time && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <i className="ri-time-line"></i>
                                    {blog.read_time}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Featured Image */}
                {blog.image && (
                    <div className="rounded-[2rem] overflow-hidden shadow-2xl mb-16 h-[500px]">
                        <img
                            src={blog.image}
                            alt={blog.title}
                            loading="lazy"
                            height={500}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Table of Contents - Desktop */}
                    <TableOfContents content={addIdsToHeadings(blog.content)} />

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                        <div
                            className="prose prose-lg prose-blue max-w-none mb-16 prose-dropcap"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(addIdsToHeadings(blog.content), { ADD_ATTR: ['id', 'target'] }) }}
                        />

                        {/* Social Share (Inline) */}
                        <div className="border-t border-b border-slate-200 py-6 mb-12">
                            <SocialShare
                                url={`${SITE_URL}/blog/${blog.slug}`}
                                title={blog.title}
                                className="justify-center"
                            />
                        </div>

                        {/* Author Bio */}
                        <div className="mb-16">
                            <AuthorBio
                                name={blog.author}
                                role={authorInfo.role}
                                bio={authorInfo.bio}
                                linkedin={authorInfo.linkedin}
                                twitter={authorInfo.twitter}
                            />
                        </div>
                    </div>
                </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <div className="bg-[#FAF9F6] py-16">
                    <div className="container-custom">
                        <h2 className="text-3xl font-bold text-center mb-12">Related Articles</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {relatedPosts.map(post => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.slug}`}
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                                >
                                    {post.image && (
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                loading="lazy"
                                                height={192}
                                                className="w-full h-full object-cover group- transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                                            {post.category}
                                        </span>
                                        <h3 className="text-lg font-bold font-serif mt-2 group-hover:text-[#0F766E] transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                                            {post.excerpt}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Related Services */}
            <div className="bg-white py-16">
                <div className="container-custom">
                    <h2 className="text-3xl font-bold text-center mb-12">Explore Our Services</h2>
                    <RelatedServices currentService="none" />
                </div>
            </div>

            {/* Back to Top */}
            <BackToTop />
        </div>
    );
};

export default BlogArticle;
