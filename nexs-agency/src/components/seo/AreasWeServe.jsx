import { Link } from 'react-router-dom';

const cities = [
    {
        name: "London",
        slug: "london",
        country: "United Kingdom",
        image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "New York",
        slug: "new-york",
        country: "United States",
        image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Dubai",
        slug: "dubai",
        country: "UAE",
        image: "https://images.unsplash.com/photo-1512453979798-5ea936a7d40b?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Sydney",
        slug: "sydney",
        country: "Australia",
        image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Toronto",
        slug: "toronto",
        country: "Canada",
        image: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&q=80&w=800"
    },
    {
        name: "Bangalore",
        slug: "bangalore",
        country: "India",
        image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=800"
    }
];

const AreasWeServe = () => {
    return (
        <section className="py-20 bg-white">
            <div className="container-custom">
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-bold tracking-wider uppercase text-sm">Global Footprint</span>
                    <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">We Serve Global Markets</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Delivering world-class software solutions to clients across major tech hubs.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cities.map((city, i) => (
                        <Link
                            key={i}
                            to={`/software-development-company/${city.slug}`}
                            className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer"
                        >
                            {/* Background Image with Overlay */}
                            <div className="absolute inset-0">
                                <img
                                    src={city.image}
                                    alt={`${city.name} skyline`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500"></div>
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex items-center gap-2 text-blue-400 text-sm font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                        <i className="ri-map-pin-line"></i>
                                        <span>{city.country}</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-2">{city.name}</h3>
                                    <div className="flex items-center text-white/80 text-sm font-medium border-b border-white/30 pb-1 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                        View Local Services
                                        <i className="ri-arrow-right-line ml-2"></i>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AreasWeServe;
