/**
 * Generic message for pub/sub or queues.
 */
export interface Message<T = unknown> {
  key?: string;
  payload: T;
  headers?: Record<string, string>;
}

/**
 * Messaging abstraction for topics and queues.
 */
export interface MessageBusPort {
  publish<T = unknown>(topic: string, messages: Message<T> | Message<T>[]): Promise<void>;
  subscribe?<T = unknown>(topic: string, handler: (msg: Message<T>) => Promise<void>): Promise<void>;
}
