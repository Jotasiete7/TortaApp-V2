import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LiveTradeMonitor, Trade } from '../services/LiveTradeMonitor';

/* ------------------------------------------------------------------ */
/*                              Mocks                                 */
/* ------------------------------------------------------------------ */

const setItemMock = vi.fn();
const getItemMock = vi.fn();

vi.mock('localforage', () => {
  return {
    default: {
      createInstance: vi.fn(() => ({
        getItem: getItemMock,
        setItem: setItemMock,
      })),
    },
  };
});

const rpcMock = vi.fn();

vi.mock('../services/supabase', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

const toastInfoMock = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    info: toastInfoMock,
  },
}));

/* ------------------------------------------------------------------ */
/*                         Helpers / Fixtures                          */
/* ------------------------------------------------------------------ */

const tradeFixture: Trade = {
  timestamp: new Date().toISOString(),
  nick: 'TraderJoe',
  message: 'WTS rare item',
  type: 'WTS',
  item: 'Rare Sword',
  price: '10s',
  server: 'Harmony',
  raw: '[WTS] Rare Sword 10s',
};

const setNavigatorOnline = (value: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
};

/* ------------------------------------------------------------------ */
/*                              Tests                                 */
/* ------------------------------------------------------------------ */

describe('LiveTradeMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Default: no queue persisted
    getItemMock.mockResolvedValue(null);

    // Default: Supabase success
    rpcMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enfileira trades quando estiver offline e persiste no localforage', async () => {
    setNavigatorOnline(false);

    const monitor = new LiveTradeMonitor();
    await vi.runAllTicks();

    await monitor.submitTrade(tradeFixture);

    expect(setItemMock).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledWith(
      'queue',
      expect.arrayContaining([
        expect.objectContaining({
          nick: 'TraderJoe',
          retryCount: 0,
        }),
      ]),
    );

    expect(rpcMock).not.toHaveBeenCalled();
    expect(toastInfoMock).toHaveBeenCalledWith(
      'Trade enfileirado para envio posterior.',
    );
  });

  it('processa a fila quando a conexão volta (evento online)', async () => {
    setNavigatorOnline(false);

    getItemMock.mockResolvedValue([
      { ...tradeFixture, retryCount: 0 },
    ]);

    const monitor = new LiveTradeMonitor();
    await vi.runAllTicks();

    setNavigatorOnline(true);
    window.dispatchEvent(new Event('online'));

    // 1s delay (primeiro retry)
    await vi.advanceTimersByTimeAsync(1000);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenLastCalledWith('queue', []);
  });

  it('faz retry com back-off exponencial e tem sucesso na 3ª tentativa', async () => {
    setNavigatorOnline(true);

    // 2 falhas, 1 sucesso
    rpcMock
      .mockResolvedValueOnce({ error: new Error('fail 1') })
      .mockResolvedValueOnce({ error: new Error('fail 2') })
      .mockResolvedValueOnce({ error: null });

    getItemMock.mockResolvedValue([
      { ...tradeFixture, retryCount: 0 },
    ]);

    const monitor = new LiveTradeMonitor();
    await vi.runAllTicks();

    window.dispatchEvent(new Event('online'));

    // Retry 1 → 1s
    await vi.advanceTimersByTimeAsync(1000);
    // Retry 2 → 2s
    await vi.advanceTimersByTimeAsync(2000);
    // Retry 3 → 4s
    await vi.advanceTimersByTimeAsync(4000);

    expect(rpcMock).toHaveBeenCalledTimes(3);

    // Fila final vazia após sucesso
    expect(setItemMock).toHaveBeenLastCalledWith('queue', []);
  });

  it('re-enfileira o trade se falhar mesmo após tentar online', async () => {
    setNavigatorOnline(true);

    rpcMock.mockResolvedValue({ error: new Error('always fails') });

    getItemMock.mockResolvedValue([
      { ...tradeFixture, retryCount: 0 },
    ]);

    const monitor = new LiveTradeMonitor();
    await vi.runAllTicks();

    window.dispatchEvent(new Event('online'));

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(4000);

    expect(rpcMock).toHaveBeenCalledTimes(3);

    expect(setItemMock).toHaveBeenLastCalledWith(
      'queue',
      expect.arrayContaining([
        expect.objectContaining({
          nick: 'TraderJoe',
          retryCount: 3,
        }),
      ]),
    );
  });
});
