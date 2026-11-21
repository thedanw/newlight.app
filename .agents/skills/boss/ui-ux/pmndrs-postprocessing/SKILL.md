---
name: pmndrs-postprocessing
description: "pmndrs postprocessing for three.js: EffectComposer, passes, effects (bloom, depth of field, SSAO, tone mapping, color grading), and custom shaders. Use when adding fullscreen image effects, color grading, blur, glow, or screen-space shaders to a three.js scene."
category: ui-ux
risk: safe
source: local
tags: [postprocessing, threejs, bloom, depth-of-field, ssao, tone-mapping, color-grading, effect-composer, shader-pass, fullscreen-effects]
triggers: [postprocessing, bloom, depth-of-field, ssao, tone-mapping, color-grading]
allowed-tools: Read Write Glob Grep Bash
---

# pmndrs Postprocessing for three.js

Expert skill for the [pmndrs/postprocessing](https://pmndrs.github.io/postprocessing/public/docs/) library — a post-processing library for three.js that introduces passes and effects for fullscreen image manipulation.

## Overview

Use this skill when you need to add visual effects like bloom, depth of field, SSAO, tone mapping, color grading, blur, glow, or custom screen-space shaders to a three.js scene. The library centers on `EffectComposer` which manages a chain of passes, and `EffectPass` which merges multiple effects into a single fullscreen render for performance.

## When to Use This Skill

- Adding bloom, depth of field, SSAO, vignette, or other fullscreen effects to a three.js scene
- Setting up an `EffectComposer` with `RenderPass` + effects + `OutputPass`/`ToneMappingEffect`
- Configuring output color space (sRGB vs linear/HDR) and tone mapping
- Combining multiple effects efficiently with `EffectPass` to minimize render operations
- Creating custom effects via `Effect` / `ShaderPass` with custom fragment shaders
- Working with high-precision frame buffers (`HalfFloatType`) for HDR workflows

## Workflow

### 1. Install the library

```bash
npm install three postprocessing
```

### 2. Configure the renderer

Use these WebGL attributes for optimal post-processing:

```javascript
import { WebGLRenderer, NoToneMapping, SRGBColorSpace } from "three";

const renderer = new WebGLRenderer({
  powerPreference: "high-performance",
  antialias: false,
  stencil: false,
  depth: false,
});
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = NoToneMapping; // tone mapping handled by ToneMappingEffect
```

### 3. Build the composer and pass chain

```javascript
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from "postprocessing";

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(camera, new BloomEffect()));

function animate() {
  composer.render();
  requestAnimationFrame(animate);
}
```

### 4. Pass order

Build chains in this order: `RenderPass` → linear-space effects (bloom, depth of field, SSAO, outline, ...) → `ToneMappingEffect` (last, applies tone mapping). `pass.enabled = false` skips a pass without rebuilding the chain.

### 5. Output color space & tone mapping

For linear workflow / HDR:

```javascript
import { HalfFloatType } from "three";
import { ToneMappingEffect } from "postprocessing";

const composer = new EffectComposer(renderer, {
  frameBufferType: HalfFloatType,
});
composer.addPass(new RenderPass(scene, camera));
// ... effects ...
composer.addPass(new ToneMappingEffect());
```

Set `renderer.toneMapping = NoToneMapping` so tone mapping happens once at the end of the pipeline via `ToneMappingEffect`.

### 6. Combine effects efficiently

`EffectPass` automatically organizes and merges any combination of effects into a single fullscreen render:

```javascript
import { EffectPass, BloomEffect, VignetteEffect } from "postprocessing";

composer.addPass(new EffectPass(camera, new BloomEffect(), new VignetteEffect()));
```

### 7. On resize

```javascript
composer.setSize(width, height);
```

## Examples

### Bloom + Vignette

Input: A three.js scene with emissive materials that should glow.
Output: A composer chain that renders the scene, applies bloom and vignette, and tone maps the result.

```javascript
import { EffectComposer, RenderPass, EffectPass, BloomEffect, VignetteEffect, ToneMappingEffect } from "postprocessing";

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(camera, new BloomEffect(), new VignetteEffect()));
composer.addPass(new ToneMappingEffect());
```

### Depth of Field

Input: A scene where objects at a specific depth should stay sharp while others blur.
Output: A `DepthOfFieldEffect` with focus, aperture, and maxblur configured.

```javascript
import { EffectComposer, RenderPass, EffectPass, DepthOfFieldEffect } from "postprocessing";

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(camera, new DepthOfFieldEffect({
  focus: 10.0,
  aperture: 0.025,
  maxblur: 0.01,
})));
```

## Effects Reference

The full effect catalog from [pmndrs/postprocessing](https://pmndrs.github.io/postprocessing/public/docs/identifiers.html#effects). Each entry links to its API reference page.

### Blur & Anti-Aliasing

| Effect | Purpose | Doc |
|--------|---------|-----|
| `BloomEffect` | Glow around bright areas; threshold, strength, radius, kernel size | [BloomEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/BloomEffect.js~BloomEffect.html) |
| `BlurEffect` | Generic blur base; use `BoxBlurPass`, `GaussianBlurPass`, `KawaseBlurPass` for concrete passes | [Blur](https://pmndrs.github.io/postprocessing/public/demo/#blur) |
| `BoxBlurPass` | Fast box blur pass | [BoxBlurPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/BoxBlurPass.js~BoxBlurPass.html) |
| `GaussianBlurPass` | Gaussian blur pass | [GaussianBlurPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/GaussianBlurPass.js~GaussianBlurPass.html) |
| `KawaseBlurPass` | Kawase multi-pass blur | [KawaseBlurPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/KawaseBlurPass.js~KawaseBlurPass.html) |
| `FXAAEffect` | Fast approximate anti-aliasing | [FXAAEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/FXAAEffect.js~FXAAEffect.html) |
| `SMAAEffect` | Subpixel morphological anti-aliasing (higher quality than FXAA) | [SMAAEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/SMAAEffect.js~SMAAEffect.html) |

### Depth & Focus

| Effect | Purpose | Doc |
|--------|---------|-----|
| `DepthOfFieldEffect` | Simulates camera focus; `focus`, `aperture`, `maxblur` | [DepthOfFieldEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/DepthOfFieldEffect.js~DepthOfFieldEffect.html) |
| `BokehEffect` | Bokeh blur with depth-based circle of confusion | [BokehEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/BokehEffect.js~BokehEffect.html) |
| `RealisticBokehEffect` | Physically-based bokeh | [RealisticBokehEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/RealisticBokehEffect.js~RealisticBokehEffect.html) |
| `DepthEffect` | Renders depth as a grayscale image | [DepthEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/DepthEffect.js~DepthEffect.html) |
| `SSAOEffect` | Screen-space ambient occlusion; darkens crevices | [SSAOEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/SSAOEffect.js~SSAOEffect.html) |
| `TiltShiftEffect` | Miniature/fake tilt-shift focus effect | [TiltShiftEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/TiltShiftEffect.js~TiltShiftEffect.html) |

### Color & Grading

| Effect | Purpose | Doc |
|--------|---------|-----|
| `ToneMappingEffect` | Converts HDR to LDR; goes last in the chain | [ToneMappingEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/ToneMappingEffect.js~ToneMappingEffect.html) |
| `ColorAverageEffect` | Computes average color of the scene | [ColorAverageEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/ColorAverageEffect.js~ColorAverageEffect.html) |
| `BrightnessContrastEffect` | Adjusts brightness and contrast | [BrightnessContrastEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/BrightnessContrastEffect.js~BrightnessContrastEffect.html) |
| `HueSaturationEffect` | Shifts hue and saturation | [HueSaturationEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/HueSaturationEffect.js~HueSaturationEffect.html) |
| `SepiaEffect` | Sepia tone filter | [SepiaEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/SepiaEffect.js~SepiaEffect.html) |
| `ColorDepthEffect` | Reduces color depth (posterization) | [ColorDepthEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/ColorDepthEffect.js~ColorDepthEffect.html) |
| `GammaCorrectionEffect` | Applies gamma correction | [GammaCorrectionEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/GammaCorrectionEffect.js~GammaCorrectionEffect.html) |
| `LUT1DEffect` | 1D lookup table color grading | [LUT1DEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/LUT1DEffect.js~LUT1DEffect.html) |
| `LUT3DEffect` | 3D lookup table color grading | [LUT3DEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/LUT3DEffect.js~LUT3DEffect.html) |

### Stylized & Pattern

| Effect | Purpose | Doc |
|--------|---------|-----|
| `VignetteEffect` | Darkens edges; `offset`, `darkness`, `technique` | [VignetteEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/VignetteEffect.js~VignetteEffect.html) |
| `GlitchEffect` | Digital glitch artifacts; `glitchMode`, `goWild` | [GlitchEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/GlitchEffect.js~GlitchEffect.html) |
| `ChromaticAberrationEffect` | Color fringing at edges | [ChromaticAberrationEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/ChromaticAberrationEffect.js~ChromaticAberrationEffect.html) |
| `NoiseEffect` | Film grain / noise overlay | [NoiseEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/NoiseEffect.js~NoiseEffect.html) |
| `GodRaysEffect` | Volumetric light rays / crepuscular rays | [GodRaysEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/GodRaysEffect.js~GodRaysEffect.html) |
| `DotScreenEffect` | Halftone dot pattern | [DotScreenEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/DotScreenEffect.js~DotScreenEffect.html) |
| `GridEffect` | Grid overlay | [GridEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/GridEffect.js~GridEffect.html) |
| `ScanlineEffect` | CRT scanline overlay | [ScanlineEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/ScanlineEffect.js~ScanlineEffect.html) |
| `PixelationEffect` | Pixel-art / low-res effect | [PixelationEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/PixelationEffect.js~PixelationEffect.html) |
| `ASCIIEffect` | Renders scene as ASCII characters | [ASCIIEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/ASCIIEffect.js~ASCIIEffect.html) |
| `OutlineEffect` | Outlines selected objects | [OutlineEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/OutlineEffect.js~OutlineEffect.html) |
| `ShockWaveEffect` | Radial shock wave distortion | [ShockWaveEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/ShockWaveEffect.js~ShockWaveEffect.html) |
| `LensDistortionEffect` | Barrel/pincushion lens distortion | [LensDistortionEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/LensDistortionEffect.js~LensDistortionEffect.html) |
| `TextureEffect` | Overlays a texture on the screen | [TextureEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/TextureEffect.js~TextureEffect.html) |
| `SelectiveBloomEffect` | Bloom on selected objects only | [SelectiveBloomEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/SelectiveBloomEffect.js~SelectiveBloomEffect.html) |

### Blending & Enums

| Enum | Purpose | Doc |
|------|---------|-----|
| `BlendFunction` | How an effect blends with the source (`NORMAL`, `SCREEN`, `MULTIPLY`, `ADD`, etc.) | [BlendFunction](https://pmndrs.github.io/postprocessing/public/docs/variable/index.html#static-variable-BlendFunction) |
| `ToneMappingMode` | Tone mapping algorithm (`LINEAR`, `REINHARD`, `CINEON`, `ACES_FILMIC`, etc.) | [ToneMappingMode](https://pmndrs.github.io/postprocessing/public/docs/variable/index.html#static-variable-ToneMappingMode) |
| `VignetteTechnique` | Vignette algorithm (`CLASSIC`, `MODERN`) | [VignetteTechnique](https://pmndrs.github.io/postprocessing/public/docs/variable/index.html#static-variable-VignetteTechnique) |
| `GlitchMode` | Glitch effect mode (`SLICE`, `OFFSET`, `NOISE`) | [GlitchMode](https://pmndrs.github.io/postprocessing/public/docs/variable/index.html#static-variable-GlitchMode) |
| `SMAAPreset` | SMAA quality preset (`PRESET_LOW`, `PRESET_MEDIUM`, `PRESET_HIGH`, `PRESET_ULTRA`) | [SMAAPreset](https://pmndrs.github.io/postprocessing/public/docs/variable/index.html#static-variable-SMAAPreset) |
| `KernelSize` | Blur kernel size (`SMALL`, `MEDIUM`, `LARGE`) | [KernelSize](https://pmndrs.github.io/postprocessing/public/docs/variable/index.html#static-variable-KernelSize) |

### Passes

| Pass | Purpose | Doc |
|------|---------|-----|
| `RenderPass` | Clears buffers and renders the scene; must be first | [RenderPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/RenderPass.js~RenderPass.html) |
| `EffectPass` | Merges multiple effects into one fullscreen render | [EffectPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/EffectPass.js~EffectPass.html) |
| `ShaderPass` | Wraps a custom `ShaderMaterial`; `tDiffuse` receives previous pass output | [ShaderPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/ShaderPass.js~ShaderPass.html) |
| `LambdaPass` | Runs an arbitrary callback each frame | [LambdaPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/LambdaPass.js~LambdaPass.html) |
| `CopyPass` | Copies one buffer to another | [CopyPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/CopyPass.js~CopyPass.html) |
| `ClearPass` | Clears buffers | [ClearPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/ClearPass.js~ClearPass.html) |
| `MaskPass` / `ClearMaskPass` | Stencil masking for selective effects | [MaskPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/MaskPass.js~MaskPass.html) |
| `DepthPass` | Renders depth to a buffer | [DepthPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/DepthPass.js~DepthPass.html) |
| `NormalPass` | Renders normals to a buffer | [NormalPass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/NormalPass.js~NormalPass.html) |
| `LuminancePass` | Computes luminance | [LuminancePass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/LuminancePass.js~LuminancePass.html) |
| `AdaptiveLuminancePass` | Auto-exposure / adaptive luminance | [AdaptiveLuminancePass](https://pmndrs.github.io/postprocessing/public/docs/class/src/passes/AdaptiveLuminancePass.js~AdaptiveLuminancePass.html) |

### Core & Utilities

| Class | Purpose | Doc |
|-------|---------|-----|
| `EffectComposer` | Manages and runs the pass chain | [EffectComposer](https://pmndrs.github.io/postprocessing/public/docs/class/src/core/EffectComposer.js~EffectComposer.html) |
| `Effect` | Base class for custom effects | [Effect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/Effect.js~Effect.html) |
| `Resolution` | Tracks render target resolution | [Resolution](https://pmndrs.github.io/postprocessing/public/docs/class/src/core/Resolution.js~Resolution.html) |
| `Timer` | Frame timing for time-based effects | [Timer](https://pmndrs.github.io/postprocessing/public/docs/class/src/core/Timer.js~Timer.html) |
| `getSafeSamples` | Returns a safe MSAA sample count for the device | [getSafeSamples](https://pmndrs.github.io/postprocessing/public/docs/function/index.html#static-function-getSafeSamples) |

### Loaders

| Loader | Purpose | Doc |
|--------|---------|-----|
| `LUTCubeLoader` | Loads `.cube` LUT files | [LUTCubeLoader](https://pmndrs.github.io/postprocessing/public/docs/class/src/loaders/LUTCubeLoader.js~LUTCubeLoader.html) |
| `LUT3dlLoader` | Loads `.3dl` LUT files | [LUT3dlLoader](https://pmndrs.github.io/postprocessing/public/docs/class/src/loaders/LUT3dlLoader.js~LUT3dlLoader.html) |
| `SMAAImageLoader` | Loads SMAA area/search images | [SMAAImageLoader](https://pmndrs.github.io/postprocessing/public/docs/class/src/loaders/SMAAImageLoader.js~SMAAImageLoader.html) |

### Full Docs

- [API Reference](https://pmndrs.github.io/postprocessing/public/docs/identifiers.html)
- [Demo](https://pmndrs.github.io/postprocessing/public/demo)
- [Sandbox](https://stackblitz.com/edit/postprocessing-v6)
- [Wiki (custom effects)](https://github.com/pmndrs/postprocessing/wiki)

## Key Rules

- **`EffectComposer.render()` replaces `renderer.render()`** — call `composer.render()` in your animation loop, not `renderer.render()`.
- **`RenderPass` must be first** — it clears buffers and renders the scene; effects come after.
- **`ToneMappingEffect` goes last** — it applies tone mapping to the final image.
- **Set `renderer.toneMapping = NoToneMapping`** — otherwise colors get mapped to [0,1] at the start of the pipeline.
- **Use `HalfFloatType` frame buffers for HDR** — prevents color degradation and banding in dark scenes.
- **`EffectPass` merges effects** — prefer it over chaining multiple passes for performance.
- **All fullscreen renders use a single triangle** — not a quad, which avoids unnecessary fragment calculations along the screen diagonal.
- **Call `composer.setSize()` on resize** — never resize passes by hand.
- **`pass.enabled = false` skips a pass** without rebuilding the chain.
- **Custom effects** — wrap shader logic in `Effect` / `ShaderPass`; the `tDiffuse` uniform receives the previous pass output.

## Search Terms

postprocessing, threejs, bloom, depth-of-field, effect-composer, tone-mapping