import { motion } from 'framer-motion';

const milestones = [
    {
        year: '2020',
        title: 'Founded',
        description: 'Nexspire Solutions was born with a vision to deliver exceptional software.',
        icon: 'ri-rocket-2-line',
        color: 'blue'
    },
    {
        year: '2021',
        title: 'First Major Client',
        description: 'Secured our first enterprise client in the US market.',
        icon: 'ri-handshake-line',
        color: 'purple'
    },
    {
        year: '2022',
        title: '50+ Projects',
        description: 'Completed 50 successful projects across 8 countries.',
        icon: 'ri-award-line',
        color: 'emerald'
    },
    {
        year: '2023',
        title: 'AI Integration',
        description: 'Launched AI/ML solutions division, expanding service offerings.',
        icon: 'ri-brain-line',
        color: 'orange'
    },
    {
        year: '2024',
        title: 'Global Reach',
        description: '150+ projects, 12+ countries, 95% client retention rate.',
        icon: 'ri-global-line',
        color: 'pink'
    }
];

const colorMap = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-500' }
};

export default function Timeline({ className = '' }) {
    return (
        <section className={`py-24 bg-gradient-to-b from-gray-50 to-white ${className}`}>
            <div className="container-custom">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4">
                        Our Journey
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Milestones That Define Us
                    </h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        From a small team with big dreams to a global software agency.
                    </p>
                </div>

                <div className="relative">
                    {/* Vertical Timeline Line */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 via-emerald-200 to-pink-200 transform -translate-x-1/2" />

                    <div className="space-y-12 md:space-y-0">
                        {milestones.map((milestone, index) => {
                            const colors = colorMap[milestone.color];
                            const isEven = index % 2 === 0;

                            return (
                                <motion.div
                                    key={milestone.year}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative flex flex-col md:flex-row items-center md:items-start ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                                        }`}
                                >
                                    {/* Content Card */}
                                    <div className={`w-full md:w-5/12 ${isEven ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                                        <div className={`inline-block bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow ${isEven ? 'md:ml-auto' : ''
                                            }`}>
                                            <span className={`text-sm font-bold ${colors.text}`}>
                                                {milestone.year}
                                            </span>
                                            <h3 className="text-xl font-bold text-gray-900 mt-1 mb-2">
                                                {milestone.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm">
                                                {milestone.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Center Icon */}
                                    <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-2xl bg-white shadow-lg border-2 items-center justify-center z-10"
                                        style={{ borderColor: colors.border.replace('border-', '#').replace('-500', '') }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                            <i className={`${milestone.icon} text-xl ${colors.text}`}></i>
                                        </div>
                                    </div>

                                    {/* Spacer for opposite side */}
                                    <div className="hidden md:block w-5/12" />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
