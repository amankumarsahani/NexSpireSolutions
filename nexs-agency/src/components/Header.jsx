import { useState, useEffect, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { RiArrowDownSLine, RiArrowRightLine } from 'react-icons/ri';

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
  { label: 'NexCRM', path: '/nexcrm', children: [
    { label: 'Overview', path: '/nexcrm' },
    { label: 'Pricing', path: '/nexcrm/pricing' },
    { type: 'divider', label: 'Industries' },
    { label: 'E-commerce', path: '/nexcrm/industries/ecommerce' },
    { label: 'Real Estate', path: '/nexcrm/industries/realestate' },
    { label: 'Healthcare', path: '/nexcrm/industries/healthcare' },
    { label: 'Education', path: '/nexcrm/industries/education' },
    { label: 'Hospitality', path: '/nexcrm/industries/hospitality' },
    { label: 'Restaurant', path: '/nexcrm/industries/restaurant' },
    { label: 'Salon & Spa', path: '/nexcrm/industries/salon' },
    { label: 'Fitness', path: '/nexcrm/industries/fitness' },
    { label: 'Travel', path: '/nexcrm/industries/travel' },
    { label: 'Legal', path: '/nexcrm/industries/legal' },
    { label: 'Manufacturing', path: '/nexcrm/industries/manufacturing' },
    { label: 'Logistics', path: '/nexcrm/industries/logistics' },
    { label: 'Services', path: '/nexcrm/industries/services' },
    { label: 'General', path: '/nexcrm/industries/general' },
  ]},
  { label: 'About', path: '/about' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
];

const Header = memo(function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState(null);
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const showAdminBackups = isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    setActiveDropdown(null);
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useBodyScrollLock(isMenuOpen);

  const handleNavClick = (e, path) => {
    setIsMenuOpen(false);
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
      <div className={`absolute inset-0 transition-all duration-300 ${scrolled
        ? 'bg-white shadow-sm'
        : 'bg-white/95'
        }`}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="group flex items-center space-x-3"
            >
              <div className="relative">
                <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg transition-all duration-300">
                  <span className="text-white font-bold text-base">N</span>
                </div>
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-wide">
                Nexspire Solution
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center">
            <div className="relative flex items-center space-x-1 bg-slate-100 rounded-full px-3 py-2">
              {navItems.map((item) => (
                <div key={item.label} className="relative group">
                  <Link
                    to={item.path}
                    onClick={(e) => handleNavClick(e, item.path)}
                    {...(item.children ? {
                      'aria-haspopup': 'true',
                      'aria-expanded': openDesktopDropdown === item.label,
                      onFocus: () => setOpenDesktopDropdown(item.label),
                      onBlur: () => { setTimeout(() => setOpenDesktopDropdown(null), 150); }
                    } : {})}
                    className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 inline-flex items-center gap-1 ${isActive(item.path)
                      ? 'bg-[#2563EB] text-white shadow-lg'
                      : 'text-slate-700 hover:text-[#2563EB]'
                      }`}
                  >
                    {item.label}
                    {item.children && <RiArrowDownSLine className="text-xs font-bold mt-0.5" />}
                  </Link>

                  {item.children && (
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 ${item.children.length > 8 ? 'w-[420px]' : 'w-64'} transform ${openDesktopDropdown === item.label ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'} group-hover:opacity-100 group-hover:visible group-hover:translate-y-0`}>
                      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-2 max-h-[70vh] overflow-y-auto">
                        <div className={`flex flex-col gap-0.5 ${item.children.some(c => c.type === 'divider') ? '' : ''}`}>
                          {item.children.map((child, ci) => (
                            child.type === 'divider' ? (
                              <div key={ci} className="px-4 pt-3 pb-1.5">
                                <div className="border-t border-slate-100" />
                                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-2">{child.label}</span>
                              </div>
                            ) : (
                            <Link
                              key={child.label}
                              to={child.path}
                              onFocus={() => setOpenDesktopDropdown(item.label)}
                              onBlur={() => { setTimeout(() => setOpenDesktopDropdown(null), 150); }}
                              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#F8FAFC] hover:text-[#2563EB] rounded-xl transition-colors text-left flex items-center justify-between group/item"
                            >
                              {child.label}
                              <RiArrowRightLine className="opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all text-xs" />
                            </Link>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {showAdminBackups ? (
                <div className="relative group">
                  <Link
                    to="/admin/backups"
                    className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 inline-flex items-center gap-1 ${isActive('/admin/backups')
                      ? 'bg-[#2563EB] text-white shadow-lg'
                      : 'text-slate-700 hover:text-[#2563EB]'
                      }`}
                  >
                    Backups
                  </Link>
                </div>
              ) : null}
            </div>
          </nav>

          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/contact"
              className="group bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg"
            >
              <span className="relative z-10 flex items-center">
                Get Started
                <RiArrowRightLine className="ml-2 text-sm group-hover:translate-x-0.5 transition-transform duration-300" />
              </span>
            </Link>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            className="lg:hidden relative w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <div className="w-4 h-3 relative flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-slate-700 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.25' : ''
                }`}></span>
              <span className={`w-full h-0.5 bg-slate-700 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''
                }`}></span>
              <span className={`w-full h-0.5 bg-slate-700 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.25' : ''
                }`}></span>
            </div>
          </button>
        </div>

        <div className={`lg:hidden absolute left-6 right-6 transition-all duration-300 ${isMenuOpen ? 'top-full opacity-100 visible translate-y-2' : 'top-full opacity-0 invisible'
          }`}>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <nav className="py-4">
              <div className="px-4 space-y-1">
                {navItems.map((item) => (
                  <div key={item.label}>
                    {item.children ? (
                      <button
                        onClick={() => {
                          setActiveDropdown(activeDropdown === item.label ? null : item.label);
                        }}
                        aria-expanded={activeDropdown === item.label}
                        className={`relative z-10 w-full text-left px-4 py-2 text-base font-semibold rounded-xl transition-all duration-300 cursor-pointer ${isActive(item.path)
                          ? 'text-white bg-[#2563EB] shadow-lg'
                          : 'text-slate-700 hover:text-[#2563EB] hover:bg-[#F8FAFC]'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{item.label}</span>
                          <RiArrowDownSLine className={`transition-transform duration-300 ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                    ) : (
                    <Link
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`relative z-10 block px-4 py-2 text-base font-semibold rounded-xl transition-all duration-300 ${isActive(item.path)
                        ? 'text-white bg-[#2563EB] shadow-lg'
                        : 'text-slate-700 hover:text-[#2563EB] hover:bg-[#F8FAFC]'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.label}</span>
                      </div>
                    </Link>
                    )}

                    {item.children && (
                      <div className={`overflow-hidden transition-all duration-300 ${activeDropdown === item.label ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <div className="pl-6 pr-2 space-y-0.5 border-l-2 border-slate-200 ml-4 pb-2">
                          {item.children.map((child, ci) => (
                            child.type === 'divider' ? (
                              <div key={ci} className="pt-2 pb-1">
                                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4">{child.label}</span>
                              </div>
                            ) : (
                            <Link
                              key={child.label}
                              to={child.path}
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#2563EB]"
                            >
                              {child.label}
                            </Link>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {showAdminBackups ? (
                  <Link
                    to="/admin/backups"
                    onClick={() => setIsMenuOpen(false)}
                    className={`relative z-10 block px-4 py-2 text-base font-semibold rounded-xl transition-all duration-300 ${isActive('/admin/backups')
                      ? 'text-white bg-[#2563EB] shadow-lg'
                      : 'text-slate-700 hover:text-[#2563EB] hover:bg-[#F8FAFC]'
                      }`}
                  >
                    Backups
                  </Link>
                ) : null}
              </div>

              <div className="relative px-4 pt-4 mt-4">
                <div className="absolute inset-x-0 top-0 h-px bg-slate-200"></div>
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="relative block w-full px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-center text-base font-bold rounded-xl transition-all duration-300 shadow-lg"
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
})

export default Header;
