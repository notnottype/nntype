/**
 * Optimized React components with React.memo for performance
 * Prevents unnecessary re-renders of child components
 */

import React, { memo } from 'react';
import { CanvasObject, TextObject, GuideObject, Theme } from '../types';

/**
 * Custom comparison function for React.memo
 * Returns true if props are equal (skip re-render)
 */
const arePropsEqual = (prevProps: any, nextProps: any): boolean => {
  // Check primitive values
  const primitiveKeys = Object.keys(prevProps).filter(key => 
    typeof prevProps[key] !== 'object' && typeof prevProps[key] !== 'function'
  );
  
  for (const key of primitiveKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  
  // Check arrays by length and reference
  const arrayKeys = Object.keys(prevProps).filter(key => 
    Array.isArray(prevProps[key])
  );
  
  for (const key of arrayKeys) {
    if (prevProps[key].length !== nextProps[key].length) {
      return false;
    }
    // For small arrays, do deep comparison
    if (prevProps[key].length < 10) {
      for (let i = 0; i < prevProps[key].length; i++) {
        if (prevProps[key][i] !== nextProps[key][i]) {
          return false;
        }
      }
    }
  }
  
  // Check objects by reference (shallow)
  const objectKeys = Object.keys(prevProps).filter(key => 
    typeof prevProps[key] === 'object' && 
    !Array.isArray(prevProps[key]) && 
    prevProps[key] !== null
  );
  
  for (const key of objectKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  
  // Functions are checked by reference
  const functionKeys = Object.keys(prevProps).filter(key => 
    typeof prevProps[key] === 'function'
  );
  
  for (const key of functionKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  
  return true;
};

/**
 * Optimized header component
 */
interface OptimizedHeaderProps {
  theme: Theme;
  onThemeToggle: () => void;
  onExport: (format: string) => void;
  onImport: () => void;
  showGrid: boolean;
  onGridToggle: () => void;
  showInfo: boolean;
  onInfoToggle: () => void;
}

export const OptimizedHeader = memo<OptimizedHeaderProps>(({
  theme,
  onThemeToggle,
  onExport,
  onImport,
  showGrid,
  onGridToggle,
  showInfo,
  onInfoToggle
}) => {
  return (
    <div className="header">
      {/* Header content */}
    </div>
  );
}, arePropsEqual);

OptimizedHeader.displayName = 'OptimizedHeader';

/**
 * Optimized canvas object renderer
 */
interface OptimizedCanvasObjectProps {
  object: CanvasObject;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  theme: Theme;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export const OptimizedCanvasObject = memo<OptimizedCanvasObjectProps>(({
  object,
  isSelected,
  isHovered,
  scale,
  theme,
  onSelect,
  onHover
}) => {
  return (
    <div className="canvas-object">
      {/* Object rendering */}
    </div>
  );
}, (prev, next) => {
  // Custom comparison for canvas objects
  return (
    prev.object.id === next.object.id &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered &&
    prev.scale === next.scale &&
    prev.theme === next.theme &&
    // Check if object content changed
    JSON.stringify(prev.object) === JSON.stringify(next.object)
  );
});

OptimizedCanvasObject.displayName = 'OptimizedCanvasObject';

/**
 * Optimized toolbar component
 */
interface OptimizedToolbarProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

export const OptimizedToolbar = memo<OptimizedToolbarProps>(({
  currentMode,
  onModeChange,
  scale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  fontSize,
  onFontSizeChange
}) => {
  return (
    <div className="toolbar">
      {/* Toolbar content */}
    </div>
  );
}, arePropsEqual);

OptimizedToolbar.displayName = 'OptimizedToolbar';

/**
 * Optimized info panel component
 */
interface OptimizedInfoPanelProps {
  objectCount: number;
  selectedCount: number;
  scale: number;
  canvasOffset: { x: number; y: number };
  mousePosition: { x: number; y: number };
  performance?: {
    fps: number;
    renderTime: number;
    memoryUsage: number;
  };
}

export const OptimizedInfoPanel = memo<OptimizedInfoPanelProps>(({
  objectCount,
  selectedCount,
  scale,
  canvasOffset,
  mousePosition,
  performance
}) => {
  return (
    <div className="info-panel">
      <div>Objects: {objectCount}</div>
      <div>Selected: {selectedCount}</div>
      <div>Scale: {(scale * 100).toFixed(0)}%</div>
      <div>Canvas: ({canvasOffset.x.toFixed(0)}, {canvasOffset.y.toFixed(0)})</div>
      <div>Mouse: ({mousePosition.x.toFixed(0)}, {mousePosition.y.toFixed(0)})</div>
      {performance && (
        <>
          <div>FPS: {performance.fps}</div>
          <div>Render: {performance.renderTime.toFixed(2)}ms</div>
          <div>Memory: {performance.memoryUsage.toFixed(2)}MB</div>
        </>
      )}
    </div>
  );
}, (prev, next) => {
  // Custom comparison for info panel
  return (
    prev.objectCount === next.objectCount &&
    prev.selectedCount === next.selectedCount &&
    Math.abs(prev.scale - next.scale) < 0.01 &&
    Math.abs(prev.canvasOffset.x - next.canvasOffset.x) < 1 &&
    Math.abs(prev.canvasOffset.y - next.canvasOffset.y) < 1 &&
    Math.abs(prev.mousePosition.x - next.mousePosition.x) < 1 &&
    Math.abs(prev.mousePosition.y - next.mousePosition.y) < 1 &&
    JSON.stringify(prev.performance) === JSON.stringify(next.performance)
  );
});

OptimizedInfoPanel.displayName = 'OptimizedInfoPanel';

/**
 * Optimized text input component
 */
interface OptimizedTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isComposing: boolean;
  placeholder?: string;
  maxLength?: number;
  fontSize: number;
  fontFamily: string;
}

export const OptimizedTextInput = memo<OptimizedTextInputProps>(({
  value,
  onChange,
  onSubmit,
  onCancel,
  isComposing,
  placeholder,
  maxLength,
  fontSize,
  fontFamily
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
          e.preventDefault();
          onSubmit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily
      }}
      className="text-input"
    />
  );
}, (prev, next) => {
  return (
    prev.value === next.value &&
    prev.isComposing === next.isComposing &&
    prev.placeholder === next.placeholder &&
    prev.maxLength === next.maxLength &&
    prev.fontSize === next.fontSize &&
    prev.fontFamily === next.fontFamily
  );
});

OptimizedTextInput.displayName = 'OptimizedTextInput';

/**
 * Optimized shortcut panel component
 */
interface OptimizedShortcutPanelProps {
  shortcuts: Array<{
    key: string;
    description: string;
    category: string;
  }>;
  isVisible: boolean;
  onClose: () => void;
}

export const OptimizedShortcutPanel = memo<OptimizedShortcutPanelProps>(({
  shortcuts,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;
  
  return (
    <div className="shortcut-panel">
      <button onClick={onClose}>Close</button>
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="shortcut-item">
          <span className="shortcut-key">{shortcut.key}</span>
          <span className="shortcut-description">{shortcut.description}</span>
        </div>
      ))}
    </div>
  );
}, (prev, next) => {
  return (
    prev.isVisible === next.isVisible &&
    JSON.stringify(prev.shortcuts) === JSON.stringify(next.shortcuts)
  );
});

