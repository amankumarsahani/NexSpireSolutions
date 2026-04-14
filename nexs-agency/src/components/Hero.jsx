import { memo } from 'react'
import { Link } from 'react-router-dom'
import MagneticButton from './ui/MagneticButton'

const Hero = memo(function Hero() {
  return (
    <section id="home" className="min-h-[90vh] bg-white flex items-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-6">
          Software Development Agency
        </p>

        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] tracking-tight mb-8">
          <span className="block text-slate-900">We build software</span>
          <span className="block text-[#2563EB]">that grows businesses.</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl leading-relaxed mb-10">
          Full-stack development studio based in Mohali. We turn ideas into products for startups and enterprises across 10+ industries.
        </p>

        <div className="flex flex-wrap items-center gap-6">
          <MagneticButton
            href="#contact"
            className="bg-[#2563EB] text-white py-3 px-8 rounded-lg text-base font-semibold hover:bg-[#1D4ED8] transition-colors duration-300 inline-flex items-center justify-center"
          >
            Start a project
          </MagneticButton>

          <Link
            to="/portfolio"
            className="text-slate-700 font-medium underline underline-offset-4 decoration-slate-300 hover:decoration-slate-700 transition-colors duration-300 inline-flex items-center gap-1"
          >
            See our work
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  )
})

export default Hero
