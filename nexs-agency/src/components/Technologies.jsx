import { useState, useEffect, useRef, memo } from 'react'

const Technologies = memo(function Technologies() {
  const [activeTab, setActiveTab] = useState("Frontend")
  const [isVisible, setIsVisible] = useState(false)
  const [allTechs, setAllTechs] = useState([])
  const sliderRef = useRef(null)

  const techStacks = {
    Frontend: {
      title: "Frontend Development",
      description: "Modern UI frameworks and libraries",
      technologies: [
        { name: "React", icon: "ri-reactjs-line", color: "from-blue-400 to-blue-600" },
        { name: "Vue.js", icon: "ri-vuejs-line", color: "from-green-400 to-green-600" },
        { name: "Angular", icon: "ri-angularjs-line", color: "from-red-400 to-red-600" },
        { name: "Next.js", icon: "ri-code-s-slash-line", color: "from-gray-400 to-gray-600" },
        { name: "TypeScript", icon: "ri-code-line", color: "from-blue-500 to-blue-700" },
        { name: "Tailwind", icon: "ri-css3-line", color: "from-cyan-400 to-cyan-600" }
      ]
    },
    Backend: {
      title: "Backend Development",
      description: "Robust server-side technologies",
      technologies: [
        { name: "Node.js", icon: "ri-nodejs-line", color: "from-green-400 to-green-600" },
        { name: "Python", icon: "ri-code-line", color: "from-yellow-400 to-yellow-600" },
        { name: "Java", icon: "ri-cup-line", color: "from-orange-400 to-orange-600" },
        { name: "PHP", icon: "ri-code-s-line", color: "from-purple-400 to-purple-600" },
        { name: "Go", icon: "ri-flashlight-line", color: "from-blue-400 to-blue-600" },
        { name: "C#", icon: "ri-microsoft-line", color: "from-blue-500 to-blue-700" }
      ]
    },
    Mobile: {
      title: "Mobile Development",
      description: "Cross-platform and native mobile apps",
      technologies: [
        { name: "React Native", icon: "ri-smartphone-line", color: "from-blue-400 to-blue-600" },
        { name: "Flutter", icon: "ri-flutter-line", color: "from-blue-400 to-cyan-600" },
        { name: "iOS Swift", icon: "ri-apple-line", color: "from-gray-400 to-gray-600" },
        { name: "Android", icon: "ri-android-line", color: "from-green-400 to-green-600" },
        { name: "Ionic", icon: "ri-flashlight-line", color: "from-blue-500 to-purple-600" },
        { name: "Xamarin", icon: "ri-microsoft-line", color: "from-purple-400 to-purple-600" }
      ]
    },
    "Cloud & DevOps": {
      title: "Cloud & DevOps",
      description: "Scalable infrastructure and deployment",
      technologies: [
        { name: "AWS", icon: "ri-amazon-line", color: "from-orange-400 to-orange-600" },
        { name: "Azure", icon: "ri-microsoft-line", color: "from-blue-400 to-blue-600" },
        { name: "Docker", icon: "ri-ship-line", color: "from-blue-500 to-cyan-600" },
        { name: "Kubernetes", icon: "ri-ship-2-line", color: "from-blue-600 to-purple-600" },
        { name: "Jenkins", icon: "ri-settings-3-line", color: "from-gray-400 to-gray-600" },
        { name: "Terraform", icon: "ri-building-line", color: "from-purple-400 to-purple-600" }
      ]
    },
    Database: {
      title: "Database Technologies",
      description: "Reliable data storage and management",
      technologies: [
        { name: "MongoDB", icon: "ri-leaf-line", color: "from-green-400 to-green-600" },
        { name: "PostgreSQL", icon: "ri-database-2-line", color: "from-blue-400 to-blue-600" },
        { name: "MySQL", icon: "ri-database-line", color: "from-orange-400 to-orange-600" },
        { name: "Redis", icon: "ri-flashlight-line", color: "from-red-400 to-red-600" },
        { name: "Firebase", icon: "ri-fire-line", color: "from-yellow-400 to-orange-600" },
        { name: "Elasticsearch", icon: "ri-search-line", color: "from-yellow-500 to-yellow-700" }
      ]
    },
    "Design & Analytics": {
      title: "Design & Analytics",
      description: "User experience and data insights",
      technologies: [
        { name: "Figma", icon: "ri-palette-line", color: "from-purple-400 to-pink-600" },
        { name: "Adobe XD", icon: "ri-artboard-line", color: "from-pink-400 to-red-600" },
        { name: "Sketch", icon: "ri-pencil-ruler-line", color: "from-orange-400 to-yellow-600" },
        { name: "Analytics", icon: "ri-bar-chart-line", color: "from-blue-400 to-blue-600" },
        { name: "Hotjar", icon: "ri-fire-line", color: "from-red-400 to-orange-600" },
        { name: "Mixpanel", icon: "ri-pie-chart-line", color: "from-purple-400 to-purple-600" }
      ]
    }
  }

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Update technologies when active tab changes
  useEffect(() => {
    const selectedTechs = techStacks[activeTab].technologies
    // Duplicate for seamless loop
    setAllTechs([...selectedTechs, ...selectedTechs])
  }, [activeTab])

  return (
    <section id="technologies" className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50 overflow-hidden">
      {/* Background Elements - Same as Services */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-pink-500/3 via-transparent to-cyan-500/3"></div>

        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-200/15 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-bl from-purple-200/12 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-indigo-200/10 to-violet-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <defs>
              <pattern id="tech-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor" />
                <path d="M10 0v20M0 10h20" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tech-grid)" className="text-indigo-400" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="inline-flex items-center bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-xl border border-white/20 text-gray-800 text-sm font-bold px-8 py-4 rounded-full mb-8 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500">
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full mr-3 animate-pulse shadow-lg"></div>
            Our Tech Stack
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
            <span className="block text-gray-800 font-bold">Technologies We</span>
            <span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 font-bold">
              Master & Excel
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            We leverage cutting-edge technologies and industry best practices to build scalable solutions
          </p>
        </div>

        {/* Static Category Tabs */}
        <div className={`flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          {Object.keys(techStacks).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-2xl text-sm sm:text-base font-semibold transition-all duration-500 whitespace-nowrap backdrop-blur-sm border ${activeTab === tab
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 border-cyan-400/50 scale-105'
                : 'bg-white/60 text-gray-700 hover:bg-white/80 border-white/30 hover:shadow-lg'
                }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTab === tab ? 'bg-white' : 'bg-cyan-500'
                  }`}></div>
                <span>{tab}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Creative Tech Stack Layout */}
        <div className={`mb-16 transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          {/* Category Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-white/70 backdrop-blur-lg border border-gray-200/50 text-gray-700 text-lg font-bold px-8 py-4 rounded-2xl mb-6 shadow-lg">
              <div className="w-3 h-3 bg-cyan-500 rounded-full mr-3 animate-pulse"></div>
              {techStacks[activeTab].title}
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {techStacks[activeTab].description}
            </p>
          </div>

          {/* Moving Tech Slider - Selected Category Only */}
          <div className="max-w-6xl mx-auto overflow-hidden" ref={sliderRef}>
            <div className="relative">
              {/* Gradient Masks for smooth edges */}
              <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

              {/* Sliding Container */}
              <div className="flex animate-slide-left space-x-6 w-max">
                {allTechs.map((tech, index) => (
                  <div
                    key={index}
                    data-tech-index={index}
                    className="group relative flex-shrink-0"
                  >
                    {/* Glow Effect Background */}
                    <div className={`absolute -inset-1 bg-gradient-to-r ${tech.color} rounded-2xl blur-sm opacity-0 group-hover:opacity-60 transition-all duration-500`}></div>

                    {/* Main Container */}
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group w-24 h-24 sm:w-32 sm:h-32">

                      {/* Top Accent Line */}
                      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r ${tech.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                      {/* Icon */}
                      <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <div className={`w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-br ${tech.color} rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                          <i className={`${tech.icon} text-lg sm:text-2xl text-white`}></i>
                        </div>

                        {/* Tech Name */}
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 text-center leading-tight group-hover:text-gray-900 transition-colors duration-300">
                          {tech.name}
                        </h4>
                      </div>

                      {/* Subtle Corner Dots */}
                      <div className={`absolute top-2 right-2 w-1.5 h-1.5 bg-gradient-to-r ${tech.color} rounded-full opacity-0 group-hover:opacity-60 transition-all duration-500 animate-pulse`}></div>
                      <div className={`absolute bottom-2 left-2 w-1 h-1 bg-gradient-to-r ${tech.color} rounded-full opacity-0 group-hover:opacity-40 transition-all duration-700`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tech Stack Info */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <i className="ri-code-line text-2xl text-white"></i>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Modern Stack</h4>
                <p className="text-sm text-gray-600">Latest versions and cutting-edge technologies</p>
              </div>

              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <i className="ri-rocket-2-line text-2xl text-white"></i>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">High Performance</h4>
                <p className="text-sm text-gray-600">Optimized for speed and scalability</p>
              </div>

              <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <i className="ri-shield-check-line text-2xl text-white"></i>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Production Ready</h4>
                <p className="text-sm text-gray-600">Battle-tested in enterprise environments</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
});

export default Technologies