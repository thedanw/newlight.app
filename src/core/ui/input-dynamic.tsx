import { ark } from '@ark-ui/react/factory'
import {
  forwardRef,
  type ComponentProps,
  type ReactNode,
  useState,
  createContext,
  useContext,
} from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
import { createStyleContext } from 'styled-system/jsx'
import { inputDynamic } from 'styled-system/recipes'
import { css } from 'styled-system/css'
import { IconButton } from './icon-button'
import { HStack } from 'styled-system/jsx'

const { withProvider: styledWithProvider, withContext: styledWithContext } = createStyleContext(inputDynamic)

const StyledRoot = styledWithProvider(ark.div, 'root')
const StyledTrigger = styledWithContext(ark.div, 'trigger')
const StyledHeader = styledWithContext(ark.div, 'header')
const StyledBody = styledWithContext(ark.div, 'body')

const bodyInnerCss = css({
  overflow: 'hidden',
  minHeight: 0,
})

const bodyContentCss = css({
  padding: '3',
})

interface InputDynamicState {
  open: boolean
  setOpen: (open: boolean) => void
  triggerValue: string
  setTriggerValue: (value: string) => void
}

const InputDynamicStateContext = createContext<InputDynamicState | null>(null)

const useInputDynamicState = () => {
  const ctx = useContext(InputDynamicStateContext)
  if (!ctx) {
    throw new Error('InputDynamic sub-components must be used within InputDynamic.Root')
  }
  return ctx
}

export interface RootProps extends ComponentProps<typeof ark.div> {
  defaultValue?: string
  value?: string
  defaultOpen?: boolean
  onOpen?: () => void
  onClose?: () => void
  onValueChange?: (value: string) => void
}

export const Root = forwardRef<HTMLDivElement, RootProps>(function Root(
  { defaultValue = '', value, defaultOpen = false, onOpen, onClose, onValueChange, children, ...props },
  ref,
) {
  const [open, setOpen] = useState(defaultOpen)
  const [internalValue, setInternalValue] = useState(defaultValue)

  const triggerValue = value !== undefined ? value : internalValue
  const setTriggerValue = onValueChange ?? setInternalValue

  const handleSetOpen = (next: boolean) => {
    if (next) {
      onOpen?.()
      setOpen(true)
    } else {
      onClose?.()
      setOpen(false)
    }
  }

  return (
    <InputDynamicStateContext.Provider value={{ open, setOpen: handleSetOpen, triggerValue, setTriggerValue }}>
      <StyledRoot ref={ref} data-state={open ? 'open' : 'closed'} {...props}>
        {children}
      </StyledRoot>
    </InputDynamicStateContext.Provider>
  )
})

export interface TriggerProps extends ComponentProps<typeof ark.div> {
  placeholder?: string
  disabled?: boolean
}

export const Trigger = forwardRef<HTMLDivElement, TriggerProps>(function Trigger(
  { placeholder = 'Select...', disabled, children, ...props },
  ref,
) {
  const { setOpen, triggerValue } = useInputDynamicState()

  return (
    <StyledTrigger ref={ref} {...props}>
      {children ?? (
        <input
          readOnly
          value={triggerValue}
          placeholder={placeholder}
          onClick={() => !disabled && setOpen(true)}
          onFocus={() => !disabled && setOpen(true)}
          aria-label={triggerValue || placeholder}
          disabled={disabled}
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            minWidth: '200px',
            border: 'none',
            outline: 'none',
            width: '100%',
            background: 'transparent',
            opacity: disabled ? 0.5 : 1,
          }}
        />
      )}
    </StyledTrigger>
  )
})

export interface HeaderProps extends ComponentProps<typeof ark.div> {
  label?: string
  confirmLoading?: boolean
  confirmDisabled?: boolean
  error?: string | null
  onConfirm?: () => string | void | Promise<string | void>
  onCancel?: () => void
}

export const Header = forwardRef<HTMLDivElement, HeaderProps>(function Header(
  { label, confirmLoading, confirmDisabled, error, onConfirm, onCancel, ...props },
  ref,
) {
  const { setTriggerValue, setOpen } = useInputDynamicState()

  const handleConfirm = async () => {
    const result = await onConfirm?.()
    if (typeof result === 'string') {
      setTriggerValue(result)
    }
    setOpen(false)
  }

  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  return (
    <StyledHeader ref={ref} {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: 'var(--spacing-3)' }}>
        {label && <span style={{ fontWeight: 500, color: 'var(--colors-fg-muted)' }}>{label}</span>}
        {error && <span style={{ color: 'var(--colors-error)', fontSize: 'var(--font-sizes-xs)' }}>{error}</span>}
        <div style={{ flex: 1 }} />
        <HStack gap="1">
          <IconButton
            size="sm"
            variant="outline"
            aria-label="Cancel"
            onClick={handleCancel}
            style={{ '--btn-color': 'var(--colors-error)' } as React.CSSProperties}
          >
            <XIcon size={16} style={{ color: 'var(--colors-error)' }} />
          </IconButton>
          <IconButton
            size="sm"
            aria-label="Confirm"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            loading={confirmLoading}
          >
            <CheckIcon size={16} />
          </IconButton>
        </HStack>
      </div>
    </StyledHeader>
  )
})

export type BodyProps = ComponentProps<typeof StyledBody> & { children?: ReactNode }
const Body = forwardRef<HTMLDivElement, BodyProps>(function Body({ children, ...props }, ref) {
  return (
    <StyledBody ref={ref} {...props}>
      <div className={bodyInnerCss}>
        <div className={bodyContentCss}>{children}</div>
      </div>
    </StyledBody>
  )
})

export { Body }
