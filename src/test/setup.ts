/**
 * Test setup configuration
 * Sets up DOM environment and mocks for testing
 */

import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock canvas and canvas context
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    createImageData: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    setLineDash: vi.fn(),
    canvas: {
      width: 800,
      height: 600
    }
  })),
  width: 800,
  height: 600,
  style: {},
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0
  })),
  setPointerCapture: vi.fn(),
  releasePointerCapture: vi.fn(),
  remove: vi.fn()
}

// Mock HTMLCanvasElement
global.HTMLCanvasElement = vi.fn().mockImplementation(() => mockCanvas)

// Mock document.createElement for canvas
const originalCreateElement = document.createElement
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas as any
  }
  return originalCreateElement.call(document, tagName)
})

// Mock window properties
Object.defineProperty(window, 'devicePixelRatio', {
  value: 2,
  writable: true
})

Object.defineProperty(window, 'requestAnimationFrame', {
  value: vi.fn((callback: FrameRequestCallback) => {
    return setTimeout(callback, 16)
  }),
  writable: true
})

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: vi.fn((id: number) => clearTimeout(id)),
  writable: true
})

// Mock performance
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  },
  writable: true
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })),
  writable: true
})

// Global test utilities
global.createMockPointerEvent = (overrides = {}) => ({
  pointerId: 1,
  clientX: 100,
  clientY: 200,
  button: 0,
  buttons: 1,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  pressure: 0.5,
  tiltX: 0,
  tiltY: 0,
  twist: 0,
  pointerType: 'mouse',
  isPrimary: true,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  ...overrides
})

global.createMockCanvasObject = (overrides = {}) => ({
  id: 'test-object',
  type: 'text' as const,
  x: 100,
  y: 200,
  content: 'Test content',
  fontSize: 16,
  scale: 1,
  color: '#000000',
  ...overrides
})

// Suppress console warnings in tests
const originalWarn = console.warn
console.warn = (...args: any[]) => {
  // Suppress specific warnings that are expected in tests
  if (typeof args[0] === 'string' && (
    args[0].includes('React Router') ||
    args[0].includes('deprecated') ||
    args[0].includes('Warning:')
  )) {
    return
  }
  originalWarn.apply(console, args)
}