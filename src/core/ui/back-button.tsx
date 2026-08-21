import { ChevronLeftIcon } from 'lucide-react'
import { forwardRef } from 'react'
import { IconButton, type IconButtonProps } from './icon-button'

export type BackButtonProps = IconButtonProps

export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  function BackButton(props, ref) {
    return (
      <IconButton
        variant="plain"
        colorPalette="gray"
        aria-label="Back"
        boxSize="12"
        boxShadow="none"
        css={{ _icon: { boxSize: '10' } }}
        ref={ref}
        {...props}
      >
        {props.children ?? <ChevronLeftIcon />}
      </IconButton>
    )
  },
)
