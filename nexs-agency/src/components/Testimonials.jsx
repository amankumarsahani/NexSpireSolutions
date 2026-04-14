import { memo } from 'react'

const testimonials = [
  {
    text: "The custom CRM they built transformed our sales process \u2014 team productivity up 50%, customer satisfaction at an all-time high.",
    name: "David Thompson",
    position: "Sales Director, InnovateSales"
  }
];

const Testimonials = memo(function Testimonials() {
  const testimonial = testimonials[0];

  return (
    <section id="testimonials" className="bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <blockquote className="font-serif text-3xl md:text-4xl lg:text-5xl text-slate-800 leading-tight">
          &ldquo;{testimonial.text}&rdquo;
        </blockquote>
        <div className="mt-8">
          <p className="font-semibold text-slate-800 text-lg">{testimonial.name}</p>
          <p className="text-slate-500">{testimonial.position}</p>
        </div>
      </div>
    </section>
  )
})

export default Testimonials
