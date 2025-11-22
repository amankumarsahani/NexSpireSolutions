import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import About from './components/About'
import Portfolio from './components/Portfolio'
import Technologies from './components/Technologies'
import Testimonials from './components/Testimonials'
import Blog from './components/Blog'
import FAQ from './components/FAQ'
// import Pricing from './components/Pricing'
// import Careers from './components/Careers'
import Partners from './components/Partners'
import Contact from './components/Contact'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Services />
      <About />
      <Portfolio />
      <Technologies />
      <Testimonials />
      <Blog />
      <FAQ />
      {/* <Pricing /> */}
      {/* <Careers /> */}
      <Partners />
      <Contact />
      <Footer />
    </div>
  )
}

export default App
