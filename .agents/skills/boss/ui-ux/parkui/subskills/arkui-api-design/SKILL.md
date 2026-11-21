---
name: arkui-api-design
description: "Design, review, and maintain ParkUI component UI APIs (ArkUI). Use when designing/modifying ParkUI component properties, writing JSDOC, syncing static/dynamic APIs, or applying OpenHarmony API design standards. Part of the ParkUI skill. Covers OpenHarmony API design standards."
version: 2.0.0
---

# ArkUI API Design Skill (ParkUI Subskill)

> **Context:** This skill is a subskill of **parkui**. It covers **Layer 1** of the ParkUI architecture: the ArkUI (UI Logic) layer. When designing ParkUI components, delegate to this skill for API design work, then coordinate with the `panda-css` subskill for styling.

This skill provides comprehensive guidance for designing, reviewing, and maintaining ArkUI component APIs that follow OpenHarmony Application TypeScript/JavaScript coding guidelines.

## Core Design Principles

### 1. Follow OpenHarmony Coding Standards

All API definitions and code examples must comply with the *OpenHarmony Application TypeScript/JavaScript Coding Guide*. Key standards include:

- **Naming conventions**: Use camelCase for properties and methods, PascalCase for types/interfaces
- **Type safety**: Provide proper TypeScript type definitions for all parameters
- **Code style**: Follow 4-space indentation, consistent formatting
- **Documentation**: Comprehensive JSDOC comments for all public APIs

For detailed standards, refer to: **`references/OpenHarmony-Application-Typescript-JavaScript-coding-guide.md`**

### 2. Synchronize Static and Dynamic Interfaces

**CRITICAL**: When adding or modifying component properties, you must update **both** static and dynamic interface files:

#### Static API (`.static.d.ets`)
- **Location**: `OpenHarmony/interface/sdk-js/api/arkui/component/<component>.static.d.ets`
- **Purpose**: Declarative UI API for ArkTS static type system
- **Usage**: Component declaration in `@Builder` functions
- **JSDOC Tags**: Add `@static` after `@since [version]` (e.g., `@since 26 static`)
- **Example**:
```typescript
// File: text.static.d.ets
/**
 * Provides a text component.

 */
width(value: number | string | Length | undefined): CommonMethod;
```

### Forgetting Resource Type

```typescript
// ⚠️ Less optimal: Only accepts number/string
fontSize(value: number | string): TextAttribute;

// ✅ Better: Supports resource theming
fontSize(value: number | string | Length | Resource): TextAttribute;
```

---

## Additional Resources

### Coding Standards

- **`references/OpenHarmony-Application-Typescript-JavaScript-coding-guide.md`**
  - OpenHarmony TypeScript/JavaScript Coding Guide (official complete version)
  - Contains naming conventions, type definitions, code formatting, and all coding standards
  - All design principles in this skill are based on this document

### Example Code

- **`examples/interface-definition.ts`** - Complete interface definition example
- **`examples/modifier-implementation.ts`** - Modifier method implementation example
- **`examples/deprecation-pattern.ts`** - API deprecation with migration example
- **`examples/static-dynamic-sync.ts`** - Static/Dynamic API synchronization example

### Knowledge Base References

- **`docs/sdk/Component_API_Knowledge_Base_CN.md`** - ArkUI 组件 API 知识库
  - Explains difference between static and dynamic APIs
  - File structure and organization
  - Component API classification

- **`docs/sdk/ArkUI_SDK_API_Knowledge_Base.md`** - ArkUI SDK API 结构化分析文档
  - SDK API vs ace_engine implementation mapping
  - Static API vs Dynamic API comparison
  - FrameNode/BuilderNode/Modifier patterns

---

## Quick Reference

### Essential JSDOC Tags

```typescript
/**
 * Brief description.
 * @param paramName Description including undefined/null behavior and constraints.
 * @unit vp | fp | px (for length values)
 * @throws {ErrorType} Description (when errors can occur)
 * @since version static (for Static API - use "static" after version)
 * @since version dynamic (for Dynamic API - use "dynamic" after version)
 * @syscap SystemCapability.ArkUI.ArkUI.Full (system capability)
 * @stagemodelonly (indicates this is a stage model only API)
 * @deprecated Use alternativeMethod() instead (for deprecated APIs)
 * @obsoleted version (when API was removed)
 */
```

**Important Tag Rules:**
- **Static API (`.static.d.ets`)**: Use `@since X static` format (e.g., `@since 26 static`)
- **Dynamic API (`*Modifier.d.ts`)**: Use `@since X dynamic` format (e.g., `@since 26 dynamic`)
- **All APIs**: Add `@stagemodelonly` tag to indicate stage model only

