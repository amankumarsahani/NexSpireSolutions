import { useState, useEffect } from 'react'

const Portfolio = () => {
  const [activeCategory, setActiveCategory] = useState("All")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const projects = [
    {
      title: "E-commerce Platform",
      category: "Web Development",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      description: "Modern e-commerce platform with advanced product filtering and secure payment integration.",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"],
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      title: "Food Delivery App",
      category: "Mobile Development",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      description: "Mobile app for food delivery with real-time tracking and multiple payment options.",
      technologies: ["React Native", "Firebase", "Maps API", "PayPal"],
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      title: "Healthcare Dashboard",
      category: "Web Development",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop",
      description: "Comprehensive healthcare management system with patient records and appointment scheduling.",
      technologies: ["Vue.js", "Python", "PostgreSQL", "Docker"],
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      title: "Real Estate Portal",
      category: "Full Stack",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
      description: "Property listing platform with advanced search filters and virtual tours.",
      technologies: ["Next.js", "Prisma", "MySQL", "AWS"],
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      title: "Fitness Tracker",
      category: "Mobile Development",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      description: "Mobile fitness app with workout tracking, nutrition planning, and progress analytics.",
      technologies: ["Flutter", "Dart", "Firebase", "Charts"],
      liveUrl: "#",
      githubUrl: "#"
    },
    {
      title: "Inventory Management",
      category: "Enterprise",
      image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop",
      description: "Enterprise inventory management system with analytics and automated reporting.",
      technologies: ["Angular", "Java", "Spring", "Oracle"],
      liveUrl: "#",
      githubUrl: "#"
    }
  ];

  const categories = ["All", "Web Development", "Mobile Development", "Full Stack", "Enterprise"];

  const filteredProjects = activeCategory === "All" 
    ? projects 
    : projects.filter(project => project.category === activeCategory)

  return (
    <section id="portfolio" className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50 overflow-hidden">
      {/* Background Elements - Same as Services */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-pink-500/3 via-transparent to-cyan-500/3"></div>
        
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-200/15 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-bl from-purple-200/12 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-indigo-200/10 to-violet-200/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <defs>
              <pattern id="portfolio-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor"/>
                <path d="M10 0v20M0 10h20" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#portfolio-grid)" className="text-indigo-400"/>
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="inline-flex items-center bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl border border-white/20 text-gray-800 text-sm font-bold px-8 py-4 rounded-full mb-8 shadow-2xl hover:shadow-violet-500/20 transition-all duration-500">
            <div className="w-3 h-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full mr-3 animate-pulse shadow-lg"></div>
            Our Portfolio
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
            <span className="block text-gray-800 font-bold">Showcasing Our</span>
            <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mt-2 font-bold">
              Digital Masterpieces
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            Discover the innovative solutions we've crafted for businesses across various industries
          </p>
        </div>

        {/* Modern Filter Buttons */}
        <div className={`flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000 delay-300 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => setActiveCategory(category)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-2xl text-sm sm:text-base font-semibold transition-all duration-300 backdrop-blur-sm border ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 border-violet-400/50'
                  : 'bg-white/60 text-gray-700 hover:bg-white/80 border-white/30 hover:shadow-lg'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Enhanced Portfolio Grid */}
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000 delay-500 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {filteredProjects.map((project, index) => {
            const cardColors = [
              { primary: '#8b5cf6', secondary: '#a855f7', bg: 'from-violet-500/15 to-purple-500/15' },
              { primary: '#ec4899', secondary: '#f43f5e', bg: 'from-pink-500/15 to-rose-500/15' },
              { primary: '#06b6d4', secondary: '#0891b2', bg: 'from-cyan-500/15 to-sky-500/15' },
              { primary: '#f59e0b', secondary: '#d97706', bg: 'from-amber-500/15 to-orange-500/15' },
              { primary: '#10b981', secondary: '#059669', bg: 'from-emerald-500/15 to-green-500/15' },
              { primary: '#6366f1', secondary: '#4f46e5', bg: 'from-indigo-500/15 to-blue-500/15' }
            ];
            const colorIndex = index % cardColors.length;

            return (
              <div key={index} className="group relative">
                {/* Background Glow */}
                <div className={`absolute -inset-2 bg-gradient-to-r ${cardColors[colorIndex].bg} rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-500`}></div>
                
                {/* Main Card */}
                <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-white/50 group-hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2">
                  
                  {/* Image Section */}
                  <div className="relative overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Action Buttons */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex space-x-4">
                        <a
                          href={project.liveUrl}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg hover:scale-110"
                          style={{ color: cardColors[colorIndex].primary }}
                        >
                          <i className="ri-external-link-line text-lg sm:text-xl"></i>
                        </a>
                        <a
                          href={project.githubUrl}
                          className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-800 hover:text-white transition-all duration-300 shadow-lg hover:scale-110"
                        >
                          <i className="ri-github-line text-xl"></i>
                        </a>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span 
                        className="text-xs font-bold text-white px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20"
                        style={{ backgroundColor: `${cardColors[colorIndex].primary}80` }}
                      >
                        {project.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-6">
                    <h3 
                      className="text-xl font-bold mb-3 group-hover:scale-105 transition-transform duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${cardColors[colorIndex].primary}, ${cardColors[colorIndex].secondary})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                      {project.description}
                    </p>
                    
                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.slice(0, 3).map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="text-xs bg-gray-100/80 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200/50 backdrop-blur-sm"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="text-xs bg-gray-100/80 text-gray-500 px-3 py-1.5 rounded-full border border-gray-200/50">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, ${cardColors[colorIndex].primary}, ${cardColors[colorIndex].secondary})` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Enhanced View More Button */}
        <div className={`text-center transition-all duration-1000 delay-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <button className="group relative bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <span className="relative z-10 flex items-center">
              View More Projects
              <i className="ri-arrow-right-line ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;