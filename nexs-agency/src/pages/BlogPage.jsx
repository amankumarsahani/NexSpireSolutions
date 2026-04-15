// TODO: Replace console.error with Sentry or proper error tracking
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { blogAPI } from '../services/api';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BackToTop from '../components/ui/BackToTop';
import FadeIn from '../components/ui/FadeIn';
import { SITE_URL, siteConfig } from '../constants/siteConfig';

const POSTS_PER_PAGE = 6;

const BlogPage = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [allPosts, setAllPosts] = useState([]);
    const [displayedPosts, setDisplayedPosts] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const loaderRef = useRef(null);

    useEffect(() => {
        loadBlogs();
    }, []);

    const loadBlogs = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.getAll();
            const blogs = response.data.blogs || [];
            const apiCategories = response.data.categories || [];

            // Transform API data to match existing format
            const transformedPosts = blogs.map(blog => ({
                id: blog.id,
                title: blog.title,
                excerpt: blog.excerpt,
                category: blog.category,
                author: blog.author,
                date: new Date(blog.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                readTime: blog.read_time || '5 min read',
                image: blog.image_url || blog.image,
                featured: blog.featured,
                slug: blog.slug
            }));

            setAllPosts(transformedPosts);
            setCategories(['All', ...apiCategories]);

            // Initial load - show first batch
            setDisplayedPosts(transformedPosts.slice(0, POSTS_PER_PAGE));
            setHasMore(transformedPosts.length > POSTS_PER_PAGE);
        } catch (error) {
            console.error('Error loading blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter posts based on category and search
    const getFilteredPosts = useCallback(() => {
        return allPosts.filter(post => {
            const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
            const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (post.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [allPosts, activeCategory, searchQuery]);

    // Reset displayed posts when filter changes
    useEffect(() => {
        const filtered = getFilteredPosts();
        setDisplayedPosts(filtered.slice(0, POSTS_PER_PAGE));
        setPage(1);
        setHasMore(filtered.length > POSTS_PER_PAGE);
    }, [activeCategory, searchQuery, getFilteredPosts]);

    // Load more posts
    const loadMorePosts = useCallback(() => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const filtered = getFilteredPosts();
        const nextPage = page + 1;
        const start = 0;
        const end = nextPage * POSTS_PER_PAGE;

        setTimeout(() => {
            setDisplayedPosts(filtered.slice(start, end));
            setPage(nextPage);
            setHasMore(end < filtered.length);
            setLoadingMore(false);
        }, 300); // Small delay for smooth UX
    }, [page, loadingMore, hasMore, getFilteredPosts]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    loadMorePosts();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, loadMorePosts]);

    const featuredPost = allPosts.find(p => p.featured);
    const nonFeaturedDisplayed = displayedPosts.filter(p => !p.featured);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#2563EB]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>Blog - Tech Insights & Trends | Nexspire Solutions</title>
                <meta name="description" content="Stay updated with the latest trends in AI, Web Development, Mobile Apps, and Enterprise Software. Expert insights from Nexspire Solutions." />
                <meta name="keywords" content="tech blog, AI trends 2026, React vs Angular, mobile app development trends, software development insights, nexspire blog" />
                <link rel="canonical" href={`${SITE_URL}/blog`} />
                <meta property="og:title" content="Blog - Tech Insights & Trends | Nexspire Solutions" />
                <meta property="og:description" content="Read expert articles on AI, Cloud, and Software Development." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/blog`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Blog - Tech Insights & Trends | Nexspire Solutions" />
                <meta name="twitter:description" content="Read expert articles on AI, Cloud, and Software Development." />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Blog",
                    "name": "Nexspire Solutions Blog",
                    "url": `${SITE_URL}/blog`,
                    "description": "Stay updated with the latest trends in AI, Web Development, Mobile Apps, and Enterprise Software.",
                    "publisher": {
                        "@type": "Organization",
                        "name": "Nexspire Solutions",
                        "url": SITE_URL
                    }
                })}</script>
            </Helmet>

            {/* Hero */}
            <div className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-white">
                <div className="container-custom">
                    <Breadcrumbs />
                    <FadeIn>
                        <h1 className="text-4xl md:text-6xl font-bold font-serif text-slate-800 mt-8 mb-4 tracking-tight">
                            Insights
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                            Perspectives on technology, product development, and the craft of building software that lasts.
                        </p>
                    </FadeIn>
                </div>
            </div>

            {/* Featured Post */}
            {featuredPost && (
                <section className="pb-16 lg:pb-24">
                    <div className="container-custom">
                        <FadeIn>
                            <Link
                                to={`/blog/${featuredPost.slug}`}
                                className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center group"
                            >
                                <div className="rounded-xl overflow-hidden aspect-[16/10]">
                                    <img
                                        src={featuredPost.image}
                                        alt={featuredPost.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                    />
                                </div>
                                <div>
                                    <span className="text-sm font-medium uppercase tracking-wider text-[#2563EB] mb-4 block">
                                        Featured Article
                                    </span>
                                    <h2 className="text-3xl md:text-4xl font-bold font-serif text-slate-800 mb-4 leading-tight group-hover:text-[#2563EB] transition-colors">
                                        {featuredPost.title}
                                    </h2>
                                    <p className="text-slate-500 mb-6 line-clamp-3 leading-relaxed">
                                        {featuredPost.excerpt}
                                    </p>
                                    <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs">
                                                {featuredPost.author.charAt(0)}
                                            </div>
                                            <span className="text-slate-600">{featuredPost.author}</span>
                                        </div>
                                        <span>{featuredPost.date}</span>
                                        <span>{featuredPost.readTime}</span>
                                    </div>
                                </div>
                            </Link>
                        </FadeIn>
                    </div>
                </section>
            )}

            {/* Main Content */}
            <section className="py-24 lg:py-32 bg-[#F8FAFC]">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div className="w-full md:w-auto">
                            <FadeIn>
                                <h2 className="text-3xl font-bold font-serif text-slate-800 mb-8">Latest Articles</h2>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                                                activeCategory === cat
                                                    ? "bg-[#2563EB] text-white"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>

                        <div className="w-full md:w-auto relative">
                            <FadeIn delay={0.15}>
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full md:w-72 pl-10 pr-4 py-2.5 rounded-full bg-white border border-slate-200 focus:border-[#2563EB] focus:outline-none transition-colors text-sm"
                                />
                                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            </FadeIn>
                        </div>
                    </div>

                    <motion.div
                        layout
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        <AnimatePresence mode="popLayout">
                            {nonFeaturedDisplayed.map((post, index) => (
                                <Link key={post.id} to={`/blog/${post.slug}`} className="h-full block">
                                    <motion.article
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.35, delay: index % POSTS_PER_PAGE * 0.05 }}
                                        className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-shadow duration-300 group flex flex-col h-full"
                                    >
                                        <div className="relative h-56 overflow-hidden">
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className="px-2.5 py-1 bg-white text-slate-700 text-xs font-medium rounded-full">
                                                    {post.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
                                                <span>{post.date}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>{post.readTime}</span>
                                            </div>
                                            <h3 className="text-xl font-bold font-serif text-slate-800 mb-3 group-hover:text-[#2563EB] transition-colors leading-snug">
                                                {post.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm mb-5 line-clamp-3 flex-1 leading-relaxed">
                                                {post.excerpt}
                                            </p>
                                            <div className="flex items-center justify-between pt-5 border-t border-slate-100 mt-auto">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs">
                                                        {post.author.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-600">{post.author}</span>
                                                </div>
                                                <span className="text-[#2563EB] font-medium text-sm flex items-center gap-1">
                                                    Read <i className="ri-arrow-right-line"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </motion.article>
                                </Link>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Infinite Scroll Loader */}
                    <div ref={loaderRef} className="py-12 flex justify-center">
                        {loadingMore && (
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#2563EB]"></div>
                                <span className="text-slate-400 text-sm">Loading more...</span>
                            </div>
                        )}
                        {!hasMore && nonFeaturedDisplayed.length > 0 && (
                            <p className="text-slate-400 text-sm">
                                {nonFeaturedDisplayed.length} articles shown
                            </p>
                        )}
                        {nonFeaturedDisplayed.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <i className="ri-article-line text-5xl text-slate-300 mb-4 block"></i>
                                <p className="text-slate-400">No articles found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Follow CTA */}
            <section className="py-24 lg:py-32 bg-white">
                <div className="container-custom text-center max-w-2xl mx-auto">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-bold font-serif text-slate-800 mb-4">
                            Stay in the loop
                        </h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Follow us for the latest insights, tutorials, and trends in software development.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            {siteConfig.social.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    aria-label={social.label}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#2563EB] hover:text-white transition-colors duration-200"
                                >
                                    <i className={`${social.icon} text-lg`}></i>
                                </a>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            <BackToTop />
        </div>
    );
};

export default BlogPage;
