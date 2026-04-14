import { useState, memo } from 'react'

const testimonials = [
  {
    text: "Working with this team has been exceptional. They delivered our e-commerce platform ahead of schedule and exceeded all our expectations. The attention to detail and technical expertise is outstanding.",
    name: "Sarah Johnson",
    position: "CEO, TechStart Inc.",
    project: "E-commerce Platform",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&q=80&fm=webp"
  },
  {
    text: "The mobile app they developed for us has been a game-changer. User engagement increased by 300% after launch. Their understanding of user experience and technical implementation is remarkable.",
    name: "Michael Rodriguez",
    position: "CTO, FitTech Solutions",
    project: "Mobile Fitness App",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&q=80&fm=webp"
  },
  {
    text: "Our cloud migration project was seamless thanks to their expertise. They reduced our infrastructure costs by 40% while improving performance significantly. Highly recommended for enterprise solutions.",
    name: "Emily Chen",
    position: "Director of IT, GlobalCorp",
    project: "Cloud Migration",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&q=80&fm=webp"
  },
  {
    text: "The custom CRM system they built has transformed our sales process. Our team productivity increased by 50% and customer satisfaction scores are at an all-time high.",
    name: "David Thompson",
    position: "Sales Director, InnovateSales",
    project: "Custom CRM System",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&q=80&fm=webp"
  },
  {
    text: "Their AI integration project exceeded our expectations. The machine learning models they implemented have improved our operational efficiency by 60%. True technical innovators.",
    name: "Lisa Park",
    position: "Head of Operations, DataFlow Inc.",
    project: "AI Integration",
    image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&h=100&fit=crop&q=80&fm=webp"
  },
  {
    text: "The web application they developed has revolutionized our customer service. Response times are down 70% and customer satisfaction is up 85%. Outstanding work from start to finish.",
    name: "Robert Wilson",
    position: "Customer Success Manager, ServicePro",
    project: "Customer Service Platform",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80&fm=webp"
  }
]

const Testimonials = memo(function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const goToTestimonial = (index) => {
    setCurrentTestimonial(index)
  }

  return (
    <section id="testimonials" className="py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our satisfied clients have to say about working with us.
          </p>
        </div>

        <div className="relative" role="region" aria-roledescription="carousel" aria-label="Client testimonials">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="flex space-x-1">
                <i className="ri-star-fill text-yellow-400"></i>
                <i className="ri-star-fill text-yellow-400"></i>
                <i className="ri-star-fill text-yellow-400"></i>
                <i className="ri-star-fill text-yellow-400"></i>
                <i className="ri-star-fill text-yellow-400"></i>
              </div>
            </div>
            <blockquote className="text-xl md:text-2xl text-slate-600 leading-relaxed text-center mb-8">
              "{testimonials[currentTestimonial].text}"
            </blockquote>
            <div className="flex items-center justify-center">
              <img
                src={testimonials[currentTestimonial].image}
                alt={testimonials[currentTestimonial].name}
                loading="lazy"
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover object-top mr-4"
              />
              <div className="text-center">
                <div className="font-semibold text-slate-800 text-lg">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-[#7C3AED] mb-1">{testimonials[currentTestimonial].position}</div>
                <div className="text-slate-500 text-sm">
                  Project: {testimonials[currentTestimonial].project}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            aria-label="Previous testimonial"
            className="hidden md:flex absolute -left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-slate-600 text-xl"></i>
          </button>
          <button
            onClick={nextTestimonial}
            aria-label="Next testimonial"
            className="hidden md:flex absolute -right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-s-line text-slate-600 text-xl"></i>
          </button>
        </div>

        {/* Mobile Navigation Buttons */}
        <div className="flex justify-center gap-4 mt-6 md:hidden">
          <button
            onClick={prevTestimonial}
            aria-label="Previous testimonial"
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-slate-600 text-lg"></i>
          </button>
          <button
            onClick={nextTestimonial}
            aria-label="Next testimonial"
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-s-line text-slate-600 text-lg"></i>
          </button>
        </div>

        <div className="flex justify-center mt-6 md:mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToTestimonial(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              aria-current={currentTestimonial === index}
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              <span className={`w-3 h-3 rounded-full transition-colors ${currentTestimonial === index ? 'bg-[#7C3AED]' : 'bg-slate-300'}`} />
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#D97706] mb-2">98%</div>
            <div className="text-slate-600">Client Satisfaction Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#D97706] mb-2">150+</div>
            <div className="text-slate-600">Projects Completed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#D97706] mb-2">24h</div>
            <div className="text-slate-600">Average Response Time</div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default Testimonials