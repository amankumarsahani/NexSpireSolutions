// TODO: Replace console.error with Sentry or proper error tracking
import { useState, useRef, useEffect, memo } from 'react';
import { inquiryAPI } from '../services/api';
import { siteConfig } from '../constants/siteConfig';

const Contact = memo(function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const statusTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      await inquiryAPI.submit(formData);

      setSubmitStatus({
        type: 'success',
        message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
      });

      setFormData({ name: '', email: '', phone: '', company: '', message: '' });

      statusTimeoutRef.current = setTimeout(() => {
        setSubmitStatus({ type: '', message: '' });
      }, 5000);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to send message. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: "ri-mail-line",
      title: "Email Us",
      details: "nexspiretechsolutions@gmail.com",
      description: "Send us an email anytime!"
    },
    {
      icon: "ri-phone-line",
      title: "Call Us",
      details: "+91 9729916844",
      description: "Mon-Fri from 8am to 10pm"
    },
    {
      icon: "ri-map-pin-line",
      title: "Visit Us",
      details: "Mohali, SAS Nagar, Punjab, IN",
      description: "Come say hello at our office"
    }
  ];

  const socialLinks = siteConfig.social;

  return (
    <section id="contact" className="relative py-20 bg-white overflow-hidden">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left mb-16">
          <span className="text-sm font-semibold text-[#6D28D9] uppercase tracking-wider">Let's Connect</span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 mt-4 leading-tight">
            Ready to Start
            <span className="block text-[#6D28D9] mt-1">
              Your Project?
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            Let's discuss your vision and turn it into reality. We're here to help you build something amazing.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-[#6D28D9] rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-mail-line text-lg text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Send us a message
                </h3>
              </div>

              <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-5 h-full flex flex-col">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          minLength={2}
                          maxLength={100}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] transition-all bg-white text-sm"
                          placeholder="Name"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <i className="ri-user-line text-slate-400 text-sm"></i>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] transition-all bg-white text-sm"
                          placeholder="xyz@gmail.com"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <i className="ri-mail-line text-slate-400 text-sm"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                      Company (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        maxLength={100}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] transition-all bg-white text-sm"
                        placeholder="Your Company"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <i className="ri-building-line text-slate-400 text-sm"></i>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] transition-all bg-white text-sm"
                        placeholder="+91 12345 67890"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <i className="ri-phone-line text-slate-400 text-sm"></i>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                      Message *
                    </label>
                    <div className="relative h-full">
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        minLength={10}
                        maxLength={2000}
                        className="w-full h-32 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] transition-all resize-none bg-white text-sm"
                        placeholder="Tell us about your project..."
                      ></textarea>
                      <div className="absolute top-3 right-3 pointer-events-none">
                        <i className="ri-message-3-line text-slate-400 text-sm"></i>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    {submitStatus.message && (
                      <div role="alert" className={`p-3 rounded-lg text-sm ${submitStatus.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        <div className="flex items-center">
                          <i className={`${submitStatus.type === 'success'
                            ? 'ri-checkbox-circle-line'
                            : 'ri-error-warning-line'
                            } mr-2`}></i>
                          <span>{submitStatus.message}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white py-3 rounded-lg font-semibold transition-all duration-300 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center">
                        {isSubmitting ? (
                          <>
                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <i className="ri-send-plane-line ml-2"></i>
                          </>
                        )}
                      </span>
                    </button>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200">
                      <div className="flex items-center">
                        <i className="ri-shield-check-line mr-2 text-green-500"></i>
                        <span>Your information is secure</span>
                      </div>
                      <div className="flex items-center">
                        <i className="ri-time-line mr-2 text-[#6D28D9]"></i>
                        <span>Response in 24 hours</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="bg-[#FAF9F6] rounded-2xl p-6 border border-slate-200 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-[#6D28D9] rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-information-line text-lg text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Get In Touch
                </h3>
              </div>
              <p className="text-slate-600 mb-6 text-sm">
                We're here to help bring your ideas to life. Reach out through any of these channels.
              </p>

              <div className="space-y-4 flex-1">
                {contactInfo.map((info, index) => (
                  <div key={index} className="group">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#6D28D9] rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className={`${info.icon} text-sm text-white`}></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-slate-800 mb-1">
                            {info.title}
                          </h4>
                          <p className="text-[#6D28D9] font-medium mb-1 text-xs">
                            {info.details}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-[#6D28D9] rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="ri-share-line text-sm text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 mb-1">
                        Follow Us
                      </h4>
                      <p className="text-slate-500 text-xs">
                        Stay updated with our latest projects
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 pl-13">
                    {socialLinks.map((social, index) => (
                      <a
                        key={index}
                        href={social.href}
                        aria-label={social.label}
                        className="w-8 h-8 bg-[#FAF9F6] rounded-lg flex items-center justify-center border border-slate-200 hover:border-[#6D28D9]/30 hover:bg-[#6D28D9]/5 transition-all duration-300 group"
                      >
                        <i className={`${social.icon} text-xs text-slate-600 group-hover:text-[#6D28D9]`}></i>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#FAF9F6] rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-xl text-white"></i>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Quick Response</h4>
                <p className="text-emerald-600 text-sm font-medium">We respond within 24 hours</p>
                <p className="text-slate-500 text-xs">Fast and reliable communication</p>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF9F6] rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#D97706] rounded-lg flex items-center justify-center">
                <i className="ri-customer-service-line text-xl text-white"></i>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">24/7 Support</h4>
                <p className="text-[#D97706] text-sm font-medium">Always available to help</p>
                <p className="text-slate-500 text-xs">Dedicated support team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
})

export default Contact;
