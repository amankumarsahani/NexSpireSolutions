import { useState, useEffect, memo } from 'react'

const Partners = memo(function Partners() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section id="partners" className="relative py-20 bg-[#F8F5FF] overflow-hidden">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-left mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <span className="text-sm font-semibold text-[#6D28D9] uppercase tracking-wider">Trusted Partnerships</span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 mt-4 leading-tight">
            Partners &
            <span className="block text-[#6D28D9] mt-1">
              Certifications
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            Building excellence through strategic partnerships and industry-recognized certifications that ensure world-class solutions
          </p>
        </div>

        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          {[
            { icon: "ri-team-line", number: "50+", label: "Technology Partners", bgColor: "bg-[#6D28D9]/10", textColor: "text-[#6D28D9]" },
            { icon: "ri-award-line", number: "30+", label: "Certifications", bgColor: "bg-[#D97706]/10", textColor: "text-[#D97706]" },
            { icon: "ri-cloud-line", number: "12+", label: "Cloud Platforms", bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
            { icon: "ri-shield-check-line", number: "100%", label: "Success Rate", bgColor: "bg-orange-50", textColor: "text-orange-600" }
          ].map((stat, index) => (
            <div key={index} className="group text-center">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 group-hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div className={`w-16 h-16 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <i className={`${stat.icon} text-2xl ${stat.textColor}`}></i>
                </div>
                <div className={`text-3xl font-bold mb-2 ${stat.textColor}`}>
                  {stat.number}
                </div>
                <div className="text-slate-600 font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`mb-20 transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
              Technology Partners
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Strategic alliances with industry-leading technology providers
            </p>
          </div>

          <div className="max-w-7xl mx-auto overflow-hidden">
            <div className="relative">
              <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

              <div className="flex animate-slide-left space-x-6 w-max">
                {[
                  { logo: "AWS", name: "Amazon Web Services", type: "Cloud Partner", desc: "Certified AWS solutions architect with expertise in scalable cloud infrastructure", bgColor: "bg-orange-50", iconColor: "text-orange-600", borderColor: "border-orange-200" },
                  { logo: "Azure", name: "Microsoft Azure", type: "Cloud Partner", desc: "Azure certified professional delivering enterprise cloud transformation", bgColor: "bg-[#FAF9F6]", iconColor: "text-[#6D28D9]", borderColor: "border-slate-200" },
                  { logo: "GCP", name: "Google Cloud", type: "Cloud Partner", desc: "Google Cloud certified engineer specializing in AI/ML and data analytics", bgColor: "bg-red-50", iconColor: "text-red-600", borderColor: "border-red-200" },
                  { logo: "React", name: "React Ecosystem", type: "Frontend Framework", desc: "Expert React development with Next.js, TypeScript, and modern tooling", bgColor: "bg-cyan-50", iconColor: "text-cyan-600", borderColor: "border-cyan-200" },
                  { logo: "Node", name: "Node.js", type: "Runtime Platform", desc: "Node.js expertise for scalable backend APIs and full-stack applications", bgColor: "bg-green-50", iconColor: "text-green-600", borderColor: "border-green-200" },
                  { logo: "MongoDB", name: "MongoDB", type: "Database Partner", desc: "MongoDB certified developer for modern NoSQL database solutions", bgColor: "bg-emerald-50", iconColor: "text-emerald-600", borderColor: "border-emerald-200" }
                ].map((partner, index) => (
                  <div key={`first-${index}`} className="group flex-shrink-0 w-80">
                    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 ${partner.borderColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 h-full`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 ${partner.bgColor} rounded-xl flex items-center justify-center mr-4`}>
                          <span className={`text-sm font-bold ${partner.iconColor}`}>{partner.logo}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 text-base mb-1">
                            {partner.name}
                          </h4>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${partner.bgColor} ${partner.iconColor}`}>
                            {partner.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {partner.desc}
                      </p>
                    </div>
                  </div>
                ))}

                {[
                  { logo: "AWS", name: "Amazon Web Services", type: "Cloud Partner", desc: "Certified AWS solutions architect with expertise in scalable cloud infrastructure", bgColor: "bg-orange-50", iconColor: "text-orange-600", borderColor: "border-orange-200" },
                  { logo: "Azure", name: "Microsoft Azure", type: "Cloud Partner", desc: "Azure certified professional delivering enterprise cloud transformation", bgColor: "bg-[#FAF9F6]", iconColor: "text-[#6D28D9]", borderColor: "border-slate-200" },
                  { logo: "GCP", name: "Google Cloud", type: "Cloud Partner", desc: "Google Cloud certified engineer specializing in AI/ML and data analytics", bgColor: "bg-red-50", iconColor: "text-red-600", borderColor: "border-red-200" },
                  { logo: "React", name: "React Ecosystem", type: "Frontend Framework", desc: "Expert React development with Next.js, TypeScript, and modern tooling", bgColor: "bg-cyan-50", iconColor: "text-cyan-600", borderColor: "border-cyan-200" },
                  { logo: "Node", name: "Node.js", type: "Runtime Platform", desc: "Node.js expertise for scalable backend APIs and full-stack applications", bgColor: "bg-green-50", iconColor: "text-green-600", borderColor: "border-green-200" },
                  { logo: "MongoDB", name: "MongoDB", type: "Database Partner", desc: "MongoDB certified developer for modern NoSQL database solutions", bgColor: "bg-emerald-50", iconColor: "text-emerald-600", borderColor: "border-emerald-200" }
                ].map((partner, index) => (
                  <div key={`second-${index}`} className="group flex-shrink-0 w-80">
                    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 ${partner.borderColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 h-full`}>
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 ${partner.bgColor} rounded-xl flex items-center justify-center mr-4`}>
                          <span className={`text-sm font-bold ${partner.iconColor}`}>{partner.logo}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 text-base mb-1">
                            {partner.name}
                          </h4>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${partner.bgColor} ${partner.iconColor}`}>
                            {partner.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {partner.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`mb-20 transition-all duration-1000 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
              Professional Certifications
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Industry-recognized credentials ensuring expertise and quality delivery
            </p>
          </div>

          <div className="max-w-7xl mx-auto overflow-hidden">
            <div className="relative">
              <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

              <div className="flex animate-slide-left space-x-6 w-max">
                {[
                  { icon: "ri-award-line", title: "AWS Solutions Architect", provider: "Amazon Web Services", year: "2024", bgColor: "bg-orange-50", iconColor: "text-orange-600" },
                  { icon: "ri-medal-line", title: "Azure Developer Associate", provider: "Microsoft", year: "2024", bgColor: "bg-[#FAF9F6]", iconColor: "text-[#6D28D9]" },
                  { icon: "ri-trophy-line", title: "Google Cloud Professional", provider: "Google Cloud", year: "2024", bgColor: "bg-red-50", iconColor: "text-red-600" },
                  { icon: "ri-shield-star-line", title: "Kubernetes Administrator", provider: "CNCF", year: "2024", bgColor: "bg-[#6D28D9]/10", iconColor: "text-[#6D28D9]" },
                  { icon: "ri-star-line", title: "MongoDB Developer", provider: "MongoDB Inc.", year: "2024", bgColor: "bg-green-50", iconColor: "text-green-600" },
                  { icon: "ri-flashlight-line", title: "Certified Scrum Master", provider: "Scrum Alliance", year: "2024", bgColor: "bg-cyan-50", iconColor: "text-cyan-600" }
                ].map((cert, index) => (
                  <div key={`first-${index}`} className="group flex-shrink-0 w-72">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 h-full">
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 ${cert.bgColor} rounded-xl flex items-center justify-center mr-4`}>
                          <i className={`${cert.icon} text-xl ${cert.iconColor}`}></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 text-base mb-1">
                            {cert.title}
                          </h4>
                          <p className="text-slate-500 text-sm">{cert.provider}</p>
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${cert.bgColor} ${cert.iconColor}`}>
                          {cert.year}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-slate-500">
                        <i className={`ri-verified-badge-line mr-2 ${cert.iconColor}`}></i>
                        <span>Verified Certification</span>
                      </div>
                    </div>
                  </div>
                ))}

                {[
                  { icon: "ri-award-line", title: "AWS Solutions Architect", provider: "Amazon Web Services", year: "2024", bgColor: "bg-orange-50", iconColor: "text-orange-600" },
                  { icon: "ri-medal-line", title: "Azure Developer Associate", provider: "Microsoft", year: "2024", bgColor: "bg-[#FAF9F6]", iconColor: "text-[#6D28D9]" },
                  { icon: "ri-trophy-line", title: "Google Cloud Professional", provider: "Google Cloud", year: "2024", bgColor: "bg-red-50", iconColor: "text-red-600" },
                  { icon: "ri-shield-star-line", title: "Kubernetes Administrator", provider: "CNCF", year: "2024", bgColor: "bg-[#6D28D9]/10", iconColor: "text-[#6D28D9]" },
                  { icon: "ri-star-line", title: "MongoDB Developer", provider: "MongoDB Inc.", year: "2024", bgColor: "bg-green-50", iconColor: "text-green-600" },
                  { icon: "ri-flashlight-line", title: "Certified Scrum Master", provider: "Scrum Alliance", year: "2024", bgColor: "bg-cyan-50", iconColor: "text-cyan-600" }
                ].map((cert, index) => (
                  <div key={`second-${index}`} className="group flex-shrink-0 w-72">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 h-full">
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 ${cert.bgColor} rounded-xl flex items-center justify-center mr-4`}>
                          <i className={`${cert.icon} text-xl ${cert.iconColor}`}></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 text-base mb-1">
                            {cert.title}
                          </h4>
                          <p className="text-slate-500 text-sm">{cert.provider}</p>
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${cert.bgColor} ${cert.iconColor}`}>
                          {cert.year}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-slate-500">
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

        <div className={`transition-all duration-1000 delay-900 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="bg-[#4F46E5] rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
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
                className="bg-white text-[#4F46E5] px-8 py-4 rounded-xl font-semibold hover:bg-[#FAF9F6] transition-all duration-300 cursor-pointer"
                href="#contact"
              >
                <span className="flex items-center justify-center">
                  Start Your Project
                  <i className="ri-arrow-right-line ml-2"></i>
                </span>
              </a>
              <a
                className="border border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 cursor-pointer"
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
})

export default Partners
