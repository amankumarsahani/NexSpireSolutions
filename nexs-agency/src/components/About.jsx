import { useState, useEffect, memo } from 'react'

const teamMembers = [
  {
    name: "Aman Kumar Sahani",
    role: "Founder & Lead Developer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&fm=webp",
    skills: ["React", "Node.js", "Python", "AWS"],
  },
  {
    name: "Anu Kumar",
    role: "Senior UI/UX Designer",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&fm=webp",
    skills: ["Figma", "React", "Design Systems"],
  },
  {
    name: "Kshitij Bhardwaj",
    role: "Backend Architect",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&fm=webp",
    skills: ["Vue.js", "Django", "PostgreSQL", "Docker"],
  }
];

const stats = [
  { number: "150+", label: "Projects Completed", icon: "ri-bar-chart-box-line" },
  { number: "80+", label: "Happy Clients", icon: "ri-heart-line" },
  { number: "98%", label: "Success Rate", icon: "ri-flashlight-line" },
  { number: "24/7", label: "Support Available", icon: "ri-customer-service-line" }
];

const features = [
  { icon: "ri-flashlight-line", title: "Agile Development", description: "Fast, iterative development approach for rapid delivery" },
  { icon: "ri-shield-check-line", title: "Quality Assurance", description: "Rigorous testing and quality control processes" },
  { icon: "ri-arrow-right-up-line", title: "Scalable Solutions", description: "Future-proof architecture that grows with your business" },
  { icon: "ri-lightbulb-line", title: "Innovation Focus", description: "Cutting-edge technologies and creative problem solving" }
];

const About = memo(function About() {
  const [isVisible, setIsVisible] = useState(false)

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

  return (
    <section id="about" className="relative py-20 bg-white overflow-hidden">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className={`text-left mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <span className="text-sm font-semibold text-[#0F766E] uppercase tracking-wider">More Than An Agency</span>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 mt-4 leading-tight">
            We Are Your Technical
            <span className="block text-[#0F766E] mt-2">
              Co-Founders & Partners
            </span>
          </h2>

          <p className="text-xl text-slate-600 max-w-3xl leading-relaxed">
            Most agencies just take tickets. We take ownership. We build the infrastructure that allows visionary companies to scale without limits.
          </p>
        </div>

        <div className={`grid lg:grid-cols-12 gap-16 items-center mb-20 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>

          <div className="lg:col-span-5 relative group">
            <div className="relative bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&q=80&fm=webp"
                alt="Our professional team at work"
                loading="lazy"
                className="rounded-xl shadow-lg object-cover w-full h-80"
              />

              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-4 shadow-xl border border-slate-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0F766E]">5+</div>
                  <div className="text-xs text-slate-600 font-medium">Years Experience</div>
                </div>
              </div>

              <div className="absolute -top-4 -left-4 bg-white rounded-xl p-4 shadow-xl border border-slate-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#D97706]">150+</div>
                  <div className="text-xs text-slate-600 font-medium">Projects Done</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div>
              <h3 className="text-3xl font-bold text-slate-800 mb-6">Who We Are</h3>
              <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
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

            <div className="bg-[#FAF9F6] rounded-xl p-6 border border-slate-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-[#0F766E] rounded-full mr-2"></span>
                    Our Mission
                  </h4>
                  <p className="text-sm text-slate-600">
                    To eliminate technical debt and accelerate go-to-market speed for ambitious global brands.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-[#D97706] rounded-full mr-2"></span>
                    Our Vision
                  </h4>
                  <p className="text-sm text-slate-600">
                    To be the infrastructure partner behind the next generation of Fortune 500 digital products.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mb-24 transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="text-left mb-16">
            <span className="text-sm font-semibold text-[#0F766E] uppercase tracking-wider">Why Choose Nexspire Solution</span>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6 mt-4">
              What Makes Us <span className="text-[#D97706]">Different</span>
            </h3>
            <p className="text-lg text-slate-600 max-w-2xl">
              Four core principles that drive our success and your satisfaction
            </p>
          </div>

          <div className="max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-6 group">
                  <div className="flex-shrink-0">
                    <div className="relative w-16 h-16 bg-[#0F766E] rounded-xl flex items-center justify-center shadow-lg">
                      <i className={`${feature.icon} text-2xl text-white`}></i>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                      <h4 className="text-xl font-bold text-slate-800 mb-3">
                        {feature.title}
                      </h4>
                      <p className="text-slate-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`mb-24 transition-all duration-1000 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-[#0F766E] uppercase tracking-wider">Performance Metrics</span>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6 mt-4 leading-tight tracking-tight">
              Numbers That Define <span className="text-[#0F766E]">Excellence</span>
            </h3>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Our achievements speak volumes about our dedication to delivering exceptional results
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="group relative">
                <div className="relative bg-white rounded-2xl p-8 border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="text-center mb-6">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="w-full h-full rounded-2xl bg-[#0F766E] flex items-center justify-center shadow-lg">
                        <i className={`${stat.icon} text-3xl text-white`}></i>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-[#D97706] mb-2">
                      {stat.number}
                    </div>
                    <div className="h-1 w-16 mx-auto rounded-full bg-[#0F766E]"></div>
                  </div>

                  <div className="text-center">
                    <h4 className="text-lg font-bold text-slate-800">
                      {stat.label}
                    </h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </section>
  );
})

export default About;
