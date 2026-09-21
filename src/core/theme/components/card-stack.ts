import { Stack } from '../jsx/stack.mjs';
import { css } from '../css/index.mjs';

export const CardStack = (props) => {
  const { gap = 'var(--spacing-gap, 8px)', ...rest } = props;
  return Stack({ gap, ...rest });
};

export const cardStack = (styles) => css({ display: 'flex', flexDirection: 'column', gap: styles?.gap || 'var(--spacing-gap, 8px)', ...styles });
