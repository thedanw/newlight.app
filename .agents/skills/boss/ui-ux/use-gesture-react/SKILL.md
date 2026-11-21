---
name: use-gesture-react
description: "Implement use-gesture library within React components for gesture-based interactions. Use when adding drag, scroll, pin, press, and other gesture functionality to React UI elements."
category: ui-ux
risk: safe
source: local
tags: [react, gestures, drag, scroll, pin, press, touch, mouse, wheel, interaction]
triggers: [implement, add, use, create, build, configure, setup, integrate]
allowed-tools: [Read Write Bash]
---

# Use Gesture React

## Overview

Implement the use-gesture library within React components to enable gesture-based interactions. This skill covers integration of use-gesture for common web interactions including drag, scroll, pin, press, and other gesture functionality in React applications. The library provides a comprehensive gesture system with hooks for drag, move, hover, scroll, wheel, pinch, and multi-gesture management, supporting both mouse and touch interactions with extensive configuration options and state management capabilities.

## When to Use This Skill

Use when the user wants to add gesture-based interactions to React components, such as:
- Drag and drop functionality with constraints and swipe detection
- Scroll or wheel interactions with axis control and padding
- Pinch-to-zoom or rotation gestures for multi-touch interactions
- Press and hold interactions with visual feedback
- Mouse-based gestures (move, hover, wheel)
- Touch screen interactions with proper touch-action handling
- Complex gesture combinations (drag + press, pinch + move)
- Custom gesture implementations using the base `useGesture` hook
- Interactive UI elements that require smooth animations and state synchronization
- Data visualization components with pan/zoom capabilities
- Interactive dashboards and data exploration tools

## Workflow / Process

1. **Research and Setup**
   - Install use-gesture library via npm/yarn (`@use-gesture/react`)
   - Configure React environment for gesture hooks
   - Set up basic gesture state management with useState or React Spring
   - Install optional dependencies like `@react-spring/web` for smooth animations

2. **Implement Core Gestures**
   - Add drag gesture with constraints and boundaries using `useDrag` hook
   - Configure scroll/wheel gesture handlers with axis control using `useScroll`/`useWheel`
   - Implement press gesture with visual feedback using `usePress`
   - Set up touch and mouse event handling with proper touch-action CSS
   - Configure gesture options (thresholds, filters, bounds, swipe detection)

3. **Enhance with Advanced Features**
   - Add gesture combinations using `useGesture` hook for multiple gestures
   - Implement gesture constraints and limits with bounds and rubberband effects
   - Add gesture visualization and debugging with state logging
   - Configure gesture options (delay, filterTaps, target, wheelPadding)
   - Implement gesture cancellation and cleanup in useEffect

4. **Integrate with React State**
   - Connect gestures to component state using useState or React Spring
   - Add gesture-based animations with smooth transitions
   - Implement gesture cancellation and cleanup to prevent memory leaks
   - Handle gesture event propagation and prevent default behaviors
   - Add visual feedback for gesture states (pressed, dragged, etc.)

5. **Optimize and Debug**
   - Use React Spring integration for better performance
   - Implement proper cleanup in useEffect hooks
   - Test across different devices (mouse, touch, pen)
   - Add gesture thresholds to avoid accidental triggers
   - Implement rubberband effects for natural scrolling feel

## Examples

### Example 1: Basic Drag Gesture
```jsx
import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-use-gesture';

const DraggableBox = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const bind = useDrag(({ delta: [dx, dy], down }) => {
    if (down) {
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
    }
  }, {
    bounds: { left: 0, right: 400, top: 0, bottom: 300 }
  });
  
  return (
    <div {...bind()} style={{ 
      position: 'absolute', 
      left: position.x, 
      top: position.y,
      width: '100px',
      height: '100px',
      background: '#3b82f6',
      borderRadius: '8px',
      cursor: 'grab'
    }}>
      Drag me!
    </div>
  );
};
```

### Example 2: Scroll Gesture with Constraints
```jsx
import React, { useState } from 'react';
import { useScroll } from 'react-use-gesture';

const ConstrainedScroll = () => {
  const [scrollY, setScrollY] = useState(0);
  
  const bind = useScroll(({ delta: [dx, dy], scrolling }) => {
    if (scrolling) {
      setScrollY(prev => Math.max(0, Math.min(100, prev + dy)));
    }
  }, {
    axis: 'y',
    wheelPadding: { top: 10, bottom: 10 }
  });
  
  return (
    <div {...bind()} style={{ 
      height: '200px', 
      overflow: 'auto',
      border: '1px solid #ddd',
      borderRadius: '8px'
    }}>
      <div style={{ 
        height: '300px', 
        background: `linear-gradient(to bottom, transparent, ${scrollY}%)`,
        padding: '20px'
      }}>
        Scroll content here
      </div>
    </div>
  );
};
```

### Example 3: React Spring Integration (Recommended)
```jsx
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from 'react-use-gesture';

const DraggableWithSpring = () => {
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));
  
  const bind = useDrag(({ offset: [x, y] }) => {
    api.start({ x, y });
  });
  
  return (
    <animated.div {...bind()} style={{ 
      x, y,
      width: '150px',
      height: '150px',
      background: '#10b981',
      borderRadius: '8px',
      cursor: 'grab',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold'
    }}>
      Smooth Drag!
    </animated.div>
  );
};
```

## Key Rules

- **Clean up gesture listeners** in useEffect to prevent memory leaks and performance issues
- **Use gesture thresholds** to avoid accidental triggers (delay: true for 180ms default)
- **Combine multiple gestures carefully** using useGesture hook to avoid conflicts
- **Test gestures across different devices** (mouse, touch, pen) for consistent behavior
- **Consider accessibility** when implementing gesture interactions (keyboard navigation, screen readers)
- **Use gesture state management libraries** like React Spring instead of useState for smooth animations
- **Implement gesture constraints** to keep elements within bounds and prevent out-of-bounds behavior
- **Add visual feedback** for gesture states (pressed, dragged, etc.) with cursor and opacity changes
- **Set touch-action: none** on draggable elements to prevent scroll conflicts
- **Use the target option** when needing to prevent default on Safari trackpad
- **Handle memoization** by returning values from gesture handlers to prevent unnecessary re-renders
- **Debounce wheel/scroll events** using built-in debouncing to prevent performance issues
- **Use cancel() function** for drag/pinch gestures to abort mid-gesture when needed
- **Implement rubberband effects** with rubberbandIfOutOfBounds for natural scrolling feel
- **Add proper CSS styling** for cross-browser compatibility (touch-action, user-select, etc.)

## Search Terms

- react gesture library
- use-gesture implementation
- react drag interaction
- react scroll gesture
- react press gesture
- gesture hooks react
- touch gesture react
- mouse gesture react
- drag and drop react
- gesture-based interactions
- react-use-gesture
- use-gesture-react
- gesture state management
- react spring integration
- touch-action none
- gesture constraints
- gesture thresholds
- rubberband effect
- cross-device gestures
- gesture cleanup
- gesture debouncing
- gesture cancellation
- gesture combinations
- gesture visualization
- gesture debugging
- gesture accessibility
- gesture performance
- gesture optimization