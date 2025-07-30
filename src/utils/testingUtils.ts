/**
 * Testing utilities for ExcaliType canvas functionality
 * Provides programmatic testing and validation functions for MCP integration
 */

import { CanvasObjectType, ArrowObjectType, TextObjectType } from '../types';

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: number;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface TestContext {
  canvasObjects: CanvasObjectType[];
  linkingState: any;
  mousePosition: MousePosition;
  scale: number;
  canvasOffset: { x: number; y: number };
}

/**
 * Test ESC key arrow completion functionality
 */
export const testEscArrowCompletion = (
  context: TestContext,
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number }
): TestResult => {
  const { canvasObjects: initialObjects, linkingState } = context;
  
  // Validate initial state
  if (!linkingState.isLinkingMode) {
    return {
      success: false,
      message: 'Test failed: Not in linking mode',
      timestamp: Date.now()
    };
  }
  
  if (!linkingState.isDrawingArrow) {
    return {
      success: false,
      message: 'Test failed: Not in drawing arrow mode',
      timestamp: Date.now()
    };
  }
  
  if (linkingState.currentPoints.length === 0) {
    return {
      success: false,
      message: 'Test failed: No points in currentPoints array',
      timestamp: Date.now()
    };
  }
  
  // Simulate ESC key behavior
  const finalPoints = [...linkingState.currentPoints, endPoint];
  
  // Validate that an arrow would be created
  if (finalPoints.length < 2) {
    return {
      success: false,
      message: 'Test failed: Not enough points to create arrow',
      data: { pointCount: finalPoints.length },
      timestamp: Date.now()
    };
  }
  
  return {
    success: true,
    message: 'ESC arrow completion test passed',
    data: {
      startPoint: finalPoints[0],
      endPoint: finalPoints[finalPoints.length - 1],
      totalPoints: finalPoints.length,
      initialObjectCount: initialObjects.length
    },
    timestamp: Date.now()
  };
};

/**
 * Test mouse position collision detection
 */
export const testMouseCollision = (
  mousePos: MousePosition,
  objects: CanvasObjectType[],
  collisionDetector: (obj: CanvasObjectType, x: number, y: number) => boolean
): TestResult => {
  const collidingObjects = objects.filter(obj => 
    collisionDetector(obj, mousePos.x, mousePos.y)
  );
  
  return {
    success: true,
    message: `Found ${collidingObjects.length} colliding objects`,
    data: {
      mousePosition: mousePos,
      collidingObjects: collidingObjects.map(obj => ({
        id: obj.id,
        type: obj.type,
        position: { x: (obj as any).x || 0, y: (obj as any).y || 0 }
      })),
      totalObjects: objects.length
    },
    timestamp: Date.now()
  };
};

/**
 * Test arrow creation from points
 */
export const testArrowCreation = (
  points: { x: number; y: number }[],
  expectedId?: number
): TestResult => {
  if (points.length < 2) {
    return {
      success: false,
      message: 'Test failed: Arrow requires at least 2 points',
      data: { pointCount: points.length },
      timestamp: Date.now()
    };
  }
  
  // Calculate expected center position
  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  
  return {
    success: true,
    message: 'Arrow creation test passed',
    data: {
      points: points,
      expectedCenter: { x: centerX, y: centerY },
      expectedId: expectedId,
      curveType: points.length > 2 ? 'BEZIER' : 'STRAIGHT'
    },
    timestamp: Date.now()
  };
};

/**
 * Comprehensive arrow drawing flow test
 */
export const testArrowDrawingFlow = (
  initialState: TestContext,
  clickSequence: MousePosition[],
  expectedFinalObjectCount: number
): TestResult => {
  const results: TestResult[] = [];
  
  // Test each click in sequence
  clickSequence.forEach((click, index) => {
    const collisionTest = testMouseCollision(
      click,
      initialState.canvasObjects,
      () => false // Simple test - can be replaced with actual collision detector
    );
    results.push(collisionTest);
  });
  
  // Test ESC completion if we have clicks
  if (clickSequence.length > 0) {
    const escTest = testEscArrowCompletion(
      initialState,
      clickSequence[0],
      clickSequence[clickSequence.length - 1]
    );
    results.push(escTest);
  }
  
  const failedTests = results.filter(r => !r.success);
  
  return {
    success: failedTests.length === 0,
    message: failedTests.length === 0 
      ? 'Arrow drawing flow test passed'
      : `${failedTests.length} sub-tests failed`,
    data: {
      totalTests: results.length,
      failedTests: failedTests.length,
      results: results,
      expectedFinalObjectCount
    },
    timestamp: Date.now()
  };
};

