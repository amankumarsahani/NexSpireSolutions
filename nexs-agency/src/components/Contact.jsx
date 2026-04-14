import { useState, useRef, useEffect, memo } from 'react';
import { inquiryAPI } from '../services/api';

const Contact = memo(function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
        message: 'Thank you for your message! We\'ll get back to you within one business day.'
      });

      setFormData({ name: '', email: '', message: '' });

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

  return (
    <section id="contact" className="bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="font-serif text-4xl md:text-5xl text-slate-900">Let&rsquo;s talk about your project</h2>
          <p className="text-lg text-slate-600 mt-4 max-w-2xl leading-relaxed">
            Tell us what you&rsquo;re building. We&rsquo;ll get back to you within one business day.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all bg-white text-sm"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all bg-white text-sm"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              minLength={10}
              maxLength={2000}
              className="w-full h-48 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all resize-none bg-white text-sm"
              placeholder="Tell us about your project..."
            ></textarea>
          </div>

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
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 rounded-lg font-semibold transition-colors duration-300 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Sending...
              </span>
            ) : (
              'Send message'
            )}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6">
          or email us directly at{' '}
          <a href="mailto:nexspiretechsolutions@gmail.com" className="text-slate-700 hover:text-[#2563EB] transition-colors">
            nexspiretechsolutions@gmail.com
          </a>
        </p>
      </div>
    </section>
  );
})

export default Contact;
