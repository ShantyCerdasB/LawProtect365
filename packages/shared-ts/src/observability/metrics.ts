/**
 * CloudWatch Embedded Metric Format (EMF) unit names.
 */
export type MetricUnit =
  | "Count"
  | "Milliseconds"
  | "Seconds"
  | "Bytes"
  | "Percent";

/**
 * Metric descriptor.
 */
export interface MetricDatum {
  name: string;
  unit?: MetricUnit;
  value: number;
}

/**
 * Dimensions applied to a metric set.
 */
export type Dimensions = Record<string, string>;

/**
 * Emits a single EMF metric with dimensions.
 * @param namespace CloudWatch namespace (e.g., "LawProtect/Service").
 * @param metrics Array of metrics to publish.
 * @param dimensions Dimensions object (e.g., { Service: "documents", Env: "dev" }).
 * @param timestamp Optional override timestamp (ms epoch).
 */
export const putMetrics = (
  namespace: string,
  metrics: MetricDatum[],
  dimensions: Dimensions,
  timestamp = Date.now()
): void => {
  if (!metrics.length) return;

  const metricDefs = metrics.map((m) => ({
    Name: m.name,
    ...(m.unit ? { Unit: m.unit } : {})
  }));

  const emf = {
    _aws: {
      Timestamp: timestamp,
      CloudWatchMetrics: [
        {
          Namespace: namespace,
          Dimensions: [Object.keys(dimensions)],
          Metrics: metricDefs
        }
      ]
    },
    ...dimensions
  } as Record<string, unknown>;

  for (const m of metrics) {
    emf[m.name] = m.value;
  }

};

/**
 * Increments a counter by n (default 1).
 * @param namespace CloudWatch namespace.
 * @param name Metric name.
 * @param dimensions Dimensions.
 * @param n Increment amount.
 */
export const incr = (
  namespace: string,
  name: string,
  dimensions: Dimensions,
  n = 1
): void => {
  putMetrics(namespace, [{ name, unit: "Count", value: n }], dimensions);
};

/**
 * Records a timing in milliseconds.
 * @param namespace CloudWatch namespace.
 * @param name Metric name.
 * @param ms Duration in milliseconds.
 * @param dimensions Dimensions.
 */
export const timing = (
  namespace: string,
  name: string,
  ms: number,
  dimensions: Dimensions
): void => {
  putMetrics(namespace, [{ name, unit: "Milliseconds", value: ms }], dimensions);
};