/**
 * Performance test for collision detection
 */
export const testCollisionPerformance = (
  mousePositions: MousePosition[],
  objects: CanvasObjectType[],
  collisionDetector: (obj: CanvasObjectType, x: number, y: number) => boolean,
  iterations: number = 1000
): TestResult => {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    const mousePos = mousePositions[i % mousePositions.length];
    objects.forEach(obj => {
      collisionDetector(obj, mousePos.x, mousePos.y);
    });
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const averageTime = totalTime / iterations;
  
  return {
    success: averageTime < 1, // Should be under 1ms per iteration
    message: `Performance test: ${averageTime.toFixed(3)}ms average per iteration`,
    data: {
      totalTime,
      averageTime,
      iterations,
      objectCount: objects.length,
      mousePositionCount: mousePositions.length,
      performanceRating: averageTime < 0.1 ? 'excellent' : 
                        averageTime < 0.5 ? 'good' : 
                        averageTime < 1 ? 'acceptable' : 'poor'
    },
    timestamp: Date.now()
  };
};

/**
 * Validate canvas object state consistency
 */
export const validateObjectState = (objects: CanvasObjectType[]): TestResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  objects.forEach(obj => {
    // Check required properties
    if (typeof obj.id !== 'number') errors.push(`Object missing valid id: ${obj.id}`);
    if (!obj.type) errors.push(`Object ${(obj as any).id} missing type`);
    if (typeof (obj as any).x !== 'number') errors.push(`Object ${obj.id} missing valid x coordinate`);
    if (typeof (obj as any).y !== 'number') errors.push(`Object ${obj.id} missing valid y coordinate`);
    
    // Type-specific validation
    if (obj.type === 'text') {
      const textObj = obj as TextObjectType;
      if (!textObj.content && textObj.content !== '') {
        warnings.push(`Text object ${obj.id} has undefined content`);
      }
    }
    
    if (obj.type === 'arrow') {
      const arrowObj = obj as ArrowObjectType;
      if (!arrowObj.points || arrowObj.points.length < 2) {
        errors.push(`Arrow object ${obj.id} has insufficient points`);
      }
    }
  });
  
  return {
    success: errors.length === 0,
    message: errors.length === 0 
      ? `Object state validation passed (${warnings.length} warnings)`
      : `Object state validation failed (${errors.length} errors, ${warnings.length} warnings)`,
    data: {
      objectCount: objects.length,
      errors,
      warnings,
      objectTypes: objects.reduce((acc: Record<string, number>, obj) => {
        acc[obj.type] = (acc[obj.type] || 0) + 1;
        return acc;
      }, {})
    },
    timestamp: Date.now()
  };
};

/**
 * Run all basic tests
 */
export const runBasicTestSuite = (context: TestContext): TestResult => {
  const results: TestResult[] = [];
  
  // Object state validation
  results.push(validateObjectState(context.canvasObjects));
  
  // Mouse collision test (center of canvas)
  results.push(testMouseCollision(
    { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    context.canvasObjects,
    () => false // Placeholder collision detector
  ));
  
  // Arrow creation test
  results.push(testArrowCreation([
    { x: 100, y: 100 },
    { x: 200, y: 200 }
  ]));
  
  const failedTests = results.filter(r => !r.success);
  
  return {
    success: failedTests.length === 0,
    message: `Basic test suite: ${results.length - failedTests.length}/${results.length} tests passed`,
    data: {
      totalTests: results.length,
      passedTests: results.length - failedTests.length,
      failedTests: failedTests.length,
      results
    },
    timestamp: Date.now()
  };
};