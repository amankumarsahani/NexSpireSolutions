import { useState, useEffect } from 'react'

const Hero = () => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const rotatingTexts = [
    "AI-Powered Software Solutions",
    "Web & Mobile App Development",
    "CRM & ERP Enterprise Solutions",
    "Cloud-Native Architecture",
    "E-commerce & Digital Transformation"
  ]

  const technologies = [
    { name: 'React', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
    { name: 'Node.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
    { name: 'Python', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
    { name: 'JavaScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
    { name: 'TypeScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
    { name: 'MongoDB', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
    { name: 'PostgreSQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
    { name: 'Docker', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
    { name: 'Kubernetes', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
    { name: 'AWS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'Google Cloud', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg' },
    { name: 'Azure', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg' },
    { name: 'Next.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
    { name: 'Vue.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' },
    { name: 'Angular', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg' },
    { name: 'Laravel', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-plain.svg' },
    { name: 'Django', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg' },
    { name: 'Flutter', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg' },
    { name: 'React Native', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
    { name: 'Firebase', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg' }
  ]

  useEffect(() => {
    setIsVisible(true)

    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % rotatingTexts.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section id="home" className="relative min-h-screen lg:h-screen overflow-hidden">
      {/* Static Image Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1920&auto=format&fit=crop')`,
          }}
        ></div>

        {/* Overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto py-20 sm:py-24">

          {/* Centered Content */}
          <div className={`space-y-4 sm:space-y-6 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            {/* Company Badge */}
            <div className="inline-flex items-center bg-white/90 backdrop-blur-md border border-white/30 rounded-full px-3 sm:px-4 py-2 text-blue-700 font-semibold text-sm sm:text-base hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <i className="ri-code-s-slash-line mr-1 group-hover:rotate-12 transition-transform text-sm"></i>
              Leading Software Development Agency
              <i className="ri-arrow-right-line ml-1 text-xs group-hover:translate-x-1 transition-transform"></i>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="font-bold text-white leading-tight drop-shadow-lg">
                <span className="block mb-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold">Engineering Scalable</span>
                <span className="block mb-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold">Digital Ecosystems for</span>
                <span className="block relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                  <span className="relative font-extrabold">
                    <span
                      className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(96, 165, 250, 0.8))',
                        textShadow: '0 0 10px rgba(96, 165, 250, 0.5), 0 0 20px rgba(147, 197, 253, 0.3)'
                      }}
                    >
                      {rotatingTexts[currentTextIndex]}
                    </span>
                  </span>
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transform scale-x-0 animate-pulse" style={{ animation: 'scaleX 2s ease-in-out infinite' }}></div>
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-6xl mx-auto drop-shadow-md font-medium">
                We don't just write code; we build <span className="font-bold text-cyan-300">high-performance engines</span> for your business growth.
                From <span className="font-semibold text-blue-300">disruptive startups in London</span> to <span className="font-semibold text-purple-300">enterprises in New York</span>,
                Nexspire Solutions delivers the technical edge you need to dominate your market.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8">
              <a
                href="#contact"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 sm:px-8 lg:px-6 py-4 sm:py-4 lg:py-3 rounded-xl text-base sm:text-lg lg:text-base font-semibold shadow-xl inline-flex items-center justify-center hover:shadow-2xl hover:scale-105 hover:from-blue-500 hover:to-purple-500 active:scale-95 transition-all duration-300 group"
              >
                Start Your Project
                <i className="ri-rocket-2-line ml-2 text-lg group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300"></i>
              </a>

              <a
                href="#portfolio"
                className="bg-white/90 backdrop-blur-md text-gray-700 border-2 border-white/30 px-8 sm:px-8 lg:px-6 py-4 sm:py-4 lg:py-3 rounded-xl text-base sm:text-lg lg:text-base font-semibold inline-flex items-center justify-center hover:bg-white hover:scale-105 hover:shadow-xl hover:border-white/50 active:scale-95 transition-all duration-300 group"
              >
                <i className="ri-play-circle-line mr-2 text-lg group-hover:scale-110 group-hover:text-blue-600 transition-all duration-300"></i>
                View Our Work
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Technologies Slider */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md py-4 sm:py-6">
        <div className="overflow-hidden">
          <div className="flex animate-scroll-infinite">
            {[...technologies, ...technologies].map((tech, index) => (
              <div key={index} className="flex-shrink-0 mx-4 sm:mx-6 lg:mx-8 flex items-center justify-center">
                <img
                  src={tech.logo}
                  alt={tech.name}
                  loading="lazy"
                  decoding="async"
                  width="32"
                  height="32"
                  className="h-6 sm:h-8 w-auto opacity-60 hover:opacity-100 transition-opacity filter brightness-0 invert"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Custom Styles */}
      <style>{`
        @keyframes scaleX {
          0%, 100% { transform: scaleX(0); }
          50% { transform: scaleX(1); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rotate-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes bounce-slow {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        @keyframes float-up {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-30px) translateX(5px); opacity: 0.1; }
        }
        
        @keyframes float-down {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { transform: translateY(30px) translateX(-5px); opacity: 0.1; }
        }
        
        @keyframes drift-left {
          0% { transform: translateX(0px) translateY(0px); opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { transform: translateX(-40px) translateY(10px); opacity: 0.1; }
        }
        
        @keyframes drift-right {
          0% { transform: translateX(0px) translateY(0px); opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { transform: translateX(40px) translateY(-10px); opacity: 0.1; }
        }
        
        @keyframes grid-move {
          0% { background-position: 0% 0%; }
          100% { background-position: 60px 60px; }
        }
        
        @keyframes wave {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }
        
        .animate-rotate-reverse {
          animation: rotate-reverse 25s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-float-up {
          animation: float-up 12s ease-in-out infinite;
        }
        
        .animate-float-down {
          animation: float-down 10s ease-in-out infinite;
        }
        
        .animate-drift-left {
          animation: drift-left 14s ease-in-out infinite;
        }
        
        .animate-drift-right {
          animation: drift-right 11s ease-in-out infinite;
        }
        
        .animate-grid-move {
          animation: grid-move 30s linear infinite;
        }
        
        .animate-wave {
          animation: wave 8s ease-in-out infinite;
        }
        
        @keyframes float-code {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        
        @keyframes float-tech {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        @keyframes circuit {
          0% { transform: translateX(0px) translateY(0px); }
          100% { transform: translateX(20px) translateY(20px); }
        }
        
        .animate-float-code {
          animation: float-code 6s ease-in-out infinite;
        }
        
        .animate-float-tech {
          animation: float-tech 4s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        
        .animate-circuit {
          animation: circuit 20s linear infinite;
        }
      `}</style>
    </section>
  )
}

export default Hero