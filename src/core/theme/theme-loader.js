"use client";

// Theme loader for dynamic color loading.
// The base theme shell (src/core/theme/theme.css) is imported statically by
// main.tsx. The loader applies the selected color scheme and writes the
// matching data-* attributes on <html>:
//   data-color-scheme = orange | green | violet | mint (accent scheme)
//   data-gray-color   = neutral (gray scheme)
//   data-mode         = light | dark
// Only the default colors (orange + neutral) are baked into the bundle by
// Panda; their scheme CSS (public/core/theme/colors/*.css) is a pure remap of
// the base vars to the emitted raw vars. The other accent schemes (green,
// violet, mint) are NOT in the bundle — the loader dynamically imports their
// Park UI TS packages from src/core/theme/colors and generates the palette
// vars from the package values at runtime (no hex is hard-coded here).

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
  if (accent === 'orange') {
    // Base color: the orange raw vars are in the bundle, so the scheme CSS is
    // a pure remap of the base palette vars to those emitted raw vars.
    const success = await loadDynamicCss(`/core/theme/colors/${accent}.css`, `theme-accent-${accent}`);
    if (success) currentAccent = accent;
    return success;
  }
  // Dynamic color: not in the bundle — import its Park UI TS package and
  // generate the palette vars from the package values at runtime.
  const success = await loadDynamicAccent(accent);
  if (success) currentAccent = accent;
  return success;
}

// Only one accent scheme is active at a time — drop any previously applied
// accent styles (orange remap CSS or a generated dynamic color) before the
// new scheme is applied.
function clearAccentStyles() {
  document.querySelectorAll('style[id^="theme-accent-"]').forEach((style) => style.remove());
}

// Resolve a Park UI semantic-token value to a { light, dark } pair:
//   '{colors.green.9}' -> the package's own '9' scale entry
//   'white' / hex      -> literal (same for both modes)
function resolveTokenValue(pkg, value) {
  if (value !== null && typeof value === 'object') {
    return { light: value._light, dark: value._dark };
  }
  const ref = /^\{colors\.([^.]+)\.(.+)\}$/.exec(String(value));
  if (ref) {
    const leaf = pkg[ref[2]];
    if (leaf && leaf.value) {
      const v = leaf.value;
      return { light: v._light, dark: v._dark };
    }
  }
  return { light: value, dark: value };
}

// Walk a Park UI color package and collect `--colors-color-palette-*` custom
// property assignments for light and dark mode. DEFAULT slots are omitted from
// the var name, mirroring Panda's emission (e.g. solid.bg.DEFAULT ->
// --colors-color-palette-solid-bg).
function collectColorVars(pkg, node, segments, light, dark) {
  for (const [key, child] of Object.entries(node)) {
    if (!child || typeof child !== 'object') continue;
    if ('value' in child) {
      const path = [...segments, ...(key === 'DEFAULT' ? [] : [key])];
      const name = `--colors-color-palette-${path.join('-')}`;
      const { light: l, dark: d } = resolveTokenValue(pkg, child.value);
      light.push(`${name}:${l};`);
      dark.push(`${name}:${d};`);
    } else {
      collectColorVars(pkg, child, [...segments, ...(key === 'DEFAULT' ? [] : [key])], light, dark);
    }
  }
}

// Build the CSS that re-maps the base palette vars to a dynamic color package.
function generateAccentCss(pkg) {
  const light = [];
  const dark = [];
  collectColorVars(pkg, pkg, [], light, dark);
  return `:root{${light.join('')}}[data-mode='dark']{${dark.join('')}}`;
}

// Dynamically import a Park UI color package (code-split by Vite/Rollup, so
// green/violet/mint only load when the user selects them).
async function loadColorPackage(accent) {
  switch (accent) {
    case 'green': return (await import('./colors/green')).green;
    case 'violet': return (await import('./colors/violet')).violet;
    case 'mint': return (await import('./colors/mint')).mint;
    default: return null;
  }
}

async function loadDynamicAccent(accent) {
  try {
    const pkg = await loadColorPackage(accent);
    if (!pkg) return false;
    const css = generateAccentCss(pkg);
    const style = document.createElement('style');
    style.id = `theme-accent-${accent}`;
    style.textContent = css;
    document.head.appendChild(style);
    loadedThemes.add(`theme-accent-${accent}`);
    return true;
  } catch (error) {
    console.error(`Error loading dynamic color ${accent}:`, error);
    return false;
  }
}

async function loadGrayTheme(gray) {
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

  console.log('Theme system initialized with:', { accent, gray: grayOpt, mode, radius, font, sidebarStyle });
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

  console.log('Theme switched to:', { accent, gray, radius, font, sidebarStyle, colorScheme, headingStyle });
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
