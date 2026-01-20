import { Link } from 'react-router-dom';

const services = [
    {
        title: "Custom Web Development",
        link: "/services/custom-web-development",
        icon: "ri-code-s-slash-line",
        color: "blue",
        desc: "Scalable web apps tailored to your needs."
    },
    {
        title: "Mobile App Development",
        link: "/services/mobile-app-development",
        icon: "ri-smartphone-line",
        color: "purple",
        desc: "Native & cross-platform mobile solutions."
    },
    {
        title: "AI & Machine Learning",
        link: "/services/ai-machine-learning",
        icon: "ri-brain-line",
        color: "emerald",
        desc: "Intelligent automation & insights."
    },
    {
        title: "Cloud Solutions",
        link: "/services/cloud-solutions",
        icon: "ri-cloud-line",
        color: "cyan",
        desc: "Secure, scalable cloud infrastructure."
    },
    {
        title: "E-commerce Development",
        link: "/services/ecommerce-development",
        icon: "ri-shopping-cart-2-line",
        color: "orange",
        desc: "High-conversion online stores."
    }
];

const colorMap = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    cyan: "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white",
    orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
};

const RelatedServices = ({ currentService }) => {
    // Filter out the current service and take up to 3 others
    const related = services.filter(s => s.title !== currentService).slice(0, 3);

    return (
        <section className="border-t border-gray-100 pt-10 mt-10">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <i className="ri-layout-grid-line text-blue-600"></i>
                More Services
            </h3>
            <div className="grid md:grid-cols-3 gap-5">
                {related.map((s, i) => (
                    <Link
                        key={i}
                        to={s.link}
                        className="group relative flex flex-col p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden"
                    >
                        {/* Hover Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 transition-all duration-300 ${colorMap[s.color]}`}>
                                <i className={s.icon}></i>
                            </div>

                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 text-lg">
                                {s.title}
                            </h4>

                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                {s.desc}
                            </p>

                            <div className="flex items-center text-sm font-semibold text-gray-400 group-hover:text-blue-600 transition-colors mt-auto">
                                Explore
                                <i className="ri-arrow-right-line ml-2 group-hover:translate-x-1 transition-transform"></i>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default RelatedServices;
