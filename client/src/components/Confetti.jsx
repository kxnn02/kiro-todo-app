import { useEffect, useState, useRef } from 'react'

const COLORS = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444']
const PARTICLE_COUNT = 20

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (360 / PARTICLE_COUNT) * i + (Math.random() * 30 - 15)
    const velocity = 60 + Math.random() * 80
    const radians = (angle * Math.PI) / 180
    const tx = Math.cos(radians) * velocity
    const ty = Math.sin(radians) * velocity
    const size = 4 + Math.random() * 6
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const duration = 600 + Math.random() * 400
    const shape = Math.random() > 0.5 ? 'circle' : 'square'
    const rotation = Math.random() * 360

    return { id: i, tx, ty, size, color, duration, shape, rotation }
  })
}

export default function Confetti({ active, onComplete }) {
  const [particles, setParticles] = useState([])
  const [visible, setVisible] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (active) {
      setParticles(generateParticles())
      setVisible(true)

      const timer = setTimeout(() => {
        setVisible(false)
        onCompleteRef.current?.()
      }, 1100)

      return () => clearTimeout(timer)
    }
  }, [active])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: 50 }}
      aria-hidden="true"
    >
      <div className="relative w-full h-full">
        {particles.map((p) => (
          <span
            key={p.id}
            className="confetti-particle absolute"
            style={{
              left: '50%',
              top: '50%',
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': `${p.rotation}deg`,
              animationDuration: `${p.duration}ms`,
              animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              animationFillMode: 'forwards',
            }}
          />
        ))}
      </div>
    </div>
  )
}
