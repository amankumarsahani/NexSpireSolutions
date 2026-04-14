import { memo } from 'react'
import { Link } from 'react-router-dom'

const projects = [
  {
    title: "E-commerce Platform",
    slug: "ecommerce-platform",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&fm=webp",
    description: "Modern e-commerce platform with advanced product filtering and secure payment integration.",
    technologies: ["React", "Node.js", "MongoDB", "Stripe"]
  },
  {
    title: "Healthcare Dashboard",
    slug: "healthcare-dashboard",
    image: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=1106&auto=format&fit=crop&fm=webp",
    description: "Comprehensive healthcare management system with patient records and appointment scheduling.",
    technologies: ["Vue.js", "Python", "PostgreSQL", "Docker"]
  },
  {
    title: "Real Estate Portal",
    slug: "real-estate-portal",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&fm=webp",
    description: "Property listing platform with advanced search filters and virtual tours.",
    technologies: ["Next.js", "Prisma", "MySQL", "AWS"]
  },
  {
    title: "Inventory Management",
    slug: "inventory-management",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop&fm=webp",
    description: "Enterprise inventory management system with analytics and automated reporting.",
    technologies: ["Angular", "Java", "Spring", "Oracle"]
  }
];

const Portfolio = memo(function Portfolio() {
  return (
    <section id="portfolio" className="bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 lg:mb-20">
          <h2 className="font-serif text-4xl md:text-5xl text-slate-900">Selected work</h2>
          <p className="text-lg text-slate-600 max-w-3xl mt-4 leading-relaxed">
            A sample of projects we've delivered for clients across healthcare, real estate, e-commerce, and enterprise.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const isLarge = index === 0 || index === 3;
            return (
              <Link
                key={project.slug}
                to={`/portfolio/${project.slug}`}
                className={`group block rounded-xl overflow-hidden border border-slate-200 bg-white ${isLarge ? 'lg:col-span-2' : 'lg:col-span-1'}`}
              >
                <div className="overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isLarge ? 'h-56 lg:h-72' : 'h-56'}`}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{project.title}</h3>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12">
          <Link to="/portfolio" className="text-sm font-semibold text-slate-700 hover:text-[#2563EB] transition-colors">
            See all projects &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
});

export default Portfolio;
