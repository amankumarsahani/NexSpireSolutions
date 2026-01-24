import { motion } from 'framer-motion';

const clients = [
    { name: 'TechCorp', initial: 'TC' },
    { name: 'HealthPlus', initial: 'HP' },
    { name: 'EduLearn', initial: 'EL' },
    { name: 'FinanceFirst', initial: 'FF' },
    { name: 'RetailMax', initial: 'RM' },
    { name: 'LogiFlow', initial: 'LF' }
];

export default function ClientLogos({ className = '', title = 'Trusted by Industry Leaders' }) {
    return (
        <section className={`py-16 bg-white ${className}`}>
            <div className="container-custom">
                <div className="text-center mb-10">
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                        {title}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                    {clients.map((client, index) => (
                        <motion.div
                            key={client.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="group cursor-default"
                        >
                            <div className="w-24 h-12 md:w-32 md:h-14 bg-gray-50 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-blue-50 group-hover:shadow-lg border border-gray-100 group-hover:border-blue-100">
                                <span className="text-lg md:text-xl font-bold text-gray-300 group-hover:text-blue-500 transition-colors">
                                    {client.initial}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center mt-8">
                    <p className="text-sm text-gray-400">
                        Join 50+ companies transforming their digital presence
                    </p>
                </div>
            </div>
        </section>
    );
}
