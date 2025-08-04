/**
 * Privacy-focused Analytics and Performance Monitoring System
 * Collects anonymous usage data and performance metrics for optimization
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Canvas specific metrics
  canvasRenderTime: number;
  canvasFrameRate: number;
  canvasMemoryUsage: number;
  
  // User interaction metrics
  inputLatency: number;
  gestureResponseTime: number;
  
  // Application metrics
  loadTime: number;
  bundleSize: number;
  objectCount: number;
  sessionDuration: number;
}

export interface UsageEvent {
  type: 'canvas_interaction' | 'gesture' | 'export' | 'ai_usage' | 'error' | 'performance';
  action: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

export interface UserContext {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browserName: string;
  browserVersion: string;
  screenResolution: string;
  pixelRatio: number;
  touchSupport: boolean;
  language: string;
  timezone: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  endpoint?: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  enableUsageTracking: boolean;
  sampleRate: number; // 0-1, percentage of sessions to track
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: false, // Disabled by default for privacy
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  maxRetries: 3,
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,
  enableUsageTracking: true,
  sampleRate: 0.1 // Track 10% of sessions
};

export class AnalyticsManager {
  private config: AnalyticsConfig;
  private sessionId: string;
  private userContext: UserContext;
  private eventQueue: UsageEvent[] = [];
  private performanceObserver?: PerformanceObserver;
  private flushTimer?: number;
  private retryCount = 0;
  private startTime = Date.now();
  private isEnabled = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.userContext = this.collectUserContext();
    
    // Check if analytics should be enabled for this session
    this.isEnabled = this.config.enabled && 
                    Math.random() < this.config.sampleRate &&
                    this.hasUserConsent();

    if (this.isEnabled) {
      this.initialize();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private hasUserConsent(): boolean {
    // Check for user consent (GDPR compliance)
    const consent = localStorage.getItem('nntype-analytics-consent');
    return consent === 'true';
  }

  private collectUserContext(): UserContext {
    const navigator = window.navigator;
    const screen = window.screen;
    
    return {
      deviceType: this.detectDeviceType(),
      browserName: this.detectBrowser(),
      browserVersion: this.detectBrowserVersion(),
      screenResolution: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window,
      language: navigator.language || 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'
    };
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    
    if (isMobile && !isTablet) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    if (userAgent.includes('opera')) return 'opera';
    
    return 'unknown';
  }

  private detectBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(chrome|firefox|safari|edge|opera)\/(\d+)/i);
    return match ? match[2] : 'unknown';
  }

  private initialize(): void {
    this.setupPerformanceMonitoring();
    this.setupErrorTracking();
    this.setupFlushTimer();
    this.trackSessionStart();
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) return;

    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handlePerformanceEntry(entry);
          }
        });

        // Observe different performance entry types
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
        
        // Observe layout shift if supported
        if ('LayoutShift' in window) {
          this.performanceObserver.observe({ entryTypes: ['layout-shift'] });
        }
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }

    // Monitor FPS and rendering performance
    this.monitorRenderingPerformance();
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    const event: UsageEvent = {
      type: 'performance',
      action: entry.entryType,
      value: entry.duration || (entry as any).value,
      metadata: {
        name: entry.name,
        startTime: entry.startTime,
        ...this.extractPerformanceMetadata(entry)
      },
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.trackEvent(event);
  }

  private extractPerformanceMetadata(entry: PerformanceEntry): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      metadata.loadEventEnd = navEntry.loadEventEnd;
      metadata.domContentLoaded = navEntry.domContentLoadedEventEnd;
      metadata.transferSize = navEntry.transferSize;
    }

    if (entry.entryType === 'paint') {
      metadata.paintType = entry.name;
    }

    if (entry.entryType === 'layout-shift') {
      const lsEntry = entry as any; // LayoutShift interface may not be fully supported
      metadata.value = lsEntry.value;
      metadata.hadRecentInput = lsEntry.hadRecentInput;
    }

    return metadata;
  }

  private monitorRenderingPerformance(): void {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let totalFrameTime = 0;

    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      
      frameCount++;
      totalFrameTime += frameTime;
      
      // Report FPS every 60 frames
      if (frameCount >= 60) {
        const averageFrameTime = totalFrameTime / frameCount;
        const fps = 1000 / averageFrameTime;
        
        this.trackEvent({
          type: 'performance',
          action: 'fps_measurement',
          value: fps,
          metadata: {
            averageFrameTime,
            frameCount
          },
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
        
        frameCount = 0;
        totalFrameTime = 0;
      }
      
      lastFrameTime = currentTime;
      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  private setupErrorTracking(): void {
    if (!this.config.enableErrorTracking) return;

    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  private setupFlushTimer(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private trackSessionStart(): void {
    this.trackEvent({
      type: 'canvas_interaction',
      action: 'session_start',
      metadata: {
        userContext: this.userContext,
        config: {
          deviceType: this.userContext.deviceType,
          browserName: this.userContext.browserName,
          touchSupport: this.userContext.touchSupport
        }
      },
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  // Public API
  trackEvent(event: Omit<UsageEvent, 'sessionId' | 'timestamp'>): void {
    if (!this.isEnabled) return;

    const fullEvent: UsageEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.eventQueue.push(fullEvent);

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  trackCanvasInteraction(action: string, value?: number, metadata?: Record<string, any>): void {
    this.trackEvent({
      type: 'canvas_interaction',
      action,
      value,
      metadata
    });
  }

  trackGesture(gestureType: string, duration?: number, metadata?: Record<string, any>): void {
    this.trackEvent({
      type: 'gesture',
      action: gestureType,
      value: duration,
      metadata
    });
  }

  trackExport(format: string, objectCount: number, fileSize?: number): void {
    this.trackEvent({
      type: 'export',
      action: format,
      value: fileSize,
      metadata: { objectCount }
    });
  }

  trackAIUsage(feature: string, responseTime?: number, success = true): void {
    this.trackEvent({
      type: 'ai_usage',
      action: feature,
      value: responseTime,
      metadata: { success }
    });
  }

  trackError(error: Error | any, metadata?: Record<string, any>): void {
    if (!this.config.enableErrorTracking) return;

    this.trackEvent({
      type: 'error',
      action: 'javascript_error',
      metadata: {
        message: error?.message || String(error),
        stack: error?.stack,
        name: error?.name,
        ...metadata
      }
    });
  }

  trackPerformanceMetric(metric: string, value: number, metadata?: Record<string, any>): void {
    this.trackEvent({
      type: 'performance',
      action: metric,
      value,
      metadata
    });
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
      this.retryCount = 0;
    } catch (error) {
      console.warn('Analytics flush failed:', error);
      
      // Retry failed events
      if (this.retryCount < this.config.maxRetries) {
        this.eventQueue.unshift(...events);
        this.retryCount++;
      }
    }
  }

  private async sendEvents(events: UsageEvent[]): Promise<void> {
    if (!this.config.endpoint) {
      // If no endpoint is configured, just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics events:', events);
      }
      return;
    }

    const payload = {
      events,
      sessionId: this.sessionId,
      userContext: this.userContext,
      timestamp: Date.now()
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Analytics request failed: ${response.status}`);
    }
  }

  getSessionMetrics(): {
    sessionId: string;
    duration: number;
    eventCount: number;
    userContext: UserContext;
  } {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      eventCount: this.eventQueue.length,
      userContext: this.userContext
    };
  }

  enable(): void {
    if (this.hasUserConsent()) {
      this.isEnabled = true;
      this.initialize();
    }
  }

  disable(): void {
    this.isEnabled = false;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush remaining events before cleanup
    this.flush().catch(console.warn);
  }

  destroy(): void {
    this.cleanup();
    this.eventQueue = [];
  }
}

// Privacy-focused consent management
export class ConsentManager {
  private static CONSENT_KEY = 'nntype-analytics-consent';
  private static CONSENT_VERSION = '1.0';
  private static CONSENT_VERSION_KEY = 'nntype-consent-version';

  static requestConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if consent was already given for this version
      const existingConsent = localStorage.getItem(this.CONSENT_KEY);
      const consentVersion = localStorage.getItem(this.CONSENT_VERSION_KEY);
      
      if (existingConsent && consentVersion === this.CONSENT_VERSION) {
        resolve(existingConsent === 'true');
        return;
      }

      // Show consent dialog (implement your own UI)
      this.showConsentDialog((granted) => {
        localStorage.setItem(this.CONSENT_KEY, granted.toString());
        localStorage.setItem(this.CONSENT_VERSION_KEY, this.CONSENT_VERSION);
        resolve(granted);
      });
    });
  }

  private static showConsentDialog(callback: (granted: boolean) => void): void {
    // Simple implementation - you should replace with proper UI
    const message = `
      NNType would like to collect anonymous usage data to improve the application.
      No personal information is collected. Would you like to enable analytics?
    `;
    
    const granted = confirm(message);
    callback(granted);
  }

  static revokeConsent(): void {
    localStorage.removeItem(this.CONSENT_KEY);
    localStorage.removeItem(this.CONSENT_VERSION_KEY);
  }

  static hasConsent(): boolean {
    return localStorage.getItem(this.CONSENT_KEY) === 'true';
  }
}

// Global instance
let analyticsInstance: AnalyticsManager | null = null;

export const initializeAnalytics = (config?: Partial<AnalyticsConfig>): AnalyticsManager => {
  if (analyticsInstance) {
    analyticsInstance.destroy();
  }
  
  analyticsInstance = new AnalyticsManager(config);
  return analyticsInstance;
};

export const getAnalytics = (): AnalyticsManager | null => {
  return analyticsInstance;
};