### Type Support Decision Tree

```
Does the parameter accept length values?
├─ Yes → Add Length and Resource types
└─ No → Is it theme-able (color, size, string)?
    ├─ Yes → Add Resource type
    └─ No → Use basic types (number | string | undefined | null)
```

### Default Value Documentation

```typescript
// Document defaults in JSDOC:
"If undefined, restores to default [value] ([unit])."
"If null, removes setting and uses inherited value."
```

### Static vs Dynamic API Quick Reference

| Aspect | Static API (`.static.d.ets`) | Dynamic API (`*.d.ts`) |
|--------|----------------------------|-------------------------------|
| **File Location** | `arkui/component/` | `@internal/component/ets/` |
| **Usage** | `Text({ content: 'Hello' })` | `Text().content('Hello')` |
| **Type** | Class declaration | Class extending CommonMethod |
| **Pattern** | Constructor-based | Method chaining |
| **Return Type** | N/A (properties) | Concrete Attribute type |
| **Version Tag** | `@since X static` | `@since X dynamic` |
| **Both Required** | ✅ Yes | ✅ Yes |

### Static/Dynamic Synchronization Checklist

Before finalizing any API, verify:

#### Files Updated
- [ ] Static file: `interface/sdk-js/api/arkui/component/*.static.d.ets`
- [ ] Dynamic file: `interface/sdk-js/api/@internal/component/ets/*.d.ts`

#### Signatures Match
- [ ] Parameter types identical
- [ ] Optional parameters consistent
- [ ] Generic types aligned

#### JSDOC Complete
- [ ] @param descriptions match
- [ ] @returns descriptions match (dynamic only)
- [ ] Version tags: `@since XX static` vs `@since XX dynamic`
- [ ] @syscap tags identical
- [ ] @unit tags consistent

#### Return Type Convention
- [ ] Static: Properties (no return type for properties)
- [ ] Dynamic: Concrete type (e.g., `ButtonAttribute`)

#### Version Tags
- [ ] Static: `@since 26 static`
- [ ] Dynamic: `@since 26 dynamic`

#### Compilation Verified
- [ ] Static file compiles
- [ ] Dynamic file compiles
- [ ] No type errors
- [ ] No JSDOC warnings

---

## Common Mistakes to Avoid

### 1. Only Updating One File

❌ **Bad**: Only static file updated
```typescript
// Static: richEditor.static.d.ets
default lineSpacing(value: LengthMetrics | undefined): this;

// Dynamic: rich_editor.d.ts
// Method is missing! ✗
```

✅ **Good**: Both files updated
```typescript
// Static: richEditor.static.d.ets
default lineSpacing(value: LengthMetrics | undefined, options?: LineSpacingOptions): this;

// Dynamic: rich_editor.d.ts
lineSpacing(value: LengthMetrics | undefined, options?: LineSpacingOptions): RichEditorAttribute;
```

### 2. Inconsistent Parameter Types

❌ **Bad**: Different parameter types
```typescript
// Static:
default lineSpacing(value: LengthMetrics): this;

// Dynamic:
lineSpacing(value: LengthMetrics | undefined): RichEditorAttribute;
// ✗ Parameter types don't match!
```

✅ **Good**: Identical parameter types
```typescript
// Static:
default lineSpacing(value: LengthMetrics | undefined, options?: LineSpacingOptions): this;

// Dynamic:
lineSpacing(value: LengthMetrics | undefined, options?: LineSpacingOptions): RichEditorAttribute;
// ✓ Parameters match perfectly
```

### 3. Missing Version Tags

❌ **Bad**: Generic version tags
```typescript
// Static: @since 26
// Dynamic: @since 26
// ✗ Missing static/dynamic specification
```

✅ **Good**: Proper version tags
```typescript
// Static: @since 26 static
// Dynamic: @since 26 dynamic
// ✓ Clear distinction
```

### 4. Wrong File Location

❌ **Bad**: Looking for dynamic API in wrong location
```typescript
// Looking in: arkui/ButtonModifier.d.ts
// This file only defines Modifier class, not Attribute interface!
```

✅ **Good**: Correct file location
```typescript
// Dynamic API is in: @internal/component/ets/button.d.ts
// This file defines ButtonAttribute class with all methods
```


---

> **Note:** This skill is a subskill of **parkui**. It handles Layer 1 (UI Logic) of the ParkUI architecture. Coordinate with the panda-css subskill for Layer 2 (Styling) work.
