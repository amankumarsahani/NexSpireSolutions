import { memo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const steps = [
    {
        number: '01',
        title: 'Discovery',
        description: 'We dive deep into your business goals, target audience, and technical requirements.',
        icon: 'ri-search-eye-line',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        number: '02',
        title: 'Design',
        description: 'Creating intuitive wireframes and stunning UI designs that align with your brand.',
        icon: 'ri-palette-line',
        color: 'from-purple-500 to-pink-500'
    },
    {
        number: '03',
        title: 'Develop',
        description: 'Building scalable, secure solutions using modern technologies and best practices.',
        icon: 'ri-code-s-slash-line',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        number: '04',
        title: 'Deploy',
        description: 'Rigorous testing, seamless deployment, and ongoing support for your success.',
        icon: 'ri-arrow-right-up-line',
        color: 'from-orange-500 to-red-500'
    }
];

const ProcessSection = memo(function ProcessSection({ className = '' }) {
    return (
        <section className={`py-24 bg-white overflow-hidden ${className}`}>
            <div className="container-custom">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 bg-[#6D28D9]/10 text-[#6D28D9] rounded-full text-sm font-bold mb-4">
                        Our Approach
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
                        How We Bring Ideas to Life
                    </h2>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        A proven methodology that ensures quality, transparency, and on-time delivery.
                    </p>
                </div>

                <div className="relative">
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200 text-center h-full">
                                    {/* Step Number Badge */}
                                    <div className={`w-16 h-16 rounded-2xl bg-[#6D28D9] flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-lg group- transition-transform duration-500`}>
                                        <i className={step.icon}></i>
                                    </div>

                                    <span className="text-sm font-bold text-[#6D28D9]">
                                        Step {step.number}
                                    </span>

                                    <h3 className="text-xl font-bold text-slate-800 mt-2 mb-3">
                                        {step.title}
                                    </h3>

                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Arrow for desktop */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-gray-300 z-20">
                                        <i className="ri-arrow-right-line text-2xl"></i>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
})

export default ProcessSection;
