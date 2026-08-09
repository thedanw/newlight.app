'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeftIcon } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { css } from 'styled-system/css'
import { token } from 'styled-system/tokens'
import { CloseButton, Heading } from '@/core/ui'
import { HStack } from 'styled-system/jsx'

/* ---------------------------------------------------------------------------
   SlidePanel — minimal portal overlay with three variants (ui-ux #32–35):
   - 'normal'     centered modal (sizes.3xl), rise/fade/scale .95→1, backdrop
   - 'fullscreen' full-screen slide-in from right, title bar + back chevron
   - 'immersive'  full-screen slide-in from right, floating close only, dark
                  backdrop
   Uses framer-motion `motion` + controlled mount/unmount, `durations.slowest`,
   useReducedMotion.
--------------------------------------------------------------------------- */

export type SlidePanelVariant = 'normal' | 'fullscreen' | 'immersive'

export type SlidePanelProps = {
  open: boolean
  onClose: () => void
  variant?: SlidePanelVariant
  title?: ReactNode
  /** Optional extra header action rendered next to the close button. */
  headerAction?: ReactNode
  children: ReactNode
}

const SLOWEST_MS = Number.parseFloat(token('durations.slowest'))
const SLOWEST_S = SLOWEST_MS / 1000
const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]

export function SlidePanel({ open, onClose, variant = 'normal', title, headerAction, children }: SlidePanelProps) {
  const reduceMotion = useReducedMotion()
  // Deterministic controlled mount/unmount (ui-ux #32): mount as soon as the
  // panel opens; on close, keep the DOM alive for the exit duration, then
  // unmount. (framer-motion 13 + React 19: AnimatePresence exit left portal
  // elements stuck in the DOM — this avoids relying on presence internals.)
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  const isSlide = variant === 'fullscreen' || variant === 'immersive'

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    if (mounted) {
      setClosing(true)
      const timer = setTimeout(() => {
        setMounted(false)
        setClosing(false)
      }, SLOWEST_MS)
      return () => clearTimeout(timer)
    }
  }, [open, mounted])

  // Body scroll-lock while mounted (ui-ux #32).
  useEffect(() => {
    if (!mounted) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mounted])

  if (!mounted) return null

  const enterState = reduceMotion
    ? { opacity: 1 }
    : isSlide
      ? { opacity: 1, x: 0 }
      : { opacity: 1, scale: 1, y: 0 }
  const initialPanelState = reduceMotion
    ? { opacity: 0 }
    : isSlide
      ? { opacity: 0.6, x: '100%' }
      : { opacity: 0, scale: 0.95, y: 12 }
  const exitState = reduceMotion
    ? { opacity: 0 }
    : isSlide
      ? { opacity: 0.6, x: '100%' }
      : { opacity: 0, scale: 0.95, y: 12 }
  const panelState = closing ? exitState : enterState

  const panelTransition = { duration: SLOWEST_S, ease: EASE }
  const backdropTransition = { duration: SLOWEST_S / 2 }

  return createPortal(
    <>
      <motion.div
        className={css({ position: 'fixed', inset: '0', zIndex: 'popover' })}
        style={{ background: variant === 'immersive' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.4)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={backdropTransition}
        onClick={onClose}
      />
      {isSlide ? (
        <motion.div
          className={css({
            position: 'fixed',
            inset: '0',
            zIndex: 'popover',
            display: 'flex',
            flexDirection: 'column',
            background: 'canvas',
            color: 'fg.default',
            overflow: 'hidden',
          })}
          initial={initialPanelState}
          animate={panelState}
          transition={panelTransition}
          role="dialog"
          aria-modal="true"
        >
          <PanelBody variant={variant} title={title} headerAction={headerAction} onClose={onClose}>
            {children}
          </PanelBody>
        </motion.div>
      ) : (
        <motion.div
          className={css({
            position: 'fixed',
            inset: '0',
            zIndex: 'popover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={backdropTransition}
        >
          <motion.div
            className={css({
              pointerEvents: 'auto',
              width: 'min(100% - 2rem, 48rem)',
              maxHeight: 'min(100dvh - 2rem, 44rem)',
              background: 'gray.surface.bg',
              color: 'fg.default',
              borderRadius: 'l3',
              boxShadow: 'lg',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            })}
            initial={initialPanelState}
            animate={panelState}
            transition={panelTransition}
            role="dialog"
            aria-modal="true"
          >
            <PanelBody variant={variant} title={title} headerAction={headerAction} onClose={onClose}>
              {children}
            </PanelBody>
          </motion.div>
        </motion.div>
      )}
    </>,
    document.body,
  )
}

function PanelBody({
  variant,
  title,
  headerAction,
  onClose,
  children,
}: {
  variant: SlidePanelVariant
  title?: ReactNode
  headerAction?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  const showHeader = variant !== 'immersive'

  return (
    <>
      {showHeader && (
        <HStack justify="space-between" px="6" pt="5" pb="3" borderBottomWidth="1px" borderColor="border">
          <HStack gap="2">
            {variant === 'fullscreen' && (
              <CloseButton aria-label="Back" onClick={onClose}>
                <ChevronLeftIcon />
              </CloseButton>
            )}
            {title && (
              <Heading textStyle="lg" as="h2">
                {title}
              </Heading>
            )}
          </HStack>
          <HStack gap="2">
            {headerAction}
            {variant !== 'fullscreen' && <CloseButton onClick={onClose} />}
          </HStack>
        </HStack>
      )}
      <div className={css({ flex: '1', overflowY: 'auto', px: '6', py: '5' })}>{children}</div>
      {variant === 'immersive' && (
        <CloseButton
          className={css({ position: 'absolute', top: '4', right: '4', zIndex: '1' })}
          onClick={onClose}
        />
      )}
    </>
  )
}