OptimizedShortcutPanel.displayName = 'OptimizedShortcutPanel';

/**
 * Optimized export menu component
 */
interface OptimizedExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'png' | 'svg' | 'json') => void;
  exportOptions: {
    includeBg: boolean;
    scale: number;
    quality: number;
  };
  onOptionsChange: (options: any) => void;
}

export const OptimizedExportMenu = memo<OptimizedExportMenuProps>(({
  isOpen,
  onClose,
  onExport,
  exportOptions,
  onOptionsChange
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="export-menu">
      <button onClick={() => onExport('png')}>Export as PNG</button>
      <button onClick={() => onExport('svg')}>Export as SVG</button>
      <button onClick={() => onExport('json')}>Export as JSON</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}, arePropsEqual);

OptimizedExportMenu.displayName = 'OptimizedExportMenu';

/**
 * Higher-order component for adding performance tracking
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return memo((props: P) => {
    // Track render count in development
    if (import.meta.env.MODE === 'development') {
      const renderCount = React.useRef(0);
      React.useEffect(() => {
        renderCount.current++;
        console.log(`${componentName} rendered ${renderCount.current} times`);
      });
    }
    
    return <Component {...props} />;
  });
}

/**
 * Utility function to create optimized component
 */
export function createOptimizedComponent<P extends object>(
  Component: React.FC<P>,
  displayName: string,
  customComparison?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = memo(Component, customComparison || arePropsEqual);
  MemoizedComponent.displayName = displayName;
  return MemoizedComponent;
}
