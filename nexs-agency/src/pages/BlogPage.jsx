import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import LeadMagnet from '../components/LeadMagnet';
import { blogAPI } from '../services/api';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BackToTop from '../components/ui/BackToTop';

// Utility for tailwind class merging
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const FadeIn = ({ children, className, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

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
        window.scrollTo(0, 0);
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
                image: blog.image,
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>Blog - Tech Insights & Trends | Nexspire Solutions</title>
                <meta name="description" content="Stay updated with the latest trends in AI, Web Development, Mobile Apps, and Enterprise Software. Expert insights from Nexspire Solutions." />
                <meta name="keywords" content="tech blog, AI trends 2026, React vs Angular, mobile app development trends, software development insights, nexspire blog" />
                <link rel="canonical" href="https://nexspiresolutions.co.in/blog" />
                <meta property="og:title" content="Blog - Tech Insights & Trends | Nexspire Solutions" />
                <meta property="og:description" content="Read expert articles on AI, Cloud, and Software Development." />
                <meta property="og:url" content="https://nexspiresolutions.co.in/blog" />
            </Helmet>

            {/* Breadcrumbs */}
            <div className="container-custom pt-8 pb-4">
                <Breadcrumbs />
            </div>

            {/* Featured Post Hero */}
            {featuredPost && (
                <Link to={`/blog/${featuredPost.slug}`} className="relative h-[90vh] flex items-end pb-24 group cursor-pointer overflow-hidden block">
                    <div className="absolute inset-0 z-0">
                        <motion.img
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.7 }}
                            src={featuredPost.image}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    </div>

                    <div className="container-custom relative z-10 w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full mb-6 shadow-lg shadow-blue-600/20">
                                Featured Article
                            </span>
                            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 max-w-5xl leading-tight group-hover:text-blue-400 transition-colors duration-300">
                                {featuredPost.title}
                            </h1>
                            <p className="text-xl text-gray-300 mb-8 max-w-2xl line-clamp-2 leading-relaxed">
                                {featuredPost.excerpt}
                            </p>

                            <div className="flex items-center gap-8 text-sm text-gray-400 font-medium">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {featuredPost.author.charAt(0)}
                                    </div>
                                    <span className="text-white">{featuredPost.author}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="ri-calendar-line"></i>
                                    <span>{featuredPost.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="ri-time-line"></i>
                                    <span>{featuredPost.readTime}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </Link>
            )}

            {/* Main Content */}
            <section className="section-padding container-custom">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div className="w-full md:w-auto">
                        <FadeIn>
                            <h2 className="text-4xl font-bold mb-8">Latest Insights</h2>
                            <div className="flex flex-wrap gap-3">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn(
                                            "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300",
                                            activeCategory === cat
                                                ? "bg-gray-900 text-white shadow-lg scale-105"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </FadeIn>
                    </div>

                    <div className="w-full md:w-auto relative">
                        <FadeIn delay={0.2}>
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-80 pl-12 pr-6 py-4 rounded-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:outline-none shadow-sm transition-all focus:shadow-lg focus:bg-white"
                            />
                            <i className="ri-search-line absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
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
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4, delay: index % POSTS_PER_PAGE * 0.05 }}
                                    className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group border border-gray-100 flex flex-col h-full hover:-translate-y-2"
                                >
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold rounded-full shadow-sm">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">
                                            <span>{post.date}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>{post.readTime}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-600 mb-6 line-clamp-3 flex-1 leading-relaxed">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                                    {post.author.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">{post.author}</span>
                                            </div>
                                            <button className="text-blue-600 font-bold text-sm group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                Read Article <i className="ri-arrow-right-line"></i>
                                            </button>
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-gray-500 font-medium">Loading more articles...</span>
                        </div>
                    )}
                    {!hasMore && nonFeaturedDisplayed.length > 0 && (
                        <p className="text-gray-400 text-sm font-medium">
                            You've reached the end • {nonFeaturedDisplayed.length} articles shown
                        </p>
                    )}
                    {nonFeaturedDisplayed.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <i className="ri-article-line text-6xl text-gray-300 mb-4 block"></i>
                            <p className="text-gray-500 text-lg">No articles found matching your criteria</p>
                        </div>
                    )}
                </div>

                {/* Newsletter */}
                <div className="mt-16 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[3rem] transform rotate-1 opacity-50 blur-lg"></div>
                    <div className="bg-gray-900 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/50 to-purple-900/50"></div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md animate-float">
                                <i className="ri-mail-send-line text-4xl"></i>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Subscribe to our Newsletter</h2>
                            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                                Join 5,000+ developers and designers. Get the latest insights, tutorials, and trends delivered straight to your inbox.
                            </p>
                            <form className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    className="flex-1 px-8 py-5 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/50 text-lg"
                                />
                                <button className="px-10 py-5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-600/30 text-lg whitespace-nowrap">
                                    Subscribe Now
                                </button>
                            </form>
                            <p className="mt-6 text-sm text-gray-500">
                                No spam, ever. Unsubscribe anytime.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            {/* Lead Magnet */}
            <div className="bg-white">
                <LeadMagnet />
            </div>

            <BackToTop />
        </div>
    );
};

export default BlogPage;
