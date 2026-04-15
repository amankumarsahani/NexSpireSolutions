import { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }, 1000);
  };

  const footerLinks = {
    Services: [
      { name: "Custom Web Development", href: "/services/custom-web-development" },
      { name: "Mobile App Development", href: "/services/mobile-app-development" },
      { name: "AI & Machine Learning", href: "/services/ai-machine-learning" },
      { name: "Cloud Solutions", href: "/services/cloud-solutions" },
      { name: "E-commerce Solutions", href: "/services/ecommerce-development" }
    ],
    Locations: [
      { name: "Web Dev in London", href: "/software-development-company/london" },
      { name: "Web Dev in New York", href: "/software-development-company/new-york" },
      { name: "Web Dev in Dubai", href: "/software-development-company/dubai" },
      { name: "Web Dev in Sydney", href: "/software-development-company/sydney" },
      { name: "Web Dev in Toronto", href: "/software-development-company/toronto" },
      { name: "Web Dev in Bangalore", href: "/software-development-company/bangalore" }
    ],
    Company: [
      { name: "About Us", href: "/about" },
      { name: "Portfolio", href: "/portfolio" },
      { name: "Contact", href: "/contact" },
      { name: "Blog", href: "/blog" },
      { name: "NexCRM", href: "/nexcrm" }
    ]
  };

  const socialLinks = [
    { icon: "ri-github-line", href: "https://github.com/orgs/Nexspire-Solutions/repositories", label: "GitHub" },
    { icon: "ri-linkedin-line", href: "https://www.linkedin.com/company/nexspire-solution", label: "LinkedIn" },
    { icon: "ri-instagram-line", href: "https://www.instagram.com/nexspire_solutions/", label: "Instagram" }
  ];

  return (
    <footer className="bg-gray-900 text-white" >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <Link
                to="/"
                className="text-2xl font-['Pacifico'] bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4 inline-block"
              >
                Nexspire Solution
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed">
                We're a passionate team dedicated to creating exceptional software
                solutions that help businesses thrive in the digital world.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-300"
                  >
                    <i className={`${social.icon} text-lg`}></i>
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-4">{category}</h3>
                <ul className="space-y-3">
                  {links.map((link, index) => (
                    <li key={index}>
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-300"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-800 py-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
              <p className="text-gray-400">
                Get the latest news and updates about our services and industry insights.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 relative">
              {subscribed ? (
                <div className="flex-1 bg-green-500/20 border border-green-500/50 text-green-400 px-6 py-3 rounded-lg flex items-center justify-center">
                  <i className="ri-checkbox-circle-line mr-2"></i>
                  Subscribed successfully!
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 whitespace-nowrap cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <i className="ri-loader-4-line animate-spin text-xl"></i>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Nexspire Solution. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50" >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-14 h-14 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 active:bg-blue-800 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Scroll to top"
        >
          <i className="ri-arrow-up-line text-xl sm:text-lg text-white"></i>
        </button>
      </div >
    </footer >
  );
};

export default Footer;