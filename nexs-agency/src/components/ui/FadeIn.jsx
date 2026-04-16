import { motion } from 'framer-motion';

const FadeIn = ({
    children,
    className,
    delay = 0,
    y = 20,
    duration = 0.6,
    ease = 'easeOut',
    margin = '-50px',
}) => (
    <motion.div
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin }}
        transition={{ duration, delay, ease }}
        className={className}
    >
        {children}
    </motion.div>
);

export default FadeIn;
