import { useEffect, useRef, useState } from 'react'

/**
 * ScrollReveal - Animates children when they enter the viewport
 * @param {string} animation - Animation type: 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'zoom', 'flip'
 * @param {number} delay - Delay in ms before animation starts
 * @param {number} duration - Animation duration in ms
 * @param {string} className - Additional classes
 */
const animationStyles = {
    'fade-up': {
        initial: { opacity: 0, transform: 'translateY(40px)' },
        visible: { opacity: 1, transform: 'translateY(0)' }
    },
    'fade-down': {
        initial: { opacity: 0, transform: 'translateY(-40px)' },
        visible: { opacity: 1, transform: 'translateY(0)' }
    },
    'fade-left': {
        initial: { opacity: 0, transform: 'translateX(-40px)' },
        visible: { opacity: 1, transform: 'translateX(0)' }
    },
    'fade-right': {
        initial: { opacity: 0, transform: 'translateX(40px)' },
        visible: { opacity: 1, transform: 'translateX(0)' }
    },
    'zoom': {
        initial: { opacity: 0, transform: 'scale(0.9)' },
        visible: { opacity: 1, transform: 'scale(1)' }
    },
    'flip': {
        initial: { opacity: 0, transform: 'rotateX(-10deg)' },
        visible: { opacity: 1, transform: 'rotateX(0)' }
    }
}

export default function ScrollReveal({
    children,
    animation = 'fade-up',
    delay = 0,
    duration = 600,
    threshold = 0.1,
    className = '',
    once = true
}) {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    if (once) {
                        observer.disconnect()
                    }
                } else if (!once) {
                    setIsVisible(false)
                }
            },
            { threshold, rootMargin: '50px' }
        )

        const currentRef = ref.current
        if (currentRef) {
            observer.observe(currentRef)
        }

        return () => {
            observer.disconnect()
        }
    }, [threshold, once])

    const style = animationStyles[animation] || animationStyles['fade-up']
    const currentStyle = isVisible ? style.visible : style.initial

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...currentStyle,
                transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
                transitionDelay: `${delay}ms`,
                willChange: 'opacity, transform'
            }}
        >
            {children}
        </div>
    )
}

/**
 * StaggerReveal - Reveals children with staggered delay using a single observer
 */
export function StaggerReveal({
    children,
    animation = 'fade-up',
    staggerDelay = 100,
    baseDelay = 0,
    duration = 600,
    threshold = 0.1,
    className = '',
    once = true
}) {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    if (once) {
                        observer.disconnect()
                    }
                } else if (!once) {
                    setIsVisible(false)
                }
            },
            { threshold, rootMargin: '50px' }
        )

        const currentRef = ref.current
        if (currentRef) {
            observer.observe(currentRef)
        }

        return () => {
            observer.disconnect()
        }
    }, [threshold, once])

    const style = animationStyles[animation] || animationStyles['fade-up']
    const currentStyle = isVisible ? style.visible : style.initial

    return (
        <div ref={ref} className={className}>
            {Array.isArray(children) ? children.map((child, index) => (
                <div
                    key={index}
                    style={{
                        ...currentStyle,
                        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
                        transitionDelay: `${baseDelay + (index * staggerDelay)}ms`,
                        willChange: 'opacity, transform'
                    }}
                >
                    {child}
                </div>
            )) : (
                <div
                    style={{
                        ...currentStyle,
                        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
                        transitionDelay: `${baseDelay}ms`,
                        willChange: 'opacity, transform'
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}
