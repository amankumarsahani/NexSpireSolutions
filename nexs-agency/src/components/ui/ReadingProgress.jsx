// eslint-disable-next-line no-unused-vars
import { motion, useScroll } from 'framer-motion';

export default function ReadingProgress() {
    const { scrollYProgress } = useScroll();

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-[#6D28D9] origin-left z-[60]"
            style={{ scaleX: scrollYProgress }}
        />
    );
}
