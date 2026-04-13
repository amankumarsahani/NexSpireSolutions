import { useRef, memo } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const MagneticButton = memo(function MagneticButton({ children, className = '', as = 'a', strength = 0.35, ...props }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 250, damping: 20, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 250, damping: 20, mass: 0.5 })

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * strength)
    y.set((e.clientY - centerY) * strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const Tag = motion[as] || motion.a

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
      {...props}
    >
      {children}
    </Tag>
  )
})

export default MagneticButton
