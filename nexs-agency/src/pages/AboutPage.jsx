import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Import Assets
import officeImg from '../assets/office_collaboration.png';
import avatarAman from '../assets/avatar_aman.png';
import avatarAnu from '../assets/avatar_anu.png';
import avatarKshitij from '../assets/avatar_kshitij.png';

// Utility for tailwind class merging
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const FadeIn = ({ children, className, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const stats = [
    { label: "Years of Innovation", value: "5+" },
    { label: "Projects Delivered", value: "150+" },
    { label: "Team Experts", value: "25+" },
    { label: "Client Retention", value: "98%" }
  ];

  const values = [
    {
      title: "Innovation First",
      description: "We don't just follow trends; we set them. Our labs are constantly exploring AI, Blockchain, and Cloud advancements.",
      icon: "ri-lightbulb-flash-line",
      color: "blue"
    },
    {
      title: "Client Obsession",
      description: "Your growth is our north star. We build long-term partnerships, not just software.",
      icon: "ri-user-heart-line",
      color: "purple"
    },
    {
      title: "Engineering Excellence",
      description: "Spaghetti code has no place here. We write clean, scalable, and maintainable code.",
      icon: "ri-code-s-slash-line",
      color: "emerald"
    },
    {
      title: "Design Mastery",
      description: "We craft interfaces that are not only beautiful but also intuitive and accessible.",
      icon: "ri-pencil-ruler-2-line",
      color: "pink"
    }
  ];

  const team = [
    // {
    //   name: "Aman Kumar Sahani",
    //   role: "Founder & Lead Architect",
    //   image: avatarAman,
    //   bio: "Visionary leader with a passion for scalable architecture and AI integration."
    // },
    {
      name: "Anu Kumar",
      role: "Creative Director",
      image: avatarAnu,
      bio: "Award-winning designer who believes in the power of minimalism and user-centric design."
    },
    {
      name: "Kshitij Bhardwaj",
      role: "Senior Tech Lead",
      image: avatarKshitij,
      bio: "Full-stack wizard ensuring code quality and performance across all projects."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white overflow-hidden">
      <Helmet>
        <title>About Nexspire Solutions – Global Software Agency</title>
        <meta name="description" content="Discover Nexspire Solutions, a top software development agency delivering web, mobile, AI, cloud, and enterprise solutions to clients globally. Founded in 2020, serving startups, SMEs, and enterprises across North America, Europe, Middle East, and Asia-Pacific." />
        <meta name="keywords" content="global software agency, top software company worldwide, international software solutions, AI software development, about nexspire solutions, software company india, tech experts usa uk, digital transformation partners" />
        <link rel="canonical" href="https://nexspiresolutions.co.in/about" />
        <meta property="og:title" content="About Nexspire Solutions – Global Software Agency" />
        <meta property="og:description" content="Top software development agency delivering web, mobile, AI, cloud, and enterprise solutions to clients globally." />
        <meta property="og:url" content="https://nexspiresolutions.co.in/about" />
      </Helmet>

      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Hero Section - Consistent 3D Gradient Mesh */}
      <section className="relative min-h-[80vh] flex items-center pt-20 overflow-hidden bg-gray-950 text-white">
        {/* CSS-based Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-soft-light"></div>
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-block py-2 px-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-blue-300 font-medium mb-8">
              Who We Are
            </span>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-8">
              Architects of the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Digital Future.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Nexspire is more than an agency. We are a collective of dreamers, doers, and creators dedicated to building software that matters.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {stats.map((stat, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest font-medium">{stat.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section - Standard Grid Layout */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-[3rem] rotate-3 opacity-10"></div>
              <img
                src={officeImg}
                alt="Our Team Collaborating"
                className="relative rounded-[3rem] shadow-2xl object-cover h-[500px] w-full"
              />
            </FadeIn>

            <div className="space-y-12">
              <FadeIn>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">The Origin Story</h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Founded in 2020, Nexspire began as a collective of passionate engineers and designers tired of the status quo. We saw a gap in the market for a development partner that truly understood both the <strong>technical</strong> and <strong>business</strong> aspects of building digital products.
                </p>
              </FadeIn>

              <FadeIn delay={0.2}>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  To empower businesses with cutting-edge technology that drives growth, efficiency, and innovation. We believe in building software that is not only functional but also delightful to use.
                </p>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Values - Grid Layout */}
      <section className="py-32 bg-gray-50 relative">
        <div className="container-custom">
          <FadeIn className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Our Core Values</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              The principles that guide every line of code we write and every pixel we design.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, i) => (
              <FadeIn key={i} delay={i * 0.1} className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className={`w-16 h-16 rounded-2xl bg-${value.color}-50 flex items-center justify-center text-3xl text-${value.color}-600 mb-6 group-hover:scale-110 transition-transform`}>
                  <i className={value.icon}></i>
                </div>
                <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{value.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Team - Standard Cards */}
      <section className="py-32 bg-white relative">
        <div className="container-custom">
          <FadeIn className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Meet the Minds</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              A diverse team of experts united by a passion for technology and design.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-12">
            {team.map((member, i) => (
              <FadeIn key={i} delay={i * 0.1} className="group">
                <div className="relative overflow-hidden rounded-[2rem] mb-8 aspect-[4/5]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex flex-col justify-end p-8">
                    <p className="text-white/90 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {member.bio}
                    </p>
                    <div className="flex gap-4 mt-4 text-white">
                      <a href="#" className="hover:text-blue-400"><i className="ri-linkedin-fill text-xl"></i></a>
                      <a href="#" className="hover:text-blue-400"><i className="ri-twitter-x-fill text-xl"></i></a>
                    </div>
                  </div>
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-medium uppercase tracking-wider text-sm">{member.role}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gray-900 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="container-custom relative z-10">
          <FadeIn>
            <h2 className="text-5xl md:text-7xl font-bold mb-12 tracking-tighter">Ready to innovate?</h2>
            <Link to="/contact" className="inline-flex items-center gap-4 px-12 py-6 bg-white text-black rounded-full text-xl font-bold hover:bg-blue-600 hover:text-white transition-all duration-300 group">
              Let's Talk
              <i className="ri-arrow-right-line group-hover:translate-x-2 transition-transform"></i>
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
