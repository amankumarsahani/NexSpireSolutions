import { useState, useEffect } from 'react'

const Services = () => {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  const services = [
    {
      icon: "ri-code-line",
      title: "Web Development",
      description: "Modern, responsive websites built with cutting-edge technologies and industry best practices for optimal performance.",
      features: ["React & Next.js", "Node.js & Python", "Mobile-First Design", "Performance Optimization"],
      gradient: "from-blue-500 to-cyan-500",
      bgPattern: "bg-blue-50",
      accentColor: "blue"
    },
    {
      icon: "ri-smartphone-line",
      title: "Mobile Apps",
      description: "Native and cross-platform mobile applications that deliver exceptional user experiences across all devices.",
      features: ["iOS & Android", "React Native", "Flutter Development", "App Store Deployment"],
      gradient: "from-purple-500 to-pink-500",
      bgPattern: "bg-purple-50",
      accentColor: "purple"
    },
    {
      icon: "ri-cloud-line",
      title: "Cloud Solutions",
      description: "Scalable cloud infrastructure and DevOps solutions that grow with your business needs and requirements.",
      features: ["AWS & Azure", "Docker & Kubernetes", "CI/CD Pipelines", "Auto-scaling Systems"],
      gradient: "from-green-500 to-teal-500",
      bgPattern: "bg-green-50",
      accentColor: "green"
    },
    {
      icon: "ri-palette-line",
      title: "UI/UX Design",
      description: "Beautiful, intuitive designs that enhance user experience and drive engagement through thoughtful interface design.",
      features: ["User Research", "Interactive Prototypes", "Design Systems", "Accessibility Focus"],
      gradient: "from-orange-500 to-red-500",
      bgPattern: "bg-orange-50",
      accentColor: "orange"
    },
    {
      icon: "ri-shopping-cart-line",
      title: "E-commerce Solutions",
      description: "Complete e-commerce platforms with advanced payment integration and comprehensive inventory management systems.",
      features: ["Custom E-commerce", "Payment Integration", "Inventory Management", "Analytics Dashboard"],
      gradient: "from-indigo-500 to-blue-500",
      bgPattern: "bg-indigo-50",
      accentColor: "indigo"
    },
    {
      icon: "ri-shield-check-line",
      title: "Security & Testing",
      description: "Comprehensive security audits and rigorous testing protocols to ensure your applications are secure and reliable.",
      features: ["Security Audits", "Penetration Testing", "Code Quality Reviews", "Compliance Standards"],
      gradient: "from-emerald-500 to-green-500",
      bgPattern: "bg-emerald-50",
      accentColor: "emerald"
    }
  ];

  // Auto slider functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(services.length / 3))
    }, 4000)

    return () => clearInterval(timer)
  }, [services.length])

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const servicesPerSlide = 3
  const totalSlides = Math.ceil(services.length / servicesPerSlide)

  return (
    <section id="services" className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-pink-500/3 via-transparent to-cyan-500/3"></div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-200/15 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-bl from-purple-200/12 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-indigo-200/10 to-violet-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

        {/* Tech pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <defs>
              <pattern id="services-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor" />
                <path d="M10 0v20M0 10h20" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#services-grid)" className="text-indigo-400" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center bg-gradient-to-r from-indigo-100/80 via-purple-100/70 to-pink-100/80 backdrop-blur-sm border border-indigo-200/60 rounded-full px-8 py-4 text-indigo-700 font-semibold text-sm mb-8 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group">
            <i className="ri-service-line mr-2 group-hover:rotate-12 transition-transform"></i>
            Our Expert Services
            <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full ml-3 animate-pulse"></div>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            <span className="block mb-1">Comprehensive</span>
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-extrabold" style={{
              filter: 'drop-shadow(0 0 6px rgba(79, 70, 229, 0.2)) drop-shadow(0 0 12px rgba(147, 51, 234, 0.15))'
            }}>
              Digital Solutions
            </span>
          </h2>

          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            From innovative web development to cutting-edge mobile apps, we deliver
            <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> end-to-end solutions</span> that transform
            your business and drive sustainable growth in the digital landscape.
          </p>
        </div>

        {/* Enhanced Services Carousel */}
        <div className="relative mb-16">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`
              }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 px-4">
                    {services.slice(slideIndex * servicesPerSlide, (slideIndex + 1) * servicesPerSlide).map((service, index) => {
                      const actualIndex = slideIndex * servicesPerSlide + index;
                      return (
                        <div
                          key={actualIndex}
                          className={`group relative bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 border border-white/60 overflow-hidden ${hoveredCard === actualIndex ? 'scale-[1.02] shadow-2xl' : ''
                            }`}
                          onMouseEnter={() => setHoveredCard(actualIndex)}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          {/* Enhanced Background Pattern */}
                          <div className={`absolute inset-0 ${service.bgPattern} opacity-0 group-hover:opacity-20 transition-opacity duration-700`}></div>

                          {/* Multiple Gradient Lines */}
                          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${service.gradient}`}></div>
                          <div className={`absolute bottom-0 right-0 w-1/2 h-0.5 bg-gradient-to-l ${service.gradient} opacity-60`}></div>

                          {/* Enhanced Floating Icon */}
                          <div className="relative mb-8">
                            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${service.gradient} rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl group-hover:shadow-2xl`}>
                              <i className={`${service.icon} text-2xl sm:text-3xl text-white group-hover:scale-110 transition-transform duration-300`}></i>

                              {/* Icon glow effect */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} rounded-3xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                            </div>

                            {/* Enhanced floating elements */}
                            <div className={`absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-bounce shadow-lg`}></div>
                            <div className={`absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-bounce shadow-lg`} style={{ animationDelay: '0.2s' }}></div>
                          </div>

                          {/* Enhanced Content */}
                          <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 group-hover:text-gray-800 transition-colors duration-300">
                            {service.title}
                          </h3>

                          <p className="relative z-10 text-gray-600 mb-4 sm:mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-sm sm:text-base">
                            {service.description}
                          </p>

                          {/* Enhanced Feature List */}
                          <ul className="relative z-10 space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                            {service.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-center text-sm text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                                <div className={`w-5 h-5 bg-gradient-to-r ${service.gradient} rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                                  <i className="ri-check-line text-white text-xs"></i>
                                </div>
                                <span className="font-semibold">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Enhanced Card glow effect */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}></div>

                          {/* Border glow */}
                          <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} style={{
                            background: `linear-gradient(145deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
                            backdropFilter: 'blur(1px)'
                          }}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Navigation Arrows - Below cards */}
          <div className="flex justify-center gap-4 mt-6 lg:hidden">
            <button
              onClick={() => goToSlide(currentSlide === 0 ? totalSlides - 1 : currentSlide - 1)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
            >
              <i className="ri-arrow-left-line text-lg text-gray-700 group-hover:text-indigo-600 transition-colors"></i>
            </button>

            <button
              onClick={() => goToSlide(currentSlide === totalSlides - 1 ? 0 : currentSlide + 1)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
            >
              <i className="ri-arrow-right-line text-lg text-gray-700 group-hover:text-indigo-600 transition-colors"></i>
            </button>
          </div>

          {/* Carousel Navigation Dots */}
          <div className="flex justify-center mt-6 space-x-3">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 scale-125 shadow-lg'
                  : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                  }`}
              />
            ))}
          </div>

          {/* Carousel Progress Bar */}
          <div className="flex justify-center mt-4">
            <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation Arrows - Positioned outside of cards */}
          <button
            onClick={() => goToSlide(currentSlide === 0 ? totalSlides - 1 : currentSlide - 1)}
            className="absolute -left-16 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110 lg:block hidden"
          >
            <i className="ri-arrow-left-line text-xl text-gray-700 group-hover:text-indigo-600 transition-colors"></i>
          </button>

          <button
            onClick={() => goToSlide(currentSlide === totalSlides - 1 ? 0 : currentSlide + 1)}
            className="absolute -right-16 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group hover:scale-110 lg:block hidden"
          >
            <i className="ri-arrow-right-line text-xl text-gray-700 group-hover:text-indigo-600 transition-colors"></i>
          </button>
        </div>

        {/* Enhanced Call-to-Action Section */}
        <div className="relative">
          {/* Background with multiple gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-600/20 to-transparent rounded-3xl"></div>
          <div className="absolute inset-0 bg-black/5 rounded-3xl"></div>

          <div className="relative z-10 text-center p-12 text-white overflow-hidden rounded-3xl">
            <h3 className="text-3xl md:text-4xl font-bold mb-5" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f3e8ff 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>
              Ready to Transform Your Business?
            </h3>

            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Let's discuss your project and create a custom solution that drives results.
              Get a <span className="font-semibold text-white">free consultation</span> with our experts today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact"
                className="group bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 inline-flex items-center justify-center shadow-xl hover:shadow-2xl text-base"
              >
                Start Your Project
                <i className="ri-rocket-2-line ml-2 text-lg group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"></i>
              </a>

              <a href="tel:+917696309551" className="group bg-white/15 backdrop-blur-md text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold hover:bg-white/25 hover:border-white/50 transition-all duration-300 inline-flex items-center justify-center transform hover:scale-105 hover:-translate-y-1 text-base shadow-lg">
                <i className="ri-phone-line mr-2 text-lg group-hover:rotate-12 transition-transform duration-300"></i>
                Schedule Call
              </a>
            </div>
          </div>

          {/* Enhanced background decorations */}
          <div className="absolute top-8 right-8 w-32 h-32 border-2 border-white/20 rounded-full animate-spin-slow opacity-60"></div>
          <div className="absolute bottom-8 left-8 w-24 h-24 border-2 border-white/15 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-12 w-3 h-3 bg-white/40 rounded-full animate-ping"></div>
          <div className="absolute top-12 right-1/3 w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 right-12 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-bounce opacity-80"></div>

          {/* Floating particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;