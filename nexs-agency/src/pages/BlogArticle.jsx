import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { blogAPI } from '../services/api';
import RelatedServices from '../components/seo/RelatedServices';

const BlogArticle = () => {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadBlog();
    }, [slug]);

    const loadBlog = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.getBySlug(slug);
            setBlog(response.data.blog);
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
                    <p className="text-gray-600 mb-8">The article you're looking for doesn't exist.</p>
                    <Link to="/blog" className="text-blue-600 hover:underline font-medium">
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
                "url": "https://nexspiresolutions.co.in/logo.png"
            }
        },
        "datePublished": blog.created_at,
        "description": blog.excerpt
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white pt-20">
            <Helmet>
                <title>{blog.title} | Nexspire Insights</title>
                <meta name="description" content={blog.excerpt} />
                <link rel="canonical" href={`https://nexspiresolutions.co.in/blog/${blog.slug}`} />
                <script type="application/ld+json">
                    {JSON.stringify(articleSchema)}
                </script>
            </Helmet>

            <article className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12 text-center">
                    {blog.category && (
                        <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 font-bold rounded-full text-sm mb-6">
                            {blog.category}
                        </span>
                    )}
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-gray-900">
                        {blog.title}
                    </h1>
                    <div className="flex items-center justify-center gap-6 text-gray-500 font-medium">
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
                                <span>{blog.read_time}</span>
                            </>
                        )}
                    </div>
                </div>

                {blog.image && (
                    <div className="rounded-[2rem] overflow-hidden shadow-2xl mb-16 h-[500px]">
                        <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div
                    className="prose prose-lg prose-blue mx-auto"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />
            </article>

            {/* Related Services */}
            <div className="bg-gray-50 py-16">
                <div className="container-custom">
                    <h2 className="text-3xl font-bold text-center mb-12">Explore Our Services</h2>
                    <RelatedServices currentService="none" />
                </div>
            </div>
        </div>
    );
};

export default BlogArticle;
