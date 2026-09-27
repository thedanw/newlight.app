"use client";

import { applySemanticColors } from './semantic-colors';

// Theme loader for dynamic color loading.
// The base theme shell (src/core/theme/theme.css) is imported statically by
// main.tsx. EVERY selectable palette — accent AND gray — is compiled ahead of
// time by scripts/generate-theme-colors.mjs (`pnpm theme:colors`, wired into
// dev/build/prepare) into a standalone, self-contained CSS file in
// public/core/theme/colors/<name>.css (light + dark values scoped to its html
// data attribute). At runtime this loader fetches ONLY the files for the
// schemes currently in use and writes the matching data-* attributes:
//   data-color-scheme = <any of the 26 Park UI accents>: amber … yellow incl.
//                         neutral (monochrome accent) — see
//                         scripts/generate-theme-colors.mjs ACCENTS
//   data-gray-color   = neutral | mauve | olive | sage | sand | slate (gray scheme)
//   data-mode         = light | dark
//
// After the accent CSS is in the document and the data-* attributes are set,
// the Park UI primary (--colors-color-palette-solid-bg) is resolved and the
// semantic palette (success / warning / error / info + hover / active) is
// derived from it — see src/core/theme/semantic-colors.ts.

let loadedThemes = new Set();
let currentAccent = 'orange';
let currentGray = 'neutral';
let currentRadius = 'md';
let currentFont = 'inter';

async function loadDynamicCss(path, styleId) {
  let existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
    loadedThemes.delete(styleId);
  }

  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`Failed to load ${path}:`, response.statusText);
      return false;
    }

    const cssContent = await response.text();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cssContent;
    document.head.appendChild(style);

    loadedThemes.add(styleId);
    return true;
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    return false;
  }
}

async function loadAccentTheme(accent) {
  clearAccentStyles();
  // Every accent (default or not) has a pre-compiled theme file — see
  // scripts/generate-theme-colors.mjs.
  const success = await loadDynamicCss(`/core/theme/colors/${accent}.css`, `theme-accent-${accent}`);
  if (success) currentAccent = accent;
  return success;
}

// Only one accent scheme is active at a time — drop any previously applied
// accent styles before the new scheme is applied.
function clearAccentStyles() {
  document.querySelectorAll('style[id^="theme-accent-"]').forEach((style) => style.remove());
}

// Only one gray scheme is active at a time — drop any previously applied
// gray styles before the new scheme is applied.
function clearGrayStyles() {
  document.querySelectorAll('style[id^="theme-gray-"]').forEach((style) => style.remove());
}

async function loadGrayTheme(gray) {
  clearGrayStyles();
  // Every gray has a pre-compiled theme file — see
  // scripts/generate-theme-colors.mjs.
  const success = await loadDynamicCss(`/core/theme/colors/${gray}.css`, `theme-gray-${gray}`);
  if (success) currentGray = gray;
  return success;
}

async function loadRadiusTheme(radius) {
  const success = await loadDynamicCss('/core/theme/radius.css', `theme-radius-${radius}`);
  if (success) currentRadius = radius;
  return success;
}

async function loadFontTheme(font) {
  const success = await loadDynamicCss('/core/theme/font.css', `theme-font-${font}`);
  if (success) currentFont = font;
  return success;
}

async function loadTypographyTheme() {
  return loadDynamicCss('/core/theme/typography.css', 'theme-typography');
}

async function loadSidebarTheme(sidebarStyle) {
  const styleId = `theme-sidebar-${sidebarStyle}`;
  return loadDynamicCss('/core/theme/sidebar.css', styleId);
}

export async function initializeTheme(accentOrOptions, gray) {
  const options = typeof accentOrOptions === 'string'
    ? { accent: accentOrOptions, gray }
    : accentOrOptions;

  const {
    accent = 'orange',
    gray: grayOpt = 'neutral',
    radius = 'md',
    font = 'inter',
    sidebarStyle = 'light',
    mode = 'light',
  } = options;

  await Promise.all([
    loadAccentTheme(accent),
    loadGrayTheme(grayOpt),
    loadRadiusTheme(radius),
    loadFontTheme(font),
    loadTypographyTheme(),
    loadSidebarTheme(sidebarStyle),
  ]);

  const html = document.documentElement;
  html.setAttribute('data-color-scheme', accent);
  html.setAttribute('data-gray-color', grayOpt);
  html.setAttribute('data-mode', mode);
  html.setAttribute('data-radius', radius);
  html.setAttribute('data-font', font);
  html.setAttribute('data-sidebar-style', sidebarStyle);

  // Accent CSS + data-* attributes are both in place now, so the primary can
  // be resolved and the semantic palette derived for this accent/mode.
  applySemanticColors(accent, mode);

  console.log('Theme system initialized with:', { accent, gray: grayOpt, mode, radius, font, sidebarStyle });

  window.dispatchEvent(new CustomEvent('theme-change', { detail: { accent: accent, gray: grayOpt, colorScheme: mode } }));
}

export async function switchTheme(options = {}) {
  const {
    accent = currentAccent,
    gray = currentGray,
    radius = currentRadius,
    font = currentFont,
    sidebarStyle = 'light',
    colorScheme = 'light',
    headingStyle = '',
  } = options;

  const html = document.documentElement;
  html.setAttribute('data-mode', colorScheme);
  html.setAttribute('data-color-scheme', accent);
  html.setAttribute('data-gray-color', gray);
  html.setAttribute('data-radius', radius);
  html.setAttribute('data-font', font);
  html.setAttribute('data-sidebar-style', sidebarStyle);
  html.setAttribute('data-heading-style', headingStyle);

  await Promise.all([
    loadAccentTheme(accent),
    loadGrayTheme(gray),
    loadRadiusTheme(radius),
    loadFontTheme(font),
    loadTypographyTheme(),
    loadSidebarTheme(sidebarStyle),
  ]);

  // Accent CSS is loaded and the data-* attributes were set above, so the
  // primary can be re-resolved for the new accent/mode.
  applySemanticColors(accent, colorScheme);

  console.log('Theme switched to:', { accent, gray, radius, font, sidebarStyle, colorScheme, headingStyle });

  window.dispatchEvent(new CustomEvent('theme-change', { detail: { accent, gray, colorScheme } }));
}

export function getCurrentTheme() {
  return {
    accent: currentAccent,
    gray: currentGray,
    radius: currentRadius,
    font: currentFont,
  };
}

export function cleanupTheme() {
  const styles = document.querySelectorAll('style[id^="theme-"], link[id="theme-base"]');
  styles.forEach(style => style.remove());
  loadedThemes.clear();
  console.log('Theme system cleaned up');
}

export default {
  initializeTheme,
  switchTheme,
  getCurrentTheme,
  cleanupTheme,
};

window.ThemeLoader = {
  initializeTheme,
  switchTheme,
  getCurrentTheme,
  cleanupTheme,
};
