import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import RelatedServices from '../../components/seo/RelatedServices';

const MonolithToMicroservices = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Migrating Legacy Monoliths to Microservices: A Strategic Guide",
        "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
        "author": {
            "@type": "Person",
            "name": "Aman Kumar"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Nexspire Solutions",
            "logo": {
                "@type": "ImageObject",
                "url": "https://nexspiresolutions.co.in/logo.png"
            }
        },
        "datePublished": "2024-03-25",
        "description": "Is your legacy monolith slowing you down? Learn the risks and rewards of migrating to a microservices architecture in 2026."
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-cyan-600 selection:text-white pt-20">
            <Helmet>
                <title>Monolith to Microservices Migration Guide | Nexspire Cloud</title>
                <meta name="description" content="Is your legacy monolith slowing you down? Learn the risks and rewards of migrating to a microservices architecture in 2026." />
                <link rel="canonical" href="https://nexspiresolutions.co.in/blog/monolith-to-microservices" />
                <script type="application/ld+json">
                    {JSON.stringify(articleSchema)}
                </script>
            </Helmet>

            <article className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12 text-center">
                    <span className="inline-block px-4 py-1.5 bg-cyan-100 text-cyan-700 font-bold rounded-full text-sm mb-6">
                        Cloud Architecture
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-gray-900">
                        Migrating Legacy Monoliths to Microservices: A Strategic Guide
                    </h1>
                    <div className="flex items-center justify-center gap-6 text-gray-500 font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">A</div>
                            <span>Aman Kumar</span>
                        </div>
                        <span>•</span>
                        <span>Mar 25, 2024</span>
                        <span>•</span>
                        <span>6 min read</span>
                    </div>
                </div>

                <div className="rounded-[2rem] overflow-hidden shadow-2xl mb-16 h-[500px]">
                    <img
                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80"
                        alt="Cloud Architecture"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="prose prose-lg prose-cyan mx-auto">
                    <p className="lead text-xl text-gray-600 mb-8">
                        The phrase "Monolith to Microservices" is a cliché in tech circles, but for CTOs of established companies, it represents the single biggest challenge to scalability. Here's how to navigate the transition without breaking production.
                    </p>

                    <h2>The Problem with Monoliths</h2>
                    <p>
                        Monoliths aren't inherently bad. But when a 10-year-old application requires a full system deployment just to change a button color, you have a velocity problem.
                    </p>

                    <h2>The Microservices Promise</h2>
                    <ul>
                        <li><strong>Independent Deployment:</strong> Update the billing service without risking the user profile service.</li>
                        <li><strong>Tech Agnosticism:</strong> Write the payment service in Node.js and the data processing service in Python.</li>
                        <li><strong>Scalability:</strong> Scale only the service that's under load, saving cloud costs.</li>
                    </ul>

                    <h2>The Strangler Fig Pattern</h2>
                    <p>
                        We always recommend the "Strangler Fig" approach. Instead of rewriting the entire system (a recipe for disaster), you gradually replace specific functionalities with new microservices.
                    </p>
                    <ol>
                        <li>Identify a non-critical domain (e.g., Notification Service).</li>
                        <li>Build a microservice for it.</li>
                        <li>Route traffic to the new service via an API Gateway.</li>
                        <li>Decommission the old code in the monolith.</li>
                        <li>Repeat.</li>
                    </ol>

                    <div className="bg-cyan-50 border-l-4 border-cyan-600 p-8 my-8 rounded-r-xl">
                        <h4 className="text-xl font-bold text-cyan-900 mb-2">Architectural Review</h4>
                        <p className="text-cyan-800 mb-0">
                            Planning a migration? Nexspire's certified cloud architects can review your roadmap. <Link to="/services/cloud-solutions" className="underline font-bold">Learn about our Cloud Services</Link>.
                        </p>
                    </div>

                    <h2>Common Pitfalls</h2>
                    <p>
                        <strong>Distributed Tracing:</strong> Debugging becomes harder. You need tools like Jaeger or Datadog.
                        <br />
                        <strong>Data Consistency:</strong> You lose ACID transactions across services. You must embrace Eventual Consistency.
                    </p>

                    <h2>Conclusion</h2>
                    <p>
                        Microservices are an investment in future speed. If your team is growing beyond 20 developers or your deployment cycles are slower than weekly, it's time to start the migration.
                    </p>
                </div>
            </article>

            {/* Internal Linking to Services */}
            <div className="bg-gray-50 py-16">
                <div className="container-custom">
                    <h2 className="text-3xl font-bold text-center mb-12">Modernize Your Infrastructure</h2>
                    <RelatedServices currentService="Cloud Solutions" />
                </div>
            </div>
        </div>
    );
};

export default MonolithToMicroservices;
