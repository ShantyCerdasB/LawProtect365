/**
 * @file EventsPublisher.test.ts
 * @summary Tests for makeEventPublisher (100% line & branch coverage).
 */

import { makeEventPublisher } from "../../src/events/EventsPublisher.js";

type OutboxRecord = {
  id: string;
  type: string;
  occurredAt: string;
  payload: unknown;
  traceId?: string;
};

describe("makeEventPublisher", () => {
  const makePorts = () => {
    const bus = { publish: jest.fn<Promise<void>, [any[]]>() }; // publishes an array of events
    const outbox = {
      pullPending: jest.fn<Promise<OutboxRecord[]>, [number]>(),
      markDispatched: jest.fn<Promise<void>, [string]>(),
      markFailed: jest.fn<Promise<void>, [string, string]>(),
    };
    return { bus, outbox };
  };

  it("does nothing when there are no pending records", async () => {
    const { bus, outbox } = makePorts();
    outbox.pullPending.mockResolvedValueOnce([]);

    const publisher = makeEventPublisher(bus as any, outbox as any);
    await expect(publisher.dispatch(25)).resolves.toBeUndefined();

    expect(outbox.pullPending).toHaveBeenCalledWith(25);
    expect(bus.publish).not.toHaveBeenCalled();
    expect(outbox.markDispatched).not.toHaveBeenCalled();
    expect(outbox.markFailed).not.toHaveBeenCalled();
  });

  it("publishes each record and marks them dispatched (metadata present only with traceId)", async () => {
    const { bus, outbox } = makePorts();
    const now = "2024-01-02T03:04:05.000Z";

    const items: OutboxRecord[] = [
      { id: "a", type: "E1", occurredAt: now, payload: { x: 1 } }, // no traceId
      { id: "b", type: "E2", occurredAt: now, payload: { y: 2 }, traceId: "t-123" }, // has traceId
    ];

    outbox.pullPending.mockResolvedValueOnce(items);
    bus.publish.mockResolvedValue(undefined);

    const publisher = makeEventPublisher(bus as any, outbox as any);
    await expect(publisher.dispatch(2)).resolves.toBeUndefined();

    expect(outbox.pullPending).toHaveBeenCalledWith(2);

    // First call: array with one event, metadata undefined
    expect(bus.publish).toHaveBeenNthCalledWith(
      1,
      [
        expect.objectContaining({
          id: "a",
          type: "E1",
          occurredAt: now,
          payload: { x: 1 },
          metadata: undefined,
        }),
      ]
    );

    // Second call: array with one event, metadata includes x-trace-id
    expect(bus.publish).toHaveBeenNthCalledWith(
      2,
      [
        expect.objectContaining({
          id: "b",
          type: "E2",
          occurredAt: now,
          payload: { y: 2 },
          metadata: { "x-trace-id": "t-123" },
        }),
      ]
    );

    expect(outbox.markDispatched).toHaveBeenNthCalledWith(1, "a");
    expect(outbox.markDispatched).toHaveBeenNthCalledWith(2, "b");
    expect(outbox.markFailed).not.toHaveBeenCalled();
  });

  it("marks a record failed when publish throws and continues with others", async () => {
    const { bus, outbox } = makePorts();
    const now = "2024-01-02T03:04:05.000Z";

    const items: OutboxRecord[] = [
      { id: "ok1", type: "E_OK", occurredAt: now, payload: { ok: 1 } },
      { id: "bad", type: "E_BAD", occurredAt: now, payload: { bad: true }, traceId: "trace-bad" },
      { id: "ok2", type: "E_OK", occurredAt: now, payload: { ok: 2 } },
    ];
    outbox.pullPending.mockResolvedValueOnce(items);

    // Throw when the event array contains the "bad" id
    bus.publish.mockImplementation(async (events: any[]) => {
      if (Array.isArray(events) && events[0]?.id === "bad") {
        throw new Error("boom");
      }
    });

    const publisher = makeEventPublisher(bus as any, outbox as any);
    await expect(publisher.dispatch(10)).resolves.toBeUndefined();

    expect(outbox.pullPending).toHaveBeenCalledWith(10);

    // ok1 dispatched
    expect(outbox.markDispatched).toHaveBeenCalledWith("ok1");
    // bad failed with message
    expect(outbox.markFailed).toHaveBeenCalledWith("bad", "boom");
    // ok2 dispatched (loop continues)
    expect(outbox.markDispatched).toHaveBeenCalledWith("ok2");

    // Verify publish calls for each with expected metadata behavior
    expect(bus.publish).toHaveBeenCalledTimes(3);
    expect(bus.publish).toHaveBeenCalledWith([expect.objectContaining({ id: "ok1", metadata: undefined })]);
    expect(bus.publish).toHaveBeenCalledWith([
      expect.objectContaining({ id: "bad", metadata: { "x-trace-id": "trace-bad" } }),
    ]);
    expect(bus.publish).toHaveBeenCalledWith([expect.objectContaining({ id: "ok2", metadata: undefined })]);
  });

  it("marks failed with stringified non-Error values", async () => {
    const { bus, outbox } = makePorts();
    const now = "2024-01-02T03:04:05.000Z";
    outbox.pullPending.mockResolvedValueOnce([{ id: "x", type: "E", occurredAt: now, payload: {} }]);

    // Reject with a primitive string; catch branch should stringify as-is
    bus.publish.mockRejectedValueOnce("not-an-error");

    const publisher = makeEventPublisher(bus as any, outbox as any);
    await publisher.dispatch(1);

    expect(outbox.markFailed).toHaveBeenCalledWith("x", "not-an-error");
  });
});
