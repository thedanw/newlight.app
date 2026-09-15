'use client'
import { useState, useRef, useEffect } from 'react'
import { IconButton } from '@/core/ui'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

interface TabScrollerProps {
  children: React.ReactNode
  scrollAmount?: number
}

export function TabScroller({ children, scrollAmount = 200 }: TabScrollerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = ref.current
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth)
    }
  }

  const scrollLeft = () => {
    ref.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  }

  const scrollRight = () => {
    ref.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll)
    return () => el.removeEventListener('scroll', checkScroll)
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 'calc(0 - var(--spacing-6))', top: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', opacity: canScrollLeft ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: canScrollLeft ? 'auto' : 'none', background: 'linear-gradient(to right, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0))' }}>
        <IconButton variant="plain" size="sm" onClick={scrollLeft} aria-label="Scroll tabs left" css={{ ml: '2' }}>
          <ChevronLeftIcon size={16} />
        </IconButton>
      </div>
      <div style={{ position: 'absolute', right: -12, top: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', opacity: canScrollRight ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: canScrollRight ? 'auto' : 'none', background: 'linear-gradient(to left, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0))' }}>
        <IconButton variant="plain" size="sm" onClick={scrollRight} aria-label="Scroll tabs right" css={{ mr: '2' }}>
          <ChevronRightIcon size={16} />
        </IconButton>
      </div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch'}} ref={ref}>
        {children}
      </div>
    </div>
  )
}