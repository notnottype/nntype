/**
 * MCP (Model Context Protocol) Interface for NNType
 * Provides standardized functions for external AI integration
 */

import { CanvasObjectType, ArrowObjectType, TextObjectType, CurveType, ArrowStyle } from '../types';
import { CollisionDetector, CollisionResult } from './collisionDetection';
import { TestResult, testEscArrowCompletion, testMouseCollision, runBasicTestSuite } from './testingUtils';

export interface MCPContext {
  canvasObjects: CanvasObjectType[];
  linkingState: any;
  mousePosition: { x: number; y: number };
  scale: number;
  canvasOffset: { x: number; y: number };
  theme: 'light' | 'dark';
  selectedObject: CanvasObjectType | null;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  context?: Partial<MCPContext>;
}

/**
 * MCP Interface Class - Main entry point for external AI systems
 */
export class MCPInterface {
  private context: MCPContext;
  private worldToScreen: (x: number, y: number) => { x: number; y: number };
  private screenToWorld: (x: number, y: number) => { x: number; y: number };
  private measureTextWidth?: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number;

  constructor(
    context: MCPContext,
    coordinateTransforms: {
      worldToScreen: (x: number, y: number) => { x: number; y: number };
      screenToWorld: (x: number, y: number) => { x: number; y: number };
    },
    measureTextWidth?: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number
  ) {
    this.context = context;
    this.worldToScreen = coordinateTransforms.worldToScreen;
    this.screenToWorld = coordinateTransforms.screenToWorld;
    this.measureTextWidth = measureTextWidth;
  }

  /**
   * Update the MCP context
   */
  updateContext(newContext: Partial<MCPContext>): void {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Get current canvas state
   */
  getCanvasState(): MCPResponse<MCPContext> {
    return {
      success: true,
      data: { ...this.context },
      timestamp: Date.now()
    };
  }

  /**
   * Test mouse collision at specific coordinates
   */
  testMouseCollision(screenX: number, screenY: number): MCPResponse<{
    collidingObjects: Array<{
      object: CanvasObjectType;
      collision: CollisionResult;
    }>;
    mousePosition: { x: number; y: number };
  }> {
    try {
      const collidingObjects = this.context.canvasObjects.map(obj => ({
        object: obj,
        collision: CollisionDetector.isPointInObject(
          obj,
          screenX,
          screenY,
          this.worldToScreen,
          this.measureTextWidth
        )
      })).filter(result => result.collision.isColliding);

      return {
        success: true,
        data: {
          collidingObjects,
          mousePosition: { x: screenX, y: screenY }
        },
        timestamp: Date.now(),
        context: { mousePosition: { x: screenX, y: screenY } }
      };
    } catch (error) {
      return {
        success: false,
        error: `Collision test failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Test ESC key arrow completion functionality
   */
  testEscArrowCompletion(endPoint?: { x: number; y: number }): MCPResponse<TestResult> {
    try {
      const finalEndPoint = endPoint || this.screenToWorld(
        this.context.mousePosition.x,
        this.context.mousePosition.y
      );

      const testResult = testEscArrowCompletion(
        {
          canvasObjects: this.context.canvasObjects,
          linkingState: this.context.linkingState,
          mousePosition: this.context.mousePosition,
          scale: this.context.scale,
          canvasOffset: this.context.canvasOffset
        },
        this.context.linkingState.currentPoints[0] || { x: 0, y: 0 },
        finalEndPoint
      );

      return {
        success: true,
        data: testResult,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: `ESC arrow test failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Simulate arrow creation from points
   */
  createArrowFromPoints(points: { x: number; y: number }[]): MCPResponse<ArrowObjectType> {
    try {
      if (points.length < 2) {
        return {
          success: false,
          error: 'Arrow requires at least 2 points',
          timestamp: Date.now()
        };
      }

      const newArrowId = Math.max(0, ...this.context.canvasObjects.map(obj => obj.id)) + 1;
      
      // Calculate center position
      const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      
      const newArrow: ArrowObjectType = {
        id: newArrowId,
        type: 'arrow',
        x: centerX,
        y: centerY,
        fromObjectId: null,
        toObjectId: null,
        points: points,
        controlPoints: [],
        startAttachment: undefined,
        endAttachment: undefined,
        curve: {
          type: points.length > 2 ? CurveType.BEZIER : CurveType.STRAIGHT,
          startPoint: points[0],
          endPoint: points[points.length - 1]
        },
        style: {
          color: this.context.theme === 'dark' ? '#ffffff' : '#000000',
          width: 2,
          arrowStyle: ArrowStyle.ARROW,
          opacity: 1
        }
      };

      return {
        success: true,
        data: newArrow,
        timestamp: Date.now(),
        context: {
          canvasObjects: [...this.context.canvasObjects, newArrow]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Arrow creation failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get objects near a specific point
   */
  getObjectsNearPoint(
    screenX: number,
    screenY: number,
    radius: number = 50
  ): MCPResponse<Array<{
    object: CanvasObjectType;
    distance: number;
    collision: CollisionResult;
  }>> {
    try {
      const nearbyObjects = this.context.canvasObjects.map(obj => {
        const collision = CollisionDetector.isPointInObject(
          obj,
          screenX,
          screenY,
          this.worldToScreen,
          this.measureTextWidth
        );
        
        return {
          object: obj,
          distance: collision.distance || Infinity,
          collision
        };
      }).filter(result => result.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      return {
        success: true,
        data: nearbyObjects,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: `Nearby objects search failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Run comprehensive test suite
   */
  runTestSuite(): MCPResponse<TestResult> {
    try {
      const testResult = runBasicTestSuite({
        canvasObjects: this.context.canvasObjects,
        linkingState: this.context.linkingState,
        mousePosition: this.context.mousePosition,
        scale: this.context.scale,
        canvasOffset: this.context.canvasOffset
      });

      return {
        success: true,
        data: testResult,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: `Test suite failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get canvas statistics
   */
  getCanvasStats(): MCPResponse<{
    objectCount: number;
    objectTypes: Record<string, number>;
    canvasBounds: { width: number; height: number };
    isLinkingMode: boolean;
    isDrawingArrow: boolean;
    currentPointsCount: number;
  }> {
    try {
      const objectTypes = this.context.canvasObjects.reduce((acc, obj) => {
        acc[obj.type] = (acc[obj.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stats = {
        objectCount: this.context.canvasObjects.length,
        objectTypes,
        canvasBounds: {
          width: window.innerWidth,
          height: window.innerHeight - 64
        },
        isLinkingMode: this.context.linkingState.isLinkingMode,
        isDrawingArrow: this.context.linkingState.isDrawingArrow,
        currentPointsCount: this.context.linkingState.currentPoints.length
      };

      return {
        success: true,
        data: stats,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: `Stats calculation failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Validate current linking state for ESC completion
   */
  validateEscCompletion(): MCPResponse<{
    canComplete: boolean;
    reason: string;
    currentPointsCount: number;
    mousePosition: { x: number; y: number };
    finalPoints?: { x: number; y: number }[];
  }> {
    try {
      const { linkingState, mousePosition } = this.context;
      
      if (!linkingState.isLinkingMode) {
        return {
          success: true,
          data: {
            canComplete: false,
            reason: 'Not in linking mode',
            currentPointsCount: 0,
            mousePosition
          },
          timestamp: Date.now()
        };
      }

      if (!linkingState.isDrawingArrow) {
        return {
          success: true,
          data: {
            canComplete: false,
            reason: 'Not drawing arrow',
            currentPointsCount: linkingState.currentPoints.length,
            mousePosition
          },
          timestamp: Date.now()
        };
      }

      if (linkingState.currentPoints.length === 0) {
        return {
          success: true,
          data: {
            canComplete: false,
            reason: 'No points have been added',
            currentPointsCount: 0,
            mousePosition
          },
          timestamp: Date.now()
        };
      }

      const worldMousePos = this.screenToWorld(mousePosition.x, mousePosition.y);
      const finalPoints = [...linkingState.currentPoints, worldMousePos];

      return {
        success: true,
        data: {
          canComplete: true,
          reason: 'Ready for ESC completion',
          currentPointsCount: linkingState.currentPoints.length,
          mousePosition,
          finalPoints
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: `ESC validation failed: ${error}`,
        timestamp: Date.now()
      };
    }
  }
}

/**
 * Factory function to create MCP interface
 */
export const createMCPInterface = (
  context: MCPContext,
  coordinateTransforms: {
    worldToScreen: (x: number, y: number) => { x: number; y: number };
    screenToWorld: (x: number, y: number) => { x: number; y: number };
  },
  measureTextWidth?: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number
): MCPInterface => {
  return new MCPInterface(context, coordinateTransforms, measureTextWidth);
};

/**
 * Global MCP interface for console testing (development only)
 */
declare global {
  interface Window {
    excaliTypeMCP?: MCPInterface;
  }
}
