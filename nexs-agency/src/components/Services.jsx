import { memo } from 'react'
import { Link } from 'react-router-dom'

const services = [
  {
    title: "Web Development",
    description: "Modern, responsive websites built with cutting-edge technologies and industry best practices for optimal performance.",
    features: ["React & Next.js", "Node.js & Python", "Mobile-First Design", "Performance Optimization"],
    link: "/services/custom-web-development"
  },
  {
    title: "Mobile Apps",
    description: "Native and cross-platform mobile applications that deliver exceptional user experiences across all devices.",
    features: ["iOS & Android", "React Native", "Flutter Development", "App Store Deployment"],
    link: "/services/mobile-app-development"
  },
  {
    title: "Cloud Solutions",
    description: "Scalable cloud infrastructure and DevOps solutions that grow with your business needs and requirements.",
    features: ["AWS & Azure", "Docker & Kubernetes", "CI/CD Pipelines", "Auto-scaling Systems"],
    link: "/services/cloud-solutions"
  },
  {
    title: "UI/UX Design",
    description: "Beautiful, intuitive designs that enhance user experience and drive engagement through thoughtful interface design.",
    features: ["User Research", "Interactive Prototypes", "Design Systems", "Accessibility Focus"],
    link: "/services"
  },
  {
    title: "E-commerce Solutions",
    description: "Complete e-commerce platforms with advanced payment integration and comprehensive inventory management systems.",
    features: ["Custom E-commerce", "Payment Integration", "Inventory Management", "Analytics Dashboard"],
    link: "/services/ecommerce-development"
  },
  {
    title: "Security & Testing",
    description: "Comprehensive security audits and rigorous testing protocols to ensure your applications are secure and reliable.",
    features: ["Security Audits", "Penetration Testing", "Code Quality Reviews", "Compliance Standards"],
    link: "/services"
  }
];

const ServiceCard = memo(function ServiceCard({ service }) {
  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 hover:border-[#2563EB]/30 transition-colors">
      <h3 className="text-xl font-bold text-slate-900 mb-3">
        <Link to={service.link} className="hover:text-[#2563EB] transition-colors">{service.title}</Link>
      </h3>
      <p className="text-slate-600 mb-5 leading-relaxed text-sm">{service.description}</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {service.features.map((feature, i) => (
          <span key={i} className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
            {feature}
          </span>
        ))}
      </div>

      <Link to={service.link} className="text-sm font-semibold text-[#2563EB] hover:opacity-80 transition-opacity">
        Learn more &rarr;
      </Link>
    </div>
  )
})

const Services = memo(function Services() {
  return (
    <section id="services" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 lg:mb-20">
          <h2 className="font-serif text-4xl md:text-5xl text-slate-900">What we do</h2>
          <p className="text-lg text-slate-600 max-w-3xl mt-4 leading-relaxed">
            We design and develop custom software across web, mobile, and cloud — from first prototype to production scale.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
});

export default Services;
