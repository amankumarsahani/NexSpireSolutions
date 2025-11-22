import { useState, useEffect } from 'react'

function FAQ() {
  const [openFAQ, setOpenFAQ] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const faqs = [
    {
      question: "How long does it typically take to complete a web development project?",
      answer: "Project timelines vary based on complexity and requirements. A simple website typically takes 4-6 weeks, while complex web applications can take 3-6 months. We provide detailed timelines during the planning phase and keep you updated throughout the development process.",
      icon: "ri-time-line",
      color: "from-blue-500 to-cyan-500"
    },
    {
      question: "What technologies do you use for web and mobile development?",
      answer: "We use modern technologies including React, Next.js, Vue.js, Node.js, Python, PHP, React Native, Flutter for mobile apps, and cloud platforms like AWS, Azure, and Google Cloud. We choose the best technology stack based on your project requirements.",
      icon: "ri-code-line",
      color: "from-purple-500 to-pink-500"
    },
    {
      question: "Do you provide ongoing maintenance and support after project completion?",
      answer: "Yes, we offer comprehensive maintenance and support packages. Our support includes bug fixes, security updates, performance monitoring, content updates, and technical assistance. We have different support tiers to meet your specific needs and budget.",
      icon: "ri-tools-line",
      color: "from-green-500 to-emerald-500"
    },
    {
      question: "How do you ensure the security of the applications you develop?",
      answer: "Security is our top priority. We implement industry best practices including secure coding standards, data encryption, authentication systems, regular security audits, vulnerability assessments, and compliance with security standards like OWASP guidelines.",
      icon: "ri-shield-check-line",
      color: "from-red-500 to-orange-500"
    },
    {
      question: "Can you work with our existing team or do you handle everything independently?",
      answer: "We're flexible and can work both ways. We can integrate with your existing team as an extension, collaborate with your internal developers, or handle the entire project independently. We adapt our approach based on your preferences and project requirements.",
      icon: "ri-team-line",
      color: "from-indigo-500 to-purple-500"
    },
    {
      question: "What is your pricing structure for different types of projects?",
      answer: "We offer flexible pricing models including fixed-price projects, hourly rates, and retainer agreements. Pricing depends on project scope, complexity, timeline, and technology requirements. We provide detailed quotes after understanding your specific needs.",
      icon: "ri-money-dollar-circle-line",
      color: "from-yellow-500 to-orange-500"
    },
    {
      question: "Do you provide UI/UX design services or just development?",
      answer: "We provide comprehensive services including UI/UX design, user research, prototyping, and development. Our design team works closely with developers to ensure seamless implementation of beautiful, user-friendly interfaces.",
      icon: "ri-palette-line",
      color: "from-pink-500 to-rose-500"
    },
    {
      question: "How do you handle project communication and updates?",
      answer: "We maintain transparent communication through regular meetings, progress reports, project management tools like Slack/Teams, and dedicated project managers. You'll receive weekly updates and have access to real-time project status through our client portal.",
      icon: "ri-chat-3-line",
      color: "from-teal-500 to-cyan-500"
    },
    {
      question: "Can you help migrate our existing application to modern technologies?",
      answer: "Absolutely! We specialize in legacy system modernization and migration. We assess your current system, plan a migration strategy, ensure data integrity, minimize downtime, and provide training for your team on the new system.",
      icon: "ri-refresh-line",
      color: "from-violet-500 to-purple-500"
    },
    {
      question: "What happens if we need changes or additional features after the project is complete?",
      answer: "We understand that requirements can evolve. We offer post-launch support for changes and enhancements. Small changes are often covered under our maintenance plans, while larger features are handled through separate project agreements with transparent pricing.",
      icon: "ri-add-circle-line",
      color: "from-emerald-500 to-green-500"
    }
  ]

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? -1 : index)
  }

  return (
    <section id="faq" className="relative py-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-pink-500/3 via-transparent to-cyan-500/3"></div>
        
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-200/15 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-bl from-purple-200/12 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="inline-flex items-center bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 text-gray-800 text-sm font-bold px-8 py-4 rounded-full mb-8 shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500">
            <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full mr-3 animate-pulse shadow-lg"></div>
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            <span className="block text-gray-800 font-bold">Got Questions?</span>
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2 font-bold">
              We've Got Answers
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about our services, development process, and collaboration approach
          </p>
        </div>
        
        {/* Clean FAQ List */}
        <div className={`mb-16 transition-all duration-1000 delay-300 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          
          {/* FAQ List */}
          <div className="max-w-4xl mx-auto space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="group">
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:border-gray-300/50 hover:bg-white/80 transition-all duration-300 overflow-hidden">
                  
                  <button 
                    className="w-full px-6 py-5 text-left flex items-center justify-between group-hover:px-8 transition-all duration-300"
                    onClick={() => toggleFAQ(index)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Number Badge */}
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform duration-300">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors duration-300">
                        {faq.question}
                      </h3>
                    </div>
                    
                    <div className={`transition-all duration-300 ${openFAQ === index ? 'rotate-180' : ''}`}>
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                        <i className="ri-arrow-down-s-line text-gray-600 group-hover:text-blue-600"></i>
                      </div>
                    </div>
                  </button>
                  
                  {openFAQ === index && (
                    <div className="px-6 pb-6 animate-fadeIn">
                      <div className="pl-12 pr-16">
                        <div className="h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-transparent mb-6"></div>
                        <p className="text-gray-700 leading-relaxed text-base mb-6">
                          {faq.answer}
                        </p>
                        
                        {/* Help Action */}
                        <div className="flex justify-between items-center">
                          <button className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center transition-colors">
                            <i className="ri-thumb-up-line mr-2"></i>
                            Helpful
                          </button>
                          <a 
                            href="#contact"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-300"
                          >
                            Need More Help?
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Active Indicator */}
                  {openFAQ === index && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Enhanced CTA Section */}
        <div className={`transition-all duration-1000 delay-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-center text-white overflow-hidden shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <defs>
                  <pattern id="faq-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                    <path d="M10 0v20M0 10h20" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#faq-pattern)" className="text-white"/>
              </svg>
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <i className="ri-question-line text-2xl text-white"></i>
              </div>
              <h3 className="text-3xl font-bold mb-4">
                Still Have Questions?
              </h3>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                Can't find the answer you're looking for? Our expert team is ready to help you with personalized solutions for your project.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <a
                  className="group relative bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold border border-white/30 hover:bg-white/30 hover:scale-105 transition-all duration-300 cursor-pointer whitespace-nowrap overflow-hidden"
                  href="#contact"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Contact Us
                    <i className="ri-arrow-right-line ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                  </span>
                </a>
                <a
                  href="tel:+15551234567"
                  className="group relative bg-white text-indigo-600 px-8 py-4 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer whitespace-nowrap"
                >
                  <span className="flex items-center justify-center">
                    <i className="ri-phone-line mr-2"></i>
                    Call Us Now
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQