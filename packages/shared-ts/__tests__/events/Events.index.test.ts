/**
 * @file events.index.test.ts
 * @summary Ensures the events barrel re-exports the public API (100% line coverage).
 */

import * as Events from '../../src/events/index.js';
import * as EventFactoryMod from '../../src/events/EventFactory.js';
import * as DomainEventMod from '../../src/events/DomainEvent.js';
import * as EventBusPortMod from '../../src/events/EventBusPort.js';
import * as EnvelopeMod from '../../src/events/Envelope.js';
import * as OutboxMod from '../../src/events/Outbox.js';

describe('events index (barrel) re-exports', () => {
  it('re-exports runtime symbols with identity preserved', () => {
    expect(Events.makeEvent).toBe(EventFactoryMod.makeEvent);
  });

  it('exposes all runtime (non-type) named exports from submodules', () => {
    const assertAllExportsPresent = (mod: Record<string, unknown>) => {
      const keys = Object.keys(mod).filter((k) => k !== 'default' && k !== '__esModule');
      for (const k of keys) {
        expect(Object.hasOwn(Events, k)).toBe(true);
      }
    };

    // Modules that may be type-only at build time will have zero runtime keys; this is OK.
    assertAllExportsPresent(EventFactoryMod);
    assertAllExportsPresent(DomainEventMod);
    assertAllExportsPresent(EventBusPortMod);
    assertAllExportsPresent(EnvelopeMod);
    assertAllExportsPresent(OutboxMod);
  });
});
