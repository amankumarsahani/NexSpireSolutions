import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Home', path: '/' },
    {
      label: 'Services',
      path: '/services',
      children: [
        { label: 'Web Development', path: '/services/custom-web-development' },
        { label: 'Mobile Apps', path: '/services/mobile-app-development' },
        { label: 'AI & Machine Learning', path: '/services/ai-machine-learning' },
        { label: 'Cloud Solutions', path: '/services/cloud-solutions' },
        { label: 'E-commerce', path: '/services/ecommerce-development' },
      ]
    },
    { label: 'NexCRM', path: '/nexcrm' },
    { label: 'About', path: '/about' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'Blog', path: '/blog' },
    { label: 'Contact', path: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleNavClick = (e, path) => {
    setIsMenuOpen(false);
    // If it's a hash link on the home page, handle scroll
    if (path.startsWith('/#') && location.pathname === '/') {
      e.preventDefault();
      const element = document.querySelector(path.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="fixed w-full top-0 z-50">
      {/* Gradient glass morphism background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 transition-all duration-700 ${scrolled
          ? 'bg-gradient-to-r from-white/85 via-blue-50/80 to-purple-50/85 backdrop-blur-2xl'
          : 'bg-gradient-to-r from-white/70 via-blue-50/60 to-purple-50/70 backdrop-blur-xl'
          }`}></div>

        {/* Enhanced ambient lighting with multiple gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/40 via-purple-100/30 to-pink-100/40"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-indigo-50/30 via-transparent to-cyan-50/30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Modern minimalist logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="group flex items-center space-x-3"
            >
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl shadow-blue-500/25 group-hover:shadow-purple-500/30 transition-all duration-300">
                  <span className="text-white font-bold text-base">N</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-wide drop-shadow-sm">
                Nexspire Solution
              </span>
            </Link>
          </div>

          {/* Ultra-clean desktop navigation */}
          <nav className="hidden lg:flex items-center">
            <div className="relative flex items-center space-x-1 bg-gradient-to-r from-white/80 via-blue-50/70 to-purple-50/80 backdrop-blur-md rounded-full px-3 py-2 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-purple-100/20 to-pink-100/20 rounded-full"></div>
              {navItems.map((item) => (
                <div key={item.label} className="relative group">
                  <Link
                    to={item.path}
                    onClick={(e) => handleNavClick(e, item.path)}
                    className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 inline-flex items-center gap-1 ${isActive(item.path)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:shadow-md hover:shadow-blue-400/20'
                      }`}
                  >
                    {item.label}
                    {item.children && <i className="ri-arrow-down-s-line text-xs font-bold mt-0.5"></i>}
                  </Link>

                  {/* Dropdown Menu */}
                  {item.children && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-64 transform translate-y-2 group-hover:translate-y-0">
                      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden p-2">
                        <div className="flex flex-col gap-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              to={child.path}
                              className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-left flex items-center justify-between group/item"
                            >
                              {child.label}
                              <i className="ri-arrow-right-line opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all text-xs"></i>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Premium CTA button */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/contact"
              className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-xl hover:shadow-purple-500/30 hover:scale-105 before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400 before:via-purple-400 before:to-indigo-400 before:rounded-xl before:opacity-0 hover:before:opacity-20 before:blur-lg before:-z-10 before:transition-opacity"
            >
              <span className="relative z-10 flex items-center">
                Get Started
                <i className="ri-arrow-right-line ml-2 text-sm group-hover:translate-x-0.5 transition-transform duration-300"></i>
              </span>
            </Link>
          </div>

          {/* Minimal mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100/60 via-purple-100/50 to-pink-100/60 backdrop-blur-sm flex items-center justify-center hover:from-blue-200/70 hover:via-purple-200/60 hover:to-pink-200/70 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <div className="w-4 h-3 relative flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.25' : ''
                }`}></span>
              <span className={`w-full h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''
                }`}></span>
              <span className={`w-full h-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.25' : ''
                }`}></span>
            </div>
          </button>
        </div>

        {/* Clean mobile menu */}
        <div className={`lg:hidden absolute left-6 right-6 transition-all duration-300 ${isMenuOpen ? 'top-full opacity-100 visible translate-y-2' : 'top-full opacity-0 invisible'
          }`}>
          <div className="bg-gradient-to-br from-white/95 via-blue-50/90 to-purple-50/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-purple-100/10 to-pink-100/20"></div>
            <nav className="py-4">
              <div className="px-4 space-y-1">
                {navItems.map((item) => (
                  <div key={item.label}>
                    <div
                      onClick={(e) => {
                        if (item.children) {
                          setActiveDropdown(activeDropdown === item.label ? null : item.label);
                        } else {
                          handleNavClick(e, item.path);
                        }
                      }}
                      className={`relative z-10 block px-4 py-2 text-base font-semibold rounded-xl transition-all duration-300 cursor-pointer ${isActive(item.path)
                        ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25'
                        : 'text-slate-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:shadow-md hover:shadow-blue-400/20'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.children ? (
                          <i className={`ri-arrow-down-s-line transition-transform duration-300 ${activeDropdown === item.label ? 'rotate-180' : ''}`}></i>
                        ) : isActive(item.path) && (
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse shadow-sm"></div>
                        )}
                      </div>
                    </div>

                    {item.children && (
                      <div className={`overflow-hidden transition-all duration-300 ${activeDropdown === item.label ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <div className="pl-6 pr-2 space-y-1 border-l-2 border-slate-100 ml-4 pb-2">
                          {item.children.map(child => (
                            <Link
                              key={child.label}
                              to={child.path}
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="relative px-4 pt-4 mt-4">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-blue-300/40 via-purple-300/40 to-pink-300/40"></div>
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="relative block w-full px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white text-center text-base font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-purple-500/30 hover:scale-105 before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400 before:via-purple-400 before:to-indigo-400 before:rounded-xl before:opacity-0 hover:before:opacity-20 before:blur-lg before:-z-10 before:transition-opacity"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;