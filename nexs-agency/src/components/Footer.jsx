import { memo } from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../constants/siteConfig';

const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();

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

  const socialLinks = siteConfig.social;

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
                className="text-2xl font-extrabold italic bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4 inline-block"
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

        {/* Stay Connected Section */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Stay Connected</h3>
              <p className="text-gray-400">
                Follow us on social media for the latest updates, insights, and behind-the-scenes content.
              </p>
            </div>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-300"
                >
                  <i className={`${social.icon} text-xl`}></i>
                </a>
              ))}
            </div>
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
            </div>
          </div>
        </div>
      </div>
    </footer >
  );
})

export default Footer;