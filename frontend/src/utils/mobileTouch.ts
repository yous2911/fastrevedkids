/**
 * Mobile Touch Event Handler
 * Advanced touch interaction system optimized for mobile devices
 */

import React, { useRef, useEffect } from 'react';

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  pressure: number;
  timestamp: number;
  element: HTMLElement;
}

interface GestureState {
  type: 'none' | 'tap' | 'double-tap' | 'long-press' | 'pan' | 'pinch' | 'swipe';
  startTime: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  scale: number;
  rotation: number;
  velocity: { x: number; y: number };
  touchCount: number;
}

interface TouchConfig {
  tapThreshold: number;
  doubleTapThreshold: number;
  longPressThreshold: number;
  panThreshold: number;
  swipeThreshold: number;
  swipeVelocityThreshold: number;
  pinchThreshold: number;
  preventDefaultScroll: boolean;
  enablePressure: boolean;
  enableMultiTouch: boolean;
  touchTolerance: number;
}

interface TouchCallbacks {
  onTap?: (point: TouchPoint, gesture: GestureState) => void;
  onDoubleTap?: (point: TouchPoint, gesture: GestureState) => void;
  onLongPress?: (point: TouchPoint, gesture: GestureState) => void;
  onPanStart?: (point: TouchPoint, gesture: GestureState) => void;
  onPanMove?: (point: TouchPoint, gesture: GestureState) => void;
  onPanEnd?: (point: TouchPoint, gesture: GestureState) => void;
  onPinchStart?: (center: TouchPoint, gesture: GestureState) => void;
  onPinchMove?: (center: TouchPoint, gesture: GestureState) => void;
  onPinchEnd?: (center: TouchPoint, gesture: GestureState) => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', gesture: GestureState) => void;
  onTouchStart?: (point: TouchPoint) => void;
  onTouchMove?: (point: TouchPoint) => void;
  onTouchEnd?: (point: TouchPoint) => void;
}

/**
 * Advanced mobile touch handler with gesture recognition
 */
export class MobileTouchHandler {
  private element: HTMLElement;
  private config: TouchConfig;
  private callbacks: TouchCallbacks;
  private activeTouches = new Map<number, TouchPoint>();
  private gestureState: GestureState;
  private longPressTimeout: NodeJS.Timeout | null = null;
  private doubleTapTimeout: NodeJS.Timeout | null = null;
  private lastTapTime = 0;
  private velocityTracker: { x: number[]; y: number[]; times: number[] } = {
    x: [],
    y: [],
    times: []
  };

  constructor(
    element: HTMLElement,
    config: Partial<TouchConfig> = {},
    callbacks: TouchCallbacks = {}
  ) {
    this.element = element;
    this.config = {
      tapThreshold: 10,
      doubleTapThreshold: 300,
      longPressThreshold: 500,
      panThreshold: 10,
      swipeThreshold: 50,
      swipeVelocityThreshold: 0.5,
      pinchThreshold: 10,
      preventDefaultScroll: true,
      enablePressure: true,
      enableMultiTouch: true,
      touchTolerance: 20,
      ...config
    };
    this.callbacks = callbacks;
    
    this.gestureState = this.createInitialGestureState();
    this.setupEventListeners();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<TouchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Update callbacks
   */
  public updateCallbacks(newCallbacks: Partial<TouchCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }

  /**
   * Get current gesture state
   */
  public getGestureState(): GestureState {
    return { ...this.gestureState };
  }

  /**
   * Get active touch points
   */
  public getActiveTouches(): TouchPoint[] {
    return Array.from(this.activeTouches.values());
  }

  /**
   * Enable/disable touch handling
   */
  public setEnabled(enabled: boolean): void {
    if (enabled) {
      this.setupEventListeners();
    } else {
      this.removeEventListeners();
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.removeEventListeners();
    this.clearTimeouts();
    this.activeTouches.clear();
  }

  /**
   * Setup touch event listeners with proper options
   */
  private setupEventListeners(): void {
    const options: AddEventListenerOptions = {
      passive: false,
      capture: false
    };

    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart, options);
    this.element.addEventListener('touchmove', this.handleTouchMove, options);
    this.element.addEventListener('touchend', this.handleTouchEnd, options);
    this.element.addEventListener('touchcancel', this.handleTouchCancel, options);

    // Mouse events for desktop compatibility
    this.element.addEventListener('mousedown', this.handleMouseDown, options);
    this.element.addEventListener('mousemove', this.handleMouseMove, options);
    this.element.addEventListener('mouseup', this.handleMouseUp, options);

    // Prevent default touch behaviors
    if (this.config.preventDefaultScroll) {
      this.element.addEventListener('touchmove', this.preventDefault, { passive: false });
      this.element.addEventListener('touchstart', this.preventDefault, { passive: false });
    }

    // Context menu prevention on long press
    this.element.addEventListener('contextmenu', this.preventDefault);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mousemove', this.handleMouseMove);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    
    this.element.removeEventListener('touchmove', this.preventDefault);
    this.element.removeEventListener('touchstart', this.preventDefault);
    this.element.removeEventListener('contextmenu', this.preventDefault);
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart = (event: TouchEvent): void => {
    const now = performance.now();
    
    Array.from(event.changedTouches).forEach(touch => {
      const point = this.createTouchPoint(touch, now);
      this.activeTouches.set(touch.identifier, point);
      
      this.callbacks.onTouchStart?.(point);
    });

    this.updateGestureState(event, now);
    this.startGestureRecognition();
  };

  /**
   * Handle touch move events
   */
  private handleTouchMove = (event: TouchEvent): void => {
    const now = performance.now();
    
    Array.from(event.changedTouches).forEach(touch => {
      const existingPoint = this.activeTouches.get(touch.identifier);
      if (existingPoint) {
        const point = this.updateTouchPoint(existingPoint, touch, now);
        this.activeTouches.set(touch.identifier, point);
        
        this.updateVelocityTracker(point);
        this.callbacks.onTouchMove?.(point);
      }
    });

    this.updateGestureState(event, now);
    this.handleGestureMove();
  };

  /**
   * Handle touch end events
   */
  private handleTouchEnd = (event: TouchEvent): void => {
    const now = performance.now();
    
    Array.from(event.changedTouches).forEach(touch => {
      const point = this.activeTouches.get(touch.identifier);
      if (point) {
        this.callbacks.onTouchEnd?.(point);
        this.activeTouches.delete(touch.identifier);
      }
    });

    this.updateGestureState(event, now);
    this.handleGestureEnd();
  };

  /**
   * Handle touch cancel events
   */
  private handleTouchCancel = (event: TouchEvent): void => {
    Array.from(event.changedTouches).forEach(touch => {
      this.activeTouches.delete(touch.identifier);
    });
    
    this.resetGestureState();
    this.clearTimeouts();
  };

  /**
   * Handle mouse events for desktop compatibility
   */
  private handleMouseDown = (event: MouseEvent): void => {
    if (this.activeTouches.size > 0) return; // Ignore mouse if touch is active
    
    const touch = this.createMouseTouch(event);
    this.handleTouchStart({ changedTouches: [touch] } as any);
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (this.activeTouches.size === 0) return;
    
    const touch = this.createMouseTouch(event);
    this.handleTouchMove({ changedTouches: [touch] } as any);
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (this.activeTouches.size === 0) return;
    
    const touch = this.createMouseTouch(event);
    this.handleTouchEnd({ changedTouches: [touch] } as any);
  };

  /**
   * Prevent default behavior
   */
  private preventDefault = (event: Event): void => {
    event.preventDefault();
  };

  /**
   * Create touch point from touch event
   */
  private createTouchPoint(touch: Touch, timestamp: number): TouchPoint {
    const rect = this.element.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    return {
      id: touch.identifier,
      x,
      y,
      startX: x,
      startY: y,
      pressure: this.config.enablePressure ? (touch as any).force || 1 : 1,
      timestamp,
      element: this.element
    };
  }

  /**
   * Update existing touch point
   */
  private updateTouchPoint(existingPoint: TouchPoint, touch: Touch, timestamp: number): TouchPoint {
    const rect = this.element.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    return {
      ...existingPoint,
      x,
      y,
      pressure: this.config.enablePressure ? (touch as any).force || 1 : 1,
      timestamp
    };
  }

  /**
   * Create mouse touch for desktop compatibility
   */
  private createMouseTouch(event: MouseEvent): Touch {
    return {
      identifier: 0,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      screenX: event.screenX,
      screenY: event.screenY,
      radiusX: 10,
      radiusY: 10,
      rotationAngle: 0,
      force: 1,
      target: event.target
    } as Touch;
  }

  /**
   * Update gesture state
   */
  private updateGestureState(event: TouchEvent, timestamp: number): void {
    const touches = Array.from(this.activeTouches.values());
    
    if (touches.length === 0) {
      this.resetGestureState();
      return;
    }

    const primaryTouch = touches[0];
    
    this.gestureState.touchCount = touches.length;
    this.gestureState.currentX = primaryTouch.x;
    this.gestureState.currentY = primaryTouch.y;
    this.gestureState.deltaX = primaryTouch.x - this.gestureState.startX;
    this.gestureState.deltaY = primaryTouch.y - this.gestureState.startY;
    this.gestureState.distance = Math.sqrt(
      this.gestureState.deltaX * this.gestureState.deltaX +
      this.gestureState.deltaY * this.gestureState.deltaY
    );

    // Calculate velocity
    const deltaTime = timestamp - this.gestureState.startTime;
    if (deltaTime > 0) {
      this.gestureState.velocity = {
        x: this.gestureState.deltaX / deltaTime,
        y: this.gestureState.deltaY / deltaTime
      };
    }

    // Multi-touch gestures
    if (touches.length === 2 && this.config.enableMultiTouch) {
      this.updatePinchGesture(touches);
    }
  }

  /**
   * Update pinch gesture state
   */
  private updatePinchGesture(touches: TouchPoint[]): void {
    const [touch1, touch2] = touches;
    
    const currentDistance = Math.sqrt(
      Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2)
    );
    
    const initialDistance = Math.sqrt(
      Math.pow(touch2.startX - touch1.startX, 2) + Math.pow(touch2.startY - touch1.startY, 2)
    );
    
    this.gestureState.scale = currentDistance / initialDistance;
    
    // Calculate rotation
    const currentAngle = Math.atan2(touch2.y - touch1.y, touch2.x - touch1.x);
    const initialAngle = Math.atan2(touch2.startY - touch1.startY, touch2.startX - touch1.startX);
    this.gestureState.rotation = currentAngle - initialAngle;
    
    // Update center point
    this.gestureState.currentX = (touch1.x + touch2.x) / 2;
    this.gestureState.currentY = (touch1.y + touch2.y) / 2;
  }

  /**
   * Start gesture recognition
   */
  private startGestureRecognition(): void {
    const touches = Array.from(this.activeTouches.values());
    if (touches.length === 0) return;
    
    const primaryTouch = touches[0];
    
    // Initialize gesture state
    if (this.gestureState.type === 'none') {
      this.gestureState.startTime = performance.now();
      this.gestureState.startX = primaryTouch.x;
      this.gestureState.startY = primaryTouch.y;
    }

    // Setup long press detection
    if (touches.length === 1) {
      this.longPressTimeout = setTimeout(() => {
        if (this.gestureState.distance < this.config.tapThreshold) {
          this.gestureState.type = 'long-press';
          this.callbacks.onLongPress?.(primaryTouch, this.gestureState);
        }
      }, this.config.longPressThreshold);
    }
  }

  /**
   * Handle gesture movement
   */
  private handleGestureMove(): void {
    const touches = Array.from(this.activeTouches.values());
    if (touches.length === 0) return;

    const primaryTouch = touches[0];

    // Clear long press if movement detected
    if (this.gestureState.distance > this.config.tapThreshold) {
      this.clearLongPressTimeout();
    }

    // Detect gesture type based on movement
    if (touches.length === 1) {
      if (this.gestureState.distance > this.config.panThreshold && this.gestureState.type === 'none') {
        this.gestureState.type = 'pan';
        this.callbacks.onPanStart?.(primaryTouch, this.gestureState);
      } else if (this.gestureState.type === 'pan') {
        this.callbacks.onPanMove?.(primaryTouch, this.gestureState);
      }
    } else if (touches.length === 2 && this.config.enableMultiTouch) {
      if (this.gestureState.type === 'none' && Math.abs(this.gestureState.scale - 1) > this.config.pinchThreshold / 100) {
        this.gestureState.type = 'pinch';
        const centerPoint = {
          ...primaryTouch,
          x: this.gestureState.currentX,
          y: this.gestureState.currentY
        };
        this.callbacks.onPinchStart?.(centerPoint, this.gestureState);
      } else if (this.gestureState.type === 'pinch') {
        const centerPoint = {
          ...primaryTouch,
          x: this.gestureState.currentX,
          y: this.gestureState.currentY
        };
        this.callbacks.onPinchMove?.(centerPoint, this.gestureState);
      }
    }
  }

  /**
   * Handle gesture end
   */
  private handleGestureEnd(): void {
    const touches = Array.from(this.activeTouches.values());
    
    if (touches.length === 0) {
      this.finalizeGesture();
    } else if (touches.length === 1 && this.gestureState.type === 'pinch') {
      // End pinch gesture when one finger is lifted
      const centerPoint = {
        ...touches[0],
        x: this.gestureState.currentX,
        y: this.gestureState.currentY
      };
      this.callbacks.onPinchEnd?.(centerPoint, this.gestureState);
      this.resetGestureState();
    }
  }

  /**
   * Finalize gesture when all touches end
   */
  private finalizeGesture(): void {
    const touches = Array.from(this.activeTouches.values());
    const primaryTouch = touches[0];
    
    this.clearTimeouts();

    // Determine final gesture type
    switch (this.gestureState.type) {
      case 'none':
        if (this.gestureState.distance < this.config.tapThreshold) {
          this.handleTapGesture(primaryTouch);
        }
        break;
        
      case 'pan':
        this.callbacks.onPanEnd?.(primaryTouch, this.gestureState);
        
        // Check for swipe
        if (this.gestureState.distance > this.config.swipeThreshold) {
          const velocity = Math.sqrt(
            this.gestureState.velocity.x * this.gestureState.velocity.x +
            this.gestureState.velocity.y * this.gestureState.velocity.y
          );
          
          if (velocity > this.config.swipeVelocityThreshold) {
            const direction = this.getSwipeDirection();
            this.callbacks.onSwipe?.(direction, this.gestureState);
          }
        }
        break;
        
      case 'pinch':
        const centerPoint = {
          ...primaryTouch,
          x: this.gestureState.currentX,
          y: this.gestureState.currentY
        };
        this.callbacks.onPinchEnd?.(centerPoint, this.gestureState);
        break;
    }

    this.resetGestureState();
  }

  /**
   * Handle tap gesture with double-tap detection
   */
  private handleTapGesture(touch: TouchPoint): void {
    const now = performance.now();
    const timeSinceLastTap = now - this.lastTapTime;
    
    if (timeSinceLastTap < this.config.doubleTapThreshold) {
      // Double tap detected
      this.clearDoubleTapTimeout();
      this.gestureState.type = 'double-tap';
      this.callbacks.onDoubleTap?.(touch, this.gestureState);
    } else {
      // Single tap - wait for potential double tap
      this.doubleTapTimeout = setTimeout(() => {
        this.gestureState.type = 'tap';
        this.callbacks.onTap?.(touch, this.gestureState);
      }, this.config.doubleTapThreshold);
    }
    
    this.lastTapTime = now;
  }

  /**
   * Get swipe direction
   */
  private getSwipeDirection(): 'up' | 'down' | 'left' | 'right' {
    const { deltaX, deltaY } = this.gestureState;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Update velocity tracker
   */
  private updateVelocityTracker(point: TouchPoint): void {
    const now = point.timestamp;
    
    this.velocityTracker.x.push(point.x);
    this.velocityTracker.y.push(point.y);
    this.velocityTracker.times.push(now);
    
    // Keep only recent samples
    const MAX_SAMPLES = 5;
    if (this.velocityTracker.x.length > MAX_SAMPLES) {
      this.velocityTracker.x.shift();
      this.velocityTracker.y.shift();
      this.velocityTracker.times.shift();
    }
  }

  /**
   * Create initial gesture state
   */
  private createInitialGestureState(): GestureState {
    return {
      type: 'none',
      startTime: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
      distance: 0,
      scale: 1,
      rotation: 0,
      velocity: { x: 0, y: 0 },
      touchCount: 0
    };
  }

  /**
   * Reset gesture state
   */
  private resetGestureState(): void {
    this.gestureState = this.createInitialGestureState();
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    this.clearLongPressTimeout();
    this.clearDoubleTapTimeout();
  }

  private clearLongPressTimeout(): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  private clearDoubleTapTimeout(): void {
    if (this.doubleTapTimeout) {
      clearTimeout(this.doubleTapTimeout);
      this.doubleTapTimeout = null;
    }
  }
}

/**
 * React hook for mobile touch handling
 */
export function useMobileTouch(
  elementRef: React.RefObject<HTMLElement>,
  callbacks: TouchCallbacks,
  config: Partial<TouchConfig> = {}
) {
  const handlerRef = useRef<MobileTouchHandler | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create touch handler
    handlerRef.current = new MobileTouchHandler(element, config, callbacks);

    return () => {
      handlerRef.current?.dispose();
      handlerRef.current = null;
    };
  }, [elementRef.current]);

  // Update callbacks when they change
  useEffect(() => {
    if (handlerRef.current) {
      handlerRef.current.updateCallbacks(callbacks);
    }
  }, [callbacks]);

  // Update config when it changes
  useEffect(() => {
    if (handlerRef.current) {
      handlerRef.current.updateConfig(config);
    }
  }, [config]);

  return {
    getGestureState: () => handlerRef.current?.getGestureState(),
    getActiveTouches: () => handlerRef.current?.getActiveTouches() || [],
    setEnabled: (enabled: boolean) => handlerRef.current?.setEnabled(enabled)
  };
}

/**
 * Utility functions for touch handling
 */
export const TouchUtils = {
  // Check if device supports touch
  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Get optimal touch target size for current device
  getOptimalTouchSize: (): number => {
    const pixelRatio = window.devicePixelRatio || 1;
    // Minimum 44px touch target as per accessibility guidelines
    return Math.max(44, 44 * pixelRatio);
  },

  // Calculate distance between two points
  getDistance: (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  },

  // Get point relative to element
  getRelativePoint: (
    event: TouchEvent | MouseEvent,
    element: HTMLElement
  ): { x: number; y: number } => {
    const rect = element.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }
};