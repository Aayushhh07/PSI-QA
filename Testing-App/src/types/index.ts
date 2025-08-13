export interface Website {
  id: string;
  name: string;
  baseUrl: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestRoute {
  id: string;
  websiteId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  name: string;
  description?: string;
  expectedStatus?: number;
  expectedContent?: string;
  timeout?: number;
  screenshot?: boolean;
  video?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestExecution {
  id: string;
  websiteId: string;
  routeId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result: {
    statusCode?: number;
    success: boolean;
    error?: string;
    screenshotPath?: string;
    videoPath?: string;
    logs: string[];
    performance?: {
      loadTime: number;
      domContentLoaded: number;
      firstContentfulPaint: number;
    };
  };
  createdAt: Date;
}

export interface TestReport {
  id: string;
  websiteId: string;
  executionId: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    successRate: number;
    averageDuration: number;
  };
  details: TestExecution[];
  generatedAt: Date;
}

export interface PlaywrightConfig {
  browser: 'chrome' | 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  timeout: number;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
}

export interface TestRequest {
  websiteId: string;
  routeId?: string;
  customUrl?: string;
  playwrightConfig?: Partial<PlaywrightConfig>;
  screenshot?: boolean;
  video?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 