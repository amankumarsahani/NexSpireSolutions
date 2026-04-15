import { useState } from 'react';
import { inquiryAPI } from '../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

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

      // Reset form
      setFormData({ name: '', email: '', phone: '', company: '', message: '' });

      // Clear success message after 5 seconds
      setTimeout(() => {
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

  const socialLinks = [
    { icon: "ri-github-line", href: "https://github.com/orgs/Nexspire-Solutions/repositories", label: "GitHub" },
    { icon: "ri-linkedin-line", href: "https://www.linkedin.com/company/nexspire-solution", label: "LinkedIn" },
    { icon: "ri-instagram-line", href: "https://www.instagram.com/nexspire_solutions/", label: "Instagram" }
  ];

  return (
    <section id="contact" className="relative py-20 bg-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Geometric Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
            <defs>
              <pattern id="contact-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="2" fill="currentColor" className="text-blue-200" />
                <path d="M30 15 L45 30 L30 45 L15 30 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-purple-200" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contact-pattern)" />
          </svg>
        </div>

        {/* Gradient Overlays */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/30 via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-100/30 via-transparent to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 text-gray-700 text-sm font-semibold px-6 py-3 rounded-full mb-8 shadow-sm">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
            <span>Let's Connect</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="block text-gray-900">Ready to Start</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mt-1">
              Your Project?
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Let's discuss your vision and turn it into reality. We're here to help you build something amazing.
          </p>
        </div>

        {/* Main Contact Section - Equal Heights */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Form */}
          <div className="order-2 lg:order-1">
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-mail-line text-lg text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Send us a message
                </h3>
              </div>

              <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-5 h-full flex flex-col">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
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
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                          placeholder="Name"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <i className="ri-user-line text-gray-400 text-sm"></i>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                          placeholder="xyz@gmail.com"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <i className="ri-mail-line text-gray-400 text-sm"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
                      Company (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                        placeholder="Your Company"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <i className="ri-building-line text-gray-400 text-sm"></i>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                        placeholder="+91 12345 67890"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <i className="ri-phone-line text-gray-400 text-sm"></i>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Message *
                    </label>
                    <div className="relative h-full">
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="w-full h-32 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white text-sm"
                        placeholder="Tell us about your project..."
                      ></textarea>
                      <div className="absolute top-3 right-3 pointer-events-none">
                        <i className="ri-message-3-line text-gray-400 text-sm"></i>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    {/* Status Message */}
                    {submitStatus.message && (
                      <div className={`p-3 rounded-lg text-sm ${submitStatus.type === 'success'
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
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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

                    {/* Form Security Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                      <div className="flex items-center">
                        <i className="ri-shield-check-line mr-2 text-green-500"></i>
                        <span>Your information is secure</span>
                      </div>
                      <div className="flex items-center">
                        <i className="ri-time-line mr-2 text-blue-500"></i>
                        <span>Response in 24 hours</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="order-1 lg:order-2">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-information-line text-lg text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Get In Touch
                </h3>
              </div>
              <p className="text-gray-600 mb-6 text-sm">
                We're here to help bring your ideas to life. Reach out through any of these channels.
              </p>

              {/* Contact Methods */}
              <div className="space-y-4 flex-1">
                {contactInfo.map((info, index) => (
                  <div key={index} className="group">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <i className={`${info.icon} text-sm text-white`}></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {info.title}
                          </h4>
                          <p className="text-blue-600 font-medium mb-1 text-xs">
                            {info.details}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Follow Us Section */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="ri-share-line text-sm text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        Follow Us
                      </h4>
                      <p className="text-gray-500 text-xs">
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
                        className="w-8 h-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
                      >
                        <i className={`${social.icon} text-xs text-gray-600 group-hover:text-blue-600`}></i>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Sections Below */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-xl text-white"></i>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Quick Response</h4>
                <p className="text-emerald-600 text-sm font-medium">We respond within 24 hours</p>
                <p className="text-gray-500 text-xs">Fast and reliable communication</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <i className="ri-customer-service-line text-xl text-white"></i>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">24/7 Support</h4>
                <p className="text-orange-600 text-sm font-medium">Always available to help</p>
                <p className="text-gray-500 text-xs">Dedicated support team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;