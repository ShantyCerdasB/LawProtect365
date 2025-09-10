import { MetricsService, type MetricsServiceConfig, type MetricDataPoint } from '../../src/services/metrics.js';

// Mock AWS SDK
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: jest.fn().mockImplementation(() => ({
    send: mockSend})),
  PutMetricDataCommand: jest.fn()}));

describe('MetricsService', () => {
  let metricsService: MetricsService;
  let mockConfig: MetricsServiceConfig;

  beforeEach(() => {
    mockConfig = {
      namespace: 'TestNamespace',
      region: 'us-east-1',
      enabled: true};

    metricsService = new MetricsService(mockConfig);
    
    // Reset the mock
    mockSend.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service with provided config', () => {
      expect(metricsService).toBeInstanceOf(MetricsService);
    });

    it('should create service with minimal config', () => {
      const minimalConfig: MetricsServiceConfig = {
        namespace: 'TestNamespace',
        enabled: true};

      const service = new MetricsService(minimalConfig);
      expect(service).toBeInstanceOf(MetricsService);
    });
  });

  describe('putMetric', () => {
    it('should send metric when enabled', async () => {
      const metric: MetricDataPoint = {
        name: 'TestMetric',
        value: 100,
        unit: 'Count'};

      mockSend.mockResolvedValue({});

      await metricsService.putMetric(metric);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should not send metric when disabled', async () => {
      const disabledService = new MetricsService({
        ...mockConfig,
        enabled: false});

      const metric: MetricDataPoint = {
        name: 'TestMetric',
        value: 100,
        unit: 'Count'};

      await disabledService.putMetric(metric);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle CloudWatch errors gracefully', async () => {
      const metric: MetricDataPoint = {
        name: 'TestMetric',
        value: 100,
        unit: 'Count'};

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSend.mockRejectedValue(new Error('CloudWatch error'));

      await expect(metricsService.putMetric(metric)).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send metric to CloudWatch:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should include timestamp when provided', async () => {
      const timestamp = new Date('2023-01-01T00:00:00.000Z');
      const metric: MetricDataPoint = {
        name: 'TestMetric',
        value: 100,
        unit: 'Count',
        timestamp};

      mockSend.mockResolvedValue({});

      await metricsService.putMetric(metric);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should include dimensions when provided', async () => {
      const dimensions = [
        { Name: 'Environment', Value: 'test' },
        { Name: 'Service', Value: 'test-service' },
      ];
      const metric: MetricDataPoint = {
        name: 'TestMetric',
        value: 100,
        unit: 'Count',
        dimensions};

      mockSend.mockResolvedValue({});

      await metricsService.putMetric(metric);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('putMetrics', () => {
    it('should send multiple metrics when enabled', async () => {
      const metrics: MetricDataPoint[] = [
        { name: 'Metric1', value: 100, unit: 'Count' },
        { name: 'Metric2', value: 200, unit: 'Count' },
      ];

      mockSend.mockResolvedValue({});

      await metricsService.putMetrics(metrics);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should not send metrics when disabled', async () => {
      const disabledService = new MetricsService({
        ...mockConfig,
        enabled: false});

      const metrics: MetricDataPoint[] = [
        { name: 'Metric1', value: 100, unit: 'Count' },
      ];

      await disabledService.putMetrics(metrics);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should not send metrics when array is empty', async () => {
      await metricsService.putMetrics([]);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle CloudWatch errors gracefully', async () => {
      const metrics: MetricDataPoint[] = [
        { name: 'Metric1', value: 100, unit: 'Count' },
      ];

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSend.mockRejectedValue(new Error('CloudWatch error'));

      await expect(metricsService.putMetrics(metrics)).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send metrics to CloudWatch:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('incrementCounter', () => {
    it('should send counter metric with value 1', async () => {
      mockSend.mockResolvedValue({});

      await metricsService.incrementCounter('TestCounter');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should include dimensions when provided', async () => {
      const dimensions = [{ Name: 'Environment', Value: 'test' }];
      mockSend.mockResolvedValue({});

      await metricsService.incrementCounter('TestCounter', dimensions);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordDuration', () => {
    it('should send duration metric in milliseconds', async () => {
      mockSend.mockResolvedValue({});

      await metricsService.recordDuration('TestDuration', 1500);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should include dimensions when provided', async () => {
      const dimensions = [{ Name: 'Operation', Value: 'test-op' }];
      mockSend.mockResolvedValue({});

      await metricsService.recordDuration('TestDuration', 1500, dimensions);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordSize', () => {
    it('should send size metric in bytes', async () => {
      mockSend.mockResolvedValue({});

      await metricsService.recordSize('TestSize', 1024);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should include dimensions when provided', async () => {
      const dimensions = [{ Name: 'FileType', Value: 'json' }];
      mockSend.mockResolvedValue({});

      await metricsService.recordSize('TestSize', 1024, dimensions);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
