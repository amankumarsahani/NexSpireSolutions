import { useState, useEffect } from 'react'

const About = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredMember, setHoveredMember] = useState(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('about')
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const teamMembers = [
    {
      name: "Aman Kumar Sahani",
      role: "Founder & Lead Developer",
      image: "https://media.licdn.com/dms/image/v2/D5635AQH5ci5Ugk1vTw/profile-framedphoto-shrink_400_400/B56ZfvUFh9GUAc-/0/1752066710244?e=1764432000&v=beta&t=tKuFhdqPPrrcdpFEn9N8hDVCx1MTK5HeqUAbZ_ise8I",
      skills: ["React", "Node.js", "Python", "AWS"],
      gradient: "from-blue-500 to-blue-600"
    },
    {
      name: "Anu Kumar",
      role: "Senior UI/UX Designer",
      image: "https://media.licdn.com/dms/image/v2/D5635AQHiirkL_Zj4Kg/profile-framedphoto-shrink_400_400/profile-framedphoto-shrink_400_400/0/1712624046763?e=1764432000&v=beta&t=8cpHTXKwpXe6DU-Gvd8Vf9kdWqGg2TJofno2wUZAVLs",
      skills: ["Figma", "React", "Design Systems"],
      gradient: "from-purple-500 to-purple-600"
    },
    {
      name: "Kshitij Bhardwaj",
      role: "Backend Architect",
      image: "https://media.licdn.com/dms/image/v2/D5635AQFLeeMkFr5TQw/profile-framedphoto-shrink_400_400/B56Zitq2hlH0Ak-/0/1755260348813?e=1764432000&v=beta&t=r4fL3zagpQbN7L5-ubGA70k3szERV5yeJM0cLZTno-E",
      skills: ["Vue.js", "Django", "PostgreSQL", "Docker"],
      gradient: "from-green-500 to-green-600"
    }
  ];

  const stats = [
    {
      number: "150+",
      label: "Projects Completed",
      description: "Successfully delivered across various industries"
    },
    {
      number: "80+",
      label: "Happy Clients",
      description: "Long-term partnerships built on trust"
    },
    {
      number: "98%",
      label: "Success Rate",
      description: "On-time delivery and quality assurance"
    },
    {
      number: "24/7",
      label: "Support Available",
      description: "Round-the-clock technical assistance"
    }
  ];

  const features = [
    {
      icon: "⚡",
      title: "Agile Development",
      description: "Fast, iterative development approach for rapid delivery"
    },
    {
      icon: "🛡️",
      title: "Quality Assurance",
      description: "Rigorous testing and quality control processes"
    },
    {
      icon: "🚀",
      title: "Scalable Solutions",
      description: "Future-proof architecture that grows with your business"
    },
    {
      icon: "💡",
      title: "Innovation Focus",
      description: "Cutting-edge technologies and creative problem solving"
    }
  ];

  return (
    <section id="about" className="relative py-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50 overflow-hidden">
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
              <pattern id="about-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor" />
                <path d="M10 0v20M0 10h20" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#about-grid)" className="text-indigo-400" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Professional Header */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="inline-flex items-center bg-blue-100/80 backdrop-blur-sm border border-blue-200/60 text-blue-700 text-sm font-semibold px-6 py-3 rounded-full mb-6 shadow-lg">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
            More Than An Agency
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            We Are Your Technical
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">
              Co-Founders & Partners
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Most agencies just take tickets. We take ownership. We build the infrastructure that allows visionary companies to scale without limits.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className={`grid lg:grid-cols-2 gap-16 items-center mb-20 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>

          {/* Left: Company Image */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
              <img
                src="https://readdy.ai/api/search-image?query=Modern%20software%20development%20team%20collaborating%20in%20bright%20office%20space%2C%20developers%20working%20together%20on%20computers%2C%20agile%20methodology%20workspace%2C%20diverse%20team%20of%20programmers%20and%20designers%2C%20clean%20contemporary%20office%20with%20natural%20lighting&width=600&height=400&seq=about-professional&orientation=landscape"
                alt="Our professional team at work"
                className="rounded-xl shadow-lg object-cover w-full h-80 transition-transform duration-700 group-hover:scale-[1.02]"
              />

              {/* Floating Stats Cards */}
              <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/30 transform group-hover:scale-105 transition-all duration-500">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">5+</div>
                  <div className="text-xs text-gray-600 font-medium">Years Experience</div>
                </div>
              </div>

              <div className="absolute -top-4 -left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/30 transform group-hover:scale-105 transition-all duration-500">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">150+</div>
                  <div className="text-xs text-gray-600 font-medium">Projects Done</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Company Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Who We Are</h3>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  With over 5 years of experience in the software development industry, Nexspire Solution has
                  established itself as a <strong>leading AI-powered development agency</strong>, trusted by Fortune 500 companies
                  and innovative startups for <strong>digital transformation and modern web solutions</strong>.
                </p>
                <p>
                  Our expert team specializes in <strong>React, Next.js, Node.js, and cloud-native architectures</strong>,
                  combining cutting-edge technology with agile methodologies to deliver
                  <strong>scalable, secure, and performance-optimized applications</strong> that drive real business results.
                </p>
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    Our Mission
                  </h4>
                  <p className="text-sm text-gray-600">
                    To eliminate technical debt and accelerate go-to-market speed for ambitious global brands.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                    Our Vision
                  </h4>
                  <p className="text-sm text-gray-600">
                    To be the infrastructure partner behind the next generation of Fortune 500 digital products.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Creative Why Choose Nexspire Solution */}
        <div className={`mb-24 transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-white/60 backdrop-blur-lg border border-gray-200/50 text-gray-700 text-sm font-semibold px-6 py-3 rounded-2xl mb-8 shadow-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Why Choose Nexspire Solution
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              What Makes Us <span className="text-blue-600">Different</span>
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Four core principles that drive our success and your satisfaction
            </p>
          </div>

          {/* Horizontal Layout */}
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => {
                const isLeft = index % 2 === 0;
                const featureIcons = ['ri-flashlight-line', 'ri-shield-check-line', 'ri-rocket-2-line', 'ri-lightbulb-line'];
                const colors = ['blue', 'purple', 'green', 'orange'];

                return (
                  <div key={index} className={`flex ${isLeft ? 'flex-row' : 'flex-row-reverse'} items-center gap-6 group`}>
                    {/* Icon Section */}
                    <div className="flex-shrink-0">
                      <div className={`relative w-16 h-16 bg-gradient-to-br from-${colors[index]}-400 to-${colors[index]}-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-300`}>
                        <i className={`${featureIcons[index]} text-2xl text-white`}></i>
                        {/* Floating decoration */}
                        <div className={`absolute -top-1 -right-1 w-4 h-4 bg-${colors[index]}-300 rounded-full opacity-80 animate-bounce`}></div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className={`flex-1 ${isLeft ? 'text-left' : 'text-right'}`}>
                      <div className={`bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 ${isLeft ? 'ml-4' : 'mr-4'}`}>
                        <h4 className={`text-xl font-bold text-gray-900 mb-3 ${isLeft ? 'text-left' : 'text-right'}`}>
                          {feature.title}
                        </h4>
                        <p className={`text-gray-600 leading-relaxed ${isLeft ? 'text-left' : 'text-right'}`}>
                          {feature.description}
                        </p>

                        {/* Progress bar */}
                        <div className={`mt-4 ${isLeft ? 'text-left' : 'text-right'}`}>
                          <div className={`h-1 bg-gray-200 rounded-full ${isLeft ? '' : 'ml-auto'} w-24`}>
                            <div className={`h-full bg-gradient-to-r from-${colors[index]}-400 to-${colors[index]}-600 rounded-full animate-pulse`} style={{ width: `${85 + index * 5}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Connection Line */}
                      <div className={`hidden md:block absolute top-1/2 ${isLeft ? 'right-0 translate-x-3' : 'left-0 -translate-x-3'} w-6 h-0.5 bg-gradient-to-r from-${colors[index]}-300 to-${colors[index]}-500`}></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Central Design Element */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden lg:block">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-0 w-24 h-24 bg-white/50 rounded-full top-4 left-4 backdrop-blur-sm border border-white/30"></div>
              <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full top-8 left-8 flex items-center justify-center">
                <i className="ri-award-line text-2xl text-white"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra Modern Track Record Section */}
        <div className={`mb-24 transition-all duration-1000 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 text-gray-800 text-sm font-bold px-8 py-4 rounded-full mb-8 shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500">
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 animate-pulse shadow-lg"></div>
              Performance Metrics
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              <span className="block text-gray-800 font-bold">Numbers That</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2 font-bold">
                Define Excellence
              </span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our achievements speak volumes about our dedication to delivering exceptional results
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
            {stats.map((stat, index) => {
              const colors = [
                { primary: '#6366f1', secondary: '#8b5cf6', bg: 'from-indigo-500/20 to-purple-500/20' },
                { primary: '#8b5cf6', secondary: '#ec4899', bg: 'from-purple-500/20 to-pink-500/20' },
                { primary: '#10b981', secondary: '#06b6d4', bg: 'from-emerald-500/20 to-cyan-500/20' },
                { primary: '#f59e0b', secondary: '#ef4444', bg: 'from-amber-500/20 to-red-500/20' }
              ];
              const icons = [
                'ri-bar-chart-box-line',
                'ri-rocket-line',
                'ri-flashlight-line',
                'ri-rocket-2-line'
              ];

              return (
                <div key={index} className="group relative">
                  {/* Main Container */}
                  <div className="relative">
                    {/* Background Glow */}
                    <div className={`absolute -inset-4 bg-gradient-to-r ${colors[index].bg} rounded-3xl blur-2xl opacity-60 transition-all duration-700`}></div>

                    {/* Glass Card */}
                    <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/40 transition-all duration-500 transform -translate-y-2">

                      {/* Icon */}
                      <div className="text-center mb-6">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <div
                            className="w-full h-full rounded-2xl flex items-center justify-center shadow-xl scale-110 transition-transform duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${colors[index].primary}, ${colors[index].secondary})`
                            }}
                          >
                            <i className={`${icons[index]} text-3xl text-white`}></i>
                          </div>
                          {/* Icon Glow */}
                          <div
                            className="absolute inset-0 rounded-2xl blur-lg opacity-40"
                            style={{
                              background: `linear-gradient(135deg, ${colors[index].primary}, ${colors[index].secondary})`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Animated Counter */}
                      <div className="text-center mb-6">
                        <div className="relative">
                          <div
                            className="text-5xl font-black mb-2 scale-105 transition-all duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${colors[index].primary}, ${colors[index].secondary})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}
                          >
                            {stat.number}
                          </div>

                          {/* Animated Underline */}
                          <div
                            className="h-1 w-16 mx-auto rounded-full transition-all duration-500"
                            style={{ backgroundColor: colors[index].primary }}
                          ></div>
                        </div>
                      </div>

                      {/* Label */}
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-gray-900 transition-colors duration-300">
                          {stat.label}
                        </h4>
                      </div>

                      {/* Floating Elements */}
                      <div
                        className="absolute top-4 right-4 w-4 h-4 rounded-full opacity-70 transition-all duration-500 animate-pulse"
                        style={{ backgroundColor: colors[index].primary }}
                      ></div>
                      <div
                        className="absolute bottom-4 left-4 w-3 h-3 rounded-full opacity-50 transition-all duration-700"
                        style={{ backgroundColor: colors[index].secondary }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>


      </div>
    </section>
  );
};

export default About;