import { useState, useEffect, memo } from 'react'
import MagneticButton from './ui/MagneticButton'

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

const Hero = memo(function Hero() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)

    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % rotatingTexts.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section id="home" className="relative min-h-screen lg:h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1920&auto=format&fit=crop&fm=webp"
          srcSet="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=640&fm=webp 640w, https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1024&fm=webp 1024w, https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1920&fm=webp 1920w"
          sizes="100vw"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10 w-full min-h-screen flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto py-20 sm:py-24">
          <div className={`space-y-4 sm:space-y-6 text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            <div className="inline-flex items-center bg-white/90 backdrop-blur-sm border border-white/30 rounded-full px-3 sm:px-4 py-2 text-[#2563EB] font-semibold text-sm sm:text-base">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
              <i className="ri-code-s-slash-line mr-1 text-sm"></i>
              Leading Software Development Agency
            </div>

            <div className="space-y-4">
              <h1 className="font-bold text-white leading-tight drop-shadow-lg">
                <span className="block mb-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Engineering Scalable</span>
                <span className="block mb-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Digital Ecosystems for</span>
                <span className="block relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                  <span className="relative" aria-live="polite" aria-atomic="true">
                    <span className="text-[#D97706]">
                      {rotatingTexts[currentTextIndex]}
                    </span>
                  </span>
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto font-medium">
                We don't just write code; we build <span className="font-bold text-[#D97706]">high-performance engines</span> for your business growth.
                From disruptive startups in London to enterprises in New York,
                Nexspire Solutions delivers the technical edge you need to dominate your market.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8">
              <MagneticButton
                href="#contact"
                className="bg-[#2563EB] text-white px-8 sm:px-8 lg:px-6 py-4 sm:py-4 lg:py-3 rounded-xl text-base sm:text-lg lg:text-base font-semibold shadow-xl inline-flex items-center justify-center hover:bg-[#1D4ED8] active:scale-95 transition-colors duration-300 group"
              >
                Start Your Project
                <i className="ri-arrow-right-line ml-2 text-lg group-hover:translate-x-1 transition-transform duration-300"></i>
              </MagneticButton>

              <a
                href="#portfolio"
                className="bg-white/90 backdrop-blur-sm text-slate-700 border-2 border-white/30 px-8 sm:px-8 lg:px-6 py-4 sm:py-4 lg:py-3 rounded-xl text-base sm:text-lg lg:text-base font-semibold inline-flex items-center justify-center hover:bg-white active:scale-95 transition-all duration-300 group"
              >
                <i className="ri-play-circle-line mr-2 text-lg"></i>
                View Our Work
              </a>
            </div>

          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-sm py-4 sm:py-6">
        <div className="overflow-hidden">
          <div className="flex animate-scroll-infinite">
            {[...technologies, ...technologies].map((tech, index) => (
              <div key={index} className="flex-shrink-0 mx-4 sm:mx-6 lg:mx-8 flex items-center justify-center">
                <img
                  src={tech.logo}
                  alt={tech.name}
                  loading="eager"
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

    </section>
  )
})

export default Hero
