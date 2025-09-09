/**
 * @file metrics.ts
 * @summary CloudWatch metrics service for custom application metrics
 * @description Provides methods to send custom metrics to CloudWatch for monitoring and alerting
 */

import { CloudWatchClient, PutMetricDataCommand, type PutMetricDataCommandInput } from "@aws-sdk/client-cloudwatch";

/**
 * Configuration for the metrics service.
 */
export interface MetricsServiceConfig {
  /** CloudWatch namespace for custom metrics */
  namespace: string;
  /** AWS region for CloudWatch */
  region?: string;
  /** Whether to enable metrics (useful for testing) */
  enabled: boolean;
}

/**
 * Metric data point to send to CloudWatch.
 */
export interface MetricDataPoint {
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Metric unit */
  unit: "Seconds" | "Microseconds" | "Milliseconds" | "Bytes" | "Kilobytes" | "Megabytes" | "Gigabytes" | "Terabytes" | "Bits" | "Kilobits" | "Megabits" | "Gigabits" | "Terabits" | "Percent" | "Count" | "Bytes/Second" | "Kilobytes/Second" | "Megabytes/Second" | "Gigabytes/Second" | "Terabytes/Second" | "Bits/Second" | "Kilobits/Second" | "Megabits/Second" | "Gigabits/Second" | "Terabits/Second" | "Count/Second" | "None";
  /** Optional timestamp (defaults to current time) */
  timestamp?: Date;
  /** Optional dimensions for the metric */
  dimensions?: Array<{ Name: string; Value: string }>;
}

/**
 * CloudWatch metrics service for sending custom application metrics.
 */
export class MetricsService {
  private readonly client: CloudWatchClient;
  private readonly config: MetricsServiceConfig;

  constructor(config: MetricsServiceConfig) {
    this.config = config;
    this.client = new CloudWatchClient({
      region: config.region,
    });
  }

  /**
   * Sends a single metric to CloudWatch.
   */
  async putMetric(metric: MetricDataPoint): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const input: PutMetricDataCommandInput = {
        Namespace: this.config.namespace,
        MetricData: [{
          MetricName: metric.name,
          Value: metric.value,
          Unit: metric.unit,
          Timestamp: metric.timestamp ?? new Date(),
          Dimensions: metric.dimensions,
        }],
      };

      await this.client.send(new PutMetricDataCommand(input));
    } catch (error) {
      // Log error but don't throw - metrics should not break application flow
      console.error("Failed to send metric to CloudWatch:", error);
    }
  }

  /**
   * Sends multiple metrics to CloudWatch in a single API call.
   */
  async putMetrics(metrics: MetricDataPoint[]): Promise<void> {
    if (!this.config.enabled || metrics.length === 0) return;

    try {
      const input: PutMetricDataCommandInput = {
        Namespace: this.config.namespace,
        MetricData: metrics.map(metric => ({
          MetricName: metric.name,
          Value: metric.value,
          Unit: metric.unit,
          Timestamp: metric.timestamp ?? new Date(),
          Dimensions: metric.dimensions,
        })),
      };

      await this.client.send(new PutMetricDataCommand(input));
    } catch (error) {
      // Log error but don't throw - metrics should not break application flow
      console.error("Failed to send metrics to CloudWatch:", error);
    }
  }

  /**
   * Increments a counter metric by 1.
   */
  async incrementCounter(name: string, dimensions?: Array<{ Name: string; Value: string }>): Promise<void> {
    await this.putMetric({
      name,
      value: 1,
      unit: "Count",
      dimensions,
    });
  }

  /**
   * Records a duration metric in milliseconds.
   */
  async recordDuration(name: string, durationMs: number, dimensions?: Array<{ Name: string; Value: string }>): Promise<void> {
    await this.putMetric({
      name,
      value: durationMs,
      unit: "Milliseconds",
      dimensions,
    });
  }

  /**
   * Records a size metric in bytes.
   */
  async recordSize(name: string, sizeBytes: number, dimensions?: Array<{ Name: string; Value: string }>): Promise<void> {
    await this.putMetric({
      name,
      value: sizeBytes,
      unit: "Bytes",
      dimensions,
    });
  }
}




