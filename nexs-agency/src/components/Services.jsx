import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import MagneticButton from './ui/MagneticButton'

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

const ServiceCard = memo(function ServiceCard({ service, index }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#6D28D9] transition-all duration-300 group-hover:h-[3px] group-hover:shadow-[0_0_8px_rgba(15,118,110,0.4)]"></div>

      <div className="relative mb-8">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-[#6D28D9] rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-[5deg]">
          <i className={`${service.icon} text-2xl sm:text-3xl text-white`}></i>
        </div>
      </div>

      <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">
        <Link to={service.link} className="hover:text-[#6D28D9] transition-colors">{service.title}</Link>
      </h3>
      <p className="relative z-10 text-slate-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{service.description}</p>

      <ul className="relative z-10 space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        {service.features.map((feature, featureIndex) => (
          <li key={featureIndex} className="flex items-center text-sm text-slate-700">
            <div className="w-5 h-5 bg-[#6D28D9] rounded-full flex items-center justify-center mr-4 shadow-sm">
              <i className="ri-check-line text-white text-xs"></i>
            </div>
            <span className="font-semibold">{feature}</span>
          </li>
        ))}
      </ul>

      <Link to={service.link} className="relative z-10 inline-flex items-center text-sm font-bold text-[#6D28D9] hover:opacity-80 transition-opacity duration-300">
        Learn More
        <i className="ri-arrow-right-line ml-1 text-[#6D28D9]"></i>
      </Link>
    </motion.div>
  )
})

const services = [
  {
    icon: "ri-code-line",
    title: "Web Development",
    description: "Modern, responsive websites built with cutting-edge technologies and industry best practices for optimal performance.",
    features: ["React & Next.js", "Node.js & Python", "Mobile-First Design", "Performance Optimization"],
    link: "/services/custom-web-development"
  },
  {
    icon: "ri-smartphone-line",
    title: "Mobile Apps",
    description: "Native and cross-platform mobile applications that deliver exceptional user experiences across all devices.",
    features: ["iOS & Android", "React Native", "Flutter Development", "App Store Deployment"],
    link: "/services/mobile-app-development"
  },
  {
    icon: "ri-cloud-line",
    title: "Cloud Solutions",
    description: "Scalable cloud infrastructure and DevOps solutions that grow with your business needs and requirements.",
    features: ["AWS & Azure", "Docker & Kubernetes", "CI/CD Pipelines", "Auto-scaling Systems"],
    link: "/services/cloud-solutions"
  },
  {
    icon: "ri-palette-line",
    title: "UI/UX Design",
    description: "Beautiful, intuitive designs that enhance user experience and drive engagement through thoughtful interface design.",
    features: ["User Research", "Interactive Prototypes", "Design Systems", "Accessibility Focus"],
    link: "/services"
  },
  {
    icon: "ri-shopping-cart-line",
    title: "E-commerce Solutions",
    description: "Complete e-commerce platforms with advanced payment integration and comprehensive inventory management systems.",
    features: ["Custom E-commerce", "Payment Integration", "Inventory Management", "Analytics Dashboard"],
    link: "/services/ecommerce-development"
  },
  {
    icon: "ri-shield-check-line",
    title: "Security & Testing",
    description: "Comprehensive security audits and rigorous testing protocols to ensure your applications are secure and reliable.",
    features: ["Security Audits", "Penetration Testing", "Code Quality Reviews", "Compliance Standards"],
    link: "/services"
  }
];

const Services = memo(function Services() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)

  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(services.length / 3))
    }, 4000)
  }, [])

  useEffect(() => {
    if (!isPaused) {
      startAutoSlide()
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPaused, startAutoSlide])

  const togglePause = () => {
    setIsPaused(prev => !prev)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const servicesPerSlide = 3
  const totalSlides = Math.ceil(services.length / servicesPerSlide)

  return (
    <section id="services" className="relative py-12 sm:py-16 lg:py-20 bg-[#F5F0FF] overflow-hidden">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <span className="text-sm font-semibold text-[#6D28D9] uppercase tracking-wider">Our Expert Services</span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4 sm:mb-6 mt-4 leading-tight">
            Comprehensive
            <span className="block text-[#6D28D9]">
              Digital Solutions
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            From innovative web development to cutting-edge mobile apps, we deliver
            <span className="font-semibold text-[#6D28D9]"> end-to-end solutions</span> that transform
            your business and drive sustainable growth in the digital landscape.
          </p>
        </div>

        <div className="relative mb-16" role="region" aria-roledescription="carousel" aria-label="Our services">
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
                        <ServiceCard key={actualIndex} service={service} index={index} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6 lg:hidden">
            <button
              onClick={() => goToSlide(currentSlide === 0 ? totalSlides - 1 : currentSlide - 1)}
              aria-label="Previous service"
              className="w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            >
              <i className="ri-arrow-left-line text-lg text-slate-700 group-hover:text-[#6D28D9] transition-colors"></i>
            </button>

            <button
              onClick={() => goToSlide(currentSlide === totalSlides - 1 ? 0 : currentSlide + 1)}
              aria-label="Next service"
              className="w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            >
              <i className="ri-arrow-right-line text-lg text-slate-700 group-hover:text-[#6D28D9] transition-colors"></i>
            </button>
          </div>

          <div className="flex justify-center items-center mt-6 space-x-3">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to service ${index + 1}`}
                aria-current={currentSlide === index}
                className="w-8 h-8 flex items-center justify-center"
              >
                <span className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index
                  ? 'bg-[#6D28D9] scale-125 shadow-lg'
                  : 'bg-slate-300 hover:bg-slate-400'
                  }`} />
              </button>
            ))}
            <button
              aria-label={isPaused ? "Play carousel" : "Pause carousel"}
              onClick={togglePause}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 ml-2"
            >
              <i className={`${isPaused ? 'ri-play-line' : 'ri-pause-line'} text-slate-700`}></i>
            </button>
          </div>

          <div className="flex justify-center mt-4">
            <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6D28D9] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => goToSlide(currentSlide === 0 ? totalSlides - 1 : currentSlide - 1)}
            aria-label="Previous service"
            className="absolute -left-16 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group lg:block hidden"
          >
            <i className="ri-arrow-left-line text-xl text-slate-700 group-hover:text-[#6D28D9] transition-colors"></i>
          </button>

          <button
            onClick={() => goToSlide(currentSlide === totalSlides - 1 ? 0 : currentSlide + 1)}
            aria-label="Next service"
            className="absolute -right-16 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group lg:block hidden"
          >
            <i className="ri-arrow-right-line text-xl text-slate-700 group-hover:text-[#6D28D9] transition-colors"></i>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-[#6D28D9] rounded-3xl"></div>

          <div className="relative z-10 text-center p-12 text-white overflow-hidden rounded-3xl">
            <h3 className="text-3xl md:text-4xl font-bold mb-5 text-white">
              Ready to Transform Your Business?
            </h3>

            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Let's discuss your project and create a custom solution that drives results.
              Get a <span className="font-semibold text-white">free consultation</span> with our experts today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticButton
                href="#contact"
                className="group bg-white text-[#6D28D9] px-8 py-4 rounded-xl font-bold hover:bg-[#FAF9F6] transition-colors duration-300 inline-flex items-center justify-center shadow-xl text-base"
              >
                Start Your Project
                <i className="ri-arrow-right-line ml-2 text-lg group-hover:translate-x-1 transition-transform duration-300"></i>
              </MagneticButton>

              <a href="tel:+917696309551" className="group bg-white/15 text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold hover:bg-white/25 hover:border-white/50 transition-all duration-300 inline-flex items-center justify-center text-base">
                <i className="ri-phone-line mr-2 text-lg"></i>
                Schedule Call
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Services;
