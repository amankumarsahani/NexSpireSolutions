import { useState, useEffect, useMemo, memo } from 'react'
import { Link } from 'react-router-dom'

const Portfolio = memo(function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const projects = [
    {
      title: "E-commerce Platform",
      slug: "ecommerce-platform",
      category: "Web Development",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&fm=webp",
      description: "Modern e-commerce platform with advanced product filtering and secure payment integration.",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"]
    },
    {
      title: "Food Delivery App",
      slug: "food-delivery-app",
      category: "Mobile Development",
      image: "https://plus.unsplash.com/premium_photo-1682130100826-913b21060e4e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=400&h=300&fit=crop&fm=webp",
      description: "Mobile app for food delivery with real-time tracking and multiple payment options.",
      technologies: ["React Native", "Firebase", "Maps API", "PayPal"]
    },
    {
      title: "Healthcare Dashboard",
      slug: "healthcare-dashboard",
      category: "Web Development",
      image: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=1106&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=400&h=300&fit=crop&fm=webp",
      description: "Comprehensive healthcare management system with patient records and appointment scheduling.",
      technologies: ["Vue.js", "Python", "PostgreSQL", "Docker"]
    },
    {
      title: "Real Estate Portal",
      slug: "real-estate-portal",
      category: "Full Stack",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop&fm=webp",
      description: "Property listing platform with advanced search filters and virtual tours.",
      technologies: ["Next.js", "Prisma", "MySQL", "AWS"]
    },
    {
      title: "Fitness Tracker",
      slug: "fitness-tracker",
      category: "Mobile Development",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&fm=webp",
      description: "Mobile fitness app with workout tracking, nutrition planning, and progress analytics.",
      technologies: ["Flutter", "Dart", "Firebase", "Charts"]
    },
    {
      title: "Inventory Management",
      slug: "inventory-management",
      category: "Enterprise",
      image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop&fm=webp",
      description: "Enterprise inventory management system with analytics and automated reporting.",
      technologies: ["Angular", "Java", "Spring", "Oracle"]
    }
  ];

  const categories = ["All", "Web Development", "Mobile Development", "Full Stack", "Enterprise"];

  const filteredProjects = useMemo(() => activeCategory === "All"
    ? projects
    : projects.filter(project => project.category === activeCategory),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategory])

  return (
    <section id="portfolio" className="relative py-12 sm:py-16 lg:py-20 bg-slate-50 overflow-hidden">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-left mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <span className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider">Our Portfolio</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-4 sm:mb-6 mt-4 leading-tight tracking-tight">
            Showcasing Our
            <span className="block text-[#2563EB] mt-2">
              Digital Masterpieces
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl leading-relaxed">
            Discover the innovative solutions we've crafted for businesses across various industries
          </p>
        </div>

        <div className={`flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => setActiveCategory(category)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-2xl text-sm sm:text-base font-semibold transition-all duration-300 border ${activeCategory === category
                ? 'bg-[#2563EB] text-white shadow-lg border-[#2563EB]'
                : 'bg-white text-slate-700 hover:bg-[#F8FAFC] border-slate-200 hover:shadow-lg'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          {filteredProjects.map((project, index) => (
            <div key={index} className="group relative">
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

                <div className="relative overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    height={192}
                    className="w-full h-40 sm:h-48 object-cover transition-transform duration-700 group-hover:-translate-y-2"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link
                      to={`/portfolio/${project.slug}`}
                      className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg text-[#9333EA]"
                    >
                      <i className="ri-eye-line text-xl"></i>
                    </Link>
                  </div>

                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-bold text-white px-3 py-1.5 rounded-full bg-[#9333EA]/80">
                      {project.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 border-l-2 border-transparent transition-colors duration-300 group-hover:border-[#2563EB]">
                  <h3 className="text-xl font-bold mb-3 text-slate-800">
                    {project.title}
                  </h3>

                  <p className="text-slate-600 mb-4 leading-relaxed text-sm">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {project.technologies.slice(0, 3).map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="text-xs bg-[#F8FAFC] text-slate-700 px-3 py-1.5 rounded-full border border-slate-200"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="text-xs bg-[#F8FAFC] text-slate-500 px-3 py-1.5 rounded-full border border-slate-200">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center transition-all duration-1000 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <Link to="/portfolio" className="group relative inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-10 py-4 rounded-2xl font-bold shadow-lg transition-all duration-300 overflow-hidden">
            <span className="relative z-10 flex items-center">
              View More Projects
              <i className="ri-arrow-right-line ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
});

export default Portfolio;
