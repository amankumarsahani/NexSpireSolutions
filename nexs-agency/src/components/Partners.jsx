import { useState, useEffect } from 'react'

function Partners() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section id="partners" className="relative py-20 bg-white overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0">
        {/* Geometric Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
            <defs>
              <pattern id="hexagon-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 5 L45 15 L45 35 L30 45 L15 35 L15 15 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-200" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagon-pattern)" />
          </svg>
        </div>

        {/* Subtle Gradient Overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-emerald-50/20 via-transparent to-cyan-50/20"></div>

        {/* Modern Floating Elements */}
        <div className="absolute top-32 right-20 w-2 h-32 bg-gradient-to-b from-blue-400/20 to-transparent rounded-full"></div>
        <div className="absolute bottom-40 left-16 w-32 h-2 bg-gradient-to-r from-purple-400/20 to-transparent rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 border border-emerald-200/30 rounded-full"></div>
        <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-cyan-200/20 rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 text-gray-700 text-sm font-semibold px-6 py-3 rounded-full mb-8 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
            <span>Trusted Partnerships</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="block text-gray-900">Partners &</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mt-1">
              Certifications
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Building excellence through strategic partnerships and industry-recognized certifications that ensure world-class solutions
          </p>
        </div>

        {/* Clean Stats Section */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          {[
            { icon: "ri-team-line", number: "50+", label: "Technology Partners", color: "from-blue-500 to-blue-600", bgColor: "bg-blue-50", textColor: "text-blue-600" },
            { icon: "ri-award-line", number: "30+", label: "Certifications", color: "from-purple-500 to-purple-600", bgColor: "bg-purple-50", textColor: "text-purple-600" },
            { icon: "ri-cloud-line", number: "12+", label: "Cloud Platforms", color: "from-emerald-500 to-emerald-600", bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
            { icon: "ri-shield-check-line", number: "100%", label: "Success Rate", color: "from-orange-500 to-orange-600", bgColor: "bg-orange-50", textColor: "text-orange-600" }
          ].map((stat, index) => (
            <div key={index} className="group text-center">
              {/* Main Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 group-hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1">
                {/* Icon */}
                <div className={`w-16 h-16 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`${stat.icon} text-2xl ${stat.textColor}`}></i>
                </div>

                {/* Number */}
                <div className={`text-3xl font-bold mb-2 ${stat.textColor}`}>
                  {stat.number}
                </div>

                {/* Label */}
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Technology Partners Slider */}
        <div className={`mb-20 transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Technology Partners
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Strategic alliances with industry-leading technology providers
            </p>
          </div>

          {/* Partners Slider */}
          <div className="max-w-7xl mx-auto overflow-hidden">
            <div className="relative">
              {/* Gradient Masks */}
              <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

              {/* Sliding Container */}
              <div className="flex animate-slide-left space-x-6 w-max">
                {/* First set */}
                {[
                  { logo: "AWS", name: "Amazon Web Services", type: "Cloud Partner", desc: "Certified AWS solutions architect with expertise in scalable cloud infrastructure", bgColor: "bg-orange-50", iconColor: "text-orange-600", borderColor: "border-orange-200" },
                  { logo: "Azure", name: "Microsoft Azure", type: "Cloud Partner", desc: "Azure certified professional delivering enterprise cloud transformation", bgColor: "bg-blue-50", iconColor: "text-blue-600", borderColor: "border-blue-200" },
                  { logo: "GCP", name: "Google Cloud", type: "Cloud Partner", desc: "Google Cloud certified engineer specializing in AI/ML and data analytics", bgColor: "bg-red-50", iconColor: "text-red-600", borderColor: "border-red-200" },
                  { logo: "React", name: "React Ecosystem", type: "Frontend Framework", desc: "Expert React development with Next.js, TypeScript, and modern tooling", bgColor: "bg-cyan-50", iconColor: "text-cyan-600", borderColor: "border-cyan-200" },
                  { logo: "Node", name: "Node.js", type: "Runtime Platform", desc: "Node.js expertise for scalable backend APIs and full-stack applications", bgColor: "bg-green-50", iconColor: "text-green-600", borderColor: "border-green-200" },
                  { logo: "MongoDB", name: "MongoDB", type: "Database Partner", desc: "MongoDB certified developer for modern NoSQL database solutions", bgColor: "bg-emerald-50", iconColor: "text-emerald-600", borderColor: "border-emerald-200" }
                ].map((partner, index) => (
                  <div key={`first-${index}`} className="group flex-shrink-0 w-80">
                    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${partner.borderColor} group-hover:shadow-md transition-all duration-300 transform group-hover:-translate-y-1 h-full`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 ${partner.bgColor} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
                          <span className={`text-sm font-bold ${partner.iconColor}`}>{partner.logo}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-base mb-1">
                            {partner.name}
                          </h4>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${partner.bgColor} ${partner.iconColor}`}>
                            {partner.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {partner.desc}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Duplicate set for seamless loop */}
                {[
                  { logo: "AWS", name: "Amazon Web Services", type: "Cloud Partner", desc: "Certified AWS solutions architect with expertise in scalable cloud infrastructure", bgColor: "bg-orange-50", iconColor: "text-orange-600", borderColor: "border-orange-200" },
                  { logo: "Azure", name: "Microsoft Azure", type: "Cloud Partner", desc: "Azure certified professional delivering enterprise cloud transformation", bgColor: "bg-blue-50", iconColor: "text-blue-600", borderColor: "border-blue-200" },
                  { logo: "GCP", name: "Google Cloud", type: "Cloud Partner", desc: "Google Cloud certified engineer specializing in AI/ML and data analytics", bgColor: "bg-red-50", iconColor: "text-red-600", borderColor: "border-red-200" },
                  { logo: "React", name: "React Ecosystem", type: "Frontend Framework", desc: "Expert React development with Next.js, TypeScript, and modern tooling", bgColor: "bg-cyan-50", iconColor: "text-cyan-600", borderColor: "border-cyan-200" },
                  { logo: "Node", name: "Node.js", type: "Runtime Platform", desc: "Node.js expertise for scalable backend APIs and full-stack applications", bgColor: "bg-green-50", iconColor: "text-green-600", borderColor: "border-green-200" },
                  { logo: "MongoDB", name: "MongoDB", type: "Database Partner", desc: "MongoDB certified developer for modern NoSQL database solutions", bgColor: "bg-emerald-50", iconColor: "text-emerald-600", borderColor: "border-emerald-200" }
                ].map((partner, index) => (
                  <div key={`second-${index}`} className="group flex-shrink-0 w-80">
                    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${partner.borderColor} group-hover:shadow-md transition-all duration-300 transform group-hover:-translate-y-1 h-full`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 ${partner.bgColor} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
                          <span className={`text-sm font-bold ${partner.iconColor}`}>{partner.logo}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-base mb-1">
                            {partner.name}
                          </h4>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${partner.bgColor} ${partner.iconColor}`}>
                            {partner.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {partner.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Professional Certifications Slider */}
        <div className={`mb-20 transition-all duration-1000 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Professional Certifications
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Industry-recognized credentials ensuring expertise and quality delivery
            </p>
          </div>

          {/* Certifications Slider */}
          <div className="max-w-7xl mx-auto overflow-hidden">
            <div className="relative">
              {/* Gradient Masks */}
              <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

              {/* Sliding Container - Left to Right animation for certificates */}
              <div className="flex animate-slide-right space-x-6 w-max">
                {/* First set */}
                {[
                  { icon: "ri-award-line", title: "AWS Solutions Architect", provider: "Amazon Web Services", year: "2024", bgColor: "bg-orange-50", iconColor: "text-orange-600" },
                  { icon: "ri-medal-line", title: "Azure Developer Associate", provider: "Microsoft", year: "2024", bgColor: "bg-blue-50", iconColor: "text-blue-600" },
                  { icon: "ri-trophy-line", title: "Google Cloud Professional", provider: "Google Cloud", year: "2024", bgColor: "bg-red-50", iconColor: "text-red-600" },
                  { icon: "ri-shield-star-line", title: "Kubernetes Administrator", provider: "CNCF", year: "2024", bgColor: "bg-purple-50", iconColor: "text-purple-600" },
                  { icon: "ri-star-line", title: "MongoDB Developer", provider: "MongoDB Inc.", year: "2024", bgColor: "bg-green-50", iconColor: "text-green-600" },
                  { icon: "ri-flashlight-line", title: "Certified Scrum Master", provider: "Scrum Alliance", year: "2024", bgColor: "bg-cyan-50", iconColor: "text-cyan-600" }
                ].map((cert, index) => (
                  <div key={`first-${index}`} className="group flex-shrink-0 w-72">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group-hover:shadow-md transition-all duration-300 transform group-hover:-translate-y-1 h-full">
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 ${cert.bgColor} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
                          <i className={`${cert.icon} text-xl ${cert.iconColor}`}></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-base mb-1">
                            {cert.title}
                          </h4>
                          <p className="text-gray-500 text-sm">{cert.provider}</p>
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${cert.bgColor} ${cert.iconColor}`}>
                          {cert.year}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <i className={`ri-verified-badge-line mr-2 ${cert.iconColor}`}></i>
                        <span>Verified Certification</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Duplicate set for seamless loop */}
                {[
                  { icon: "ri-award-line", title: "AWS Solutions Architect", provider: "Amazon Web Services", year: "2024", bgColor: "bg-orange-50", iconColor: "text-orange-600" },
                  { icon: "ri-medal-line", title: "Azure Developer Associate", provider: "Microsoft", year: "2024", bgColor: "bg-blue-50", iconColor: "text-blue-600" },
                  { icon: "ri-trophy-line", title: "Google Cloud Professional", provider: "Google Cloud", year: "2024", bgColor: "bg-red-50", iconColor: "text-red-600" },
                  { icon: "ri-shield-star-line", title: "Kubernetes Administrator", provider: "CNCF", year: "2024", bgColor: "bg-purple-50", iconColor: "text-purple-600" },
                  { icon: "ri-star-line", title: "MongoDB Developer", provider: "MongoDB Inc.", year: "2024", bgColor: "bg-green-50", iconColor: "text-green-600" },
                  { icon: "ri-flashlight-line", title: "Certified Scrum Master", provider: "Scrum Alliance", year: "2024", bgColor: "bg-cyan-50", iconColor: "text-cyan-600" }
                ].map((cert, index) => (
                  <div key={`second-${index}`} className="group flex-shrink-0 w-72">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group-hover:shadow-md transition-all duration-300 transform group-hover:-translate-y-1 h-full">
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 ${cert.bgColor} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
                          <i className={`${cert.icon} text-xl ${cert.iconColor}`}></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-base mb-1">
                            {cert.title}
                          </h4>
                          <p className="text-gray-500 text-sm">{cert.provider}</p>
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${cert.bgColor} ${cert.iconColor}`}>
                          {cert.year}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <i className={`ri-verified-badge-line mr-2 ${cert.iconColor}`}></i>
                        <span>Verified Certification</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Clean CTA Section */}
        <div className={`transition-all duration-1000 delay-900 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="ri-handshake-line text-2xl text-white"></i>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Partner With Us?
            </h3>

            <p className="text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Let's discuss how our certified expertise and industry partnerships can accelerate your next project with proven results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <a
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:scale-105 transition-all duration-300 cursor-pointer"
                href="#contact"
              >
                <span className="flex items-center justify-center">
                  Start Your Project
                  <i className="ri-arrow-right-line ml-2"></i>
                </span>
              </a>
              <a
                className="border border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-pointer"
                href="#contact"
              >
                <span className="flex items-center justify-center">
                  <i className="ri-phone-line mr-2"></i>
                  Schedule Call
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Partners