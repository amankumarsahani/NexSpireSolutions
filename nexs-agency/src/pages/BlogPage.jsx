import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

const BlogPage = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const posts = [
        // {
        //     id: 1,
        //     title: "The Future of AI in Web Development",
        //     excerpt: "How artificial intelligence is reshaping the way we build and interact with the web. From automated testing to generative UI, the landscape is changing fast.",
        //     category: "Technology",
        //     author: "Aman Kumar",
        //     date: "Mar 15, 2024",
        //     readTime: "5 min read",
        //     image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
        //     featured: true
        // },
        {
            id: 2,
            title: "Mastering React Server Components",
            excerpt: "A deep dive into the next generation of React architecture and performance optimization.",
            category: "Development",
            author: "Kshitij Bhardwaj",
            date: "Mar 12, 2024",
            readTime: "8 min read",
            image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
            featured: false
        },
        {
            id: 3,
            title: "Designing for Accessibility",
            excerpt: "Why inclusive design matters and how to implement it in your next project.",
            category: "Design",
            author: "Anu Kumar",
            date: "Mar 10, 2024",
            readTime: "6 min read",
            image: "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?w=800&q=80",
            featured: false
        },
        // {
        //     id: 4,
        //     title: "Cloud Native Architecture Patterns",
        //     excerpt: "Best practices for building scalable and resilient applications on the cloud.",
        //     category: "Cloud",
        //     author: "Aman Kumar",
        //     date: "Mar 08, 2024",
        //     readTime: "10 min read",
        //     image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
        //     featured: false
        // },
        {
            id: 5,
            title: "The State of Mobile Dev in 2024",
            excerpt: "Comparing Flutter, React Native, and Native development for modern apps.",
            category: "Mobile",
            author: "Kshitij Bhardwaj",
            date: "Mar 05, 2024",
            readTime: "7 min read",
            image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
            featured: false
        },
        {
            id: 6,
            title: "UI Trends to Watch",
            excerpt: "From glassmorphism to bento grids, exploring the visual styles defining this year.",
            category: "Design",
            author: "Anu Kumar",
            date: "Mar 01, 2024",
            readTime: "4 min read",
            image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
            featured: false
        }
    ];

    const categories = ["All", "Technology", "Development", "Design", "Cloud", "Mobile"];

    const filteredPosts = posts.filter(post => {
        const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const featuredPost = posts.find(p => p.featured);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>Tech Insights & Blog - Software Development Trends 2024 | Nexspire</title>
                <meta name="description" content="Stay ahead of the curve with our expert insights on AI, Web Development, Cloud Computing, and Mobile Tech. Tutorials, trends, and thought leadership from Nexspire engineers." />
                <meta name="keywords" content="tech blog, software development trends, react tutorials, AI insights, cloud computing articles, mobile dev tips, nexspire blog, engineering best practices" />
                <link rel="canonical" href="https://nexspiresolutions.co.in/blog" />
                <meta property="og:title" content="Nexspire Insights - The Future of Tech" />
                <meta property="og:description" content="Deep dives into the technologies shaping our world. Read our latest articles." />
                <meta property="og:url" content="https://nexspiresolutions.co.in/blog" />
            </Helmet>

            {/* Featured Post Hero */}
            {featuredPost && (
                <section className="relative h-[90vh] flex items-end pb-24 group cursor-pointer overflow-hidden">
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
                </section>
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
                    <AnimatePresence>
                        {filteredPosts.filter(p => !p.featured).map((post, index) => (
                            <motion.article
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                key={post.id}
                                className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group border border-gray-100 flex flex-col h-full hover:-translate-y-2"
                            >
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Newsletter */}
                <div className="mt-32 relative">
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
        </div>
    );
};

export default BlogPage;
