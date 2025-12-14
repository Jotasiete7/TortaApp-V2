import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LiveTradeMonitor, Trade } from '../services/LiveTradeMonitor';

/* ------------------------------------------------------------------ */
/*                              Mocks                                 */
/* ------------------------------------------------------------------ */

// Vitest Hoisting Fix: Variables used in vi.mock() must be hoisted
const mocks = vi.hoisted(() => ({
  setItemMock: vi.fn(),
  getItemMock: vi.fn(),
  rpcMock: vi.fn(),
  toastInfoMock: vi.fn(),
  invokeMock: vi.fn(),
  listenMock: vi.fn(),
  getUserMock: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } } }),
}));

vi.mock('localforage', () => {
  return {
    default: {
      createInstance: vi.fn(() => ({
        getItem: mocks.getItemMock,
        setItem: mocks.setItemMock,
      })),
    },
  };
});

vi.mock('../services/supabase', () => ({
  supabase: {
    rpc: mocks.rpcMock,
    auth: {
        getUser: mocks.getUserMock
    }
  },
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mocks.invokeMock,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: mocks.listenMock,
}));

vi.mock('sonner', () => ({
  toast: {
    info: mocks.toastInfoMock,
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
    mocks.getItemMock.mockResolvedValue(null);

    // Default: Supabase success
    mocks.rpcMock.mockResolvedValue({ error: null });
    
    // Default: Auth success
    mocks.getUserMock.mockResolvedValue({ data: { user: { id: 'mock-user-id' } } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enfileira trades quando estiver offline e persiste no localforage', async () => {
    setNavigatorOnline(false);

    const monitor = new LiveTradeMonitor();
    
    // Wait for init
    await vi.runAllTicks();

    await monitor.submitTrade(tradeFixture);

    expect(mocks.setItemMock).toHaveBeenCalledTimes(1);
    expect(mocks.setItemMock).toHaveBeenCalledWith(
      'queue',
      expect.arrayContaining([
        expect.objectContaining({
          nick: 'TraderJoe',
          retryCount: 0,
        }),
      ]),
    );

    expect(mocks.rpcMock).not.toHaveBeenCalled();
    expect(mocks.toastInfoMock).toHaveBeenCalledWith(
      'Trade enfileirado para envio posterior.',
    );
  });

  it('processa a fila quando a conexão volta (evento online)', async () => {
    setNavigatorOnline(false);

    mocks.getItemMock.mockResolvedValue([
      { ...tradeFixture, retryCount: 0 },
    ]);

    const monitor = new LiveTradeMonitor();
    await vi.runAllTicks();

    setNavigatorOnline(true);
    window.dispatchEvent(new Event('online'));

    // 1s delay (primeiro retry)
    await vi.advanceTimersByTimeAsync(1000);

    expect(mocks.rpcMock).toHaveBeenCalledTimes(1);
    expect(mocks.setItemMock).toHaveBeenLastCalledWith('queue', []);
  });

  it('faz retry com back-off exponencial e tem sucesso na 3ª tentativa', async () => {
    setNavigatorOnline(true);

    // 2 falhas, 1 sucesso
    mocks.rpcMock
      .mockResolvedValueOnce({ error: new Error('fail 1') })
      .mockResolvedValueOnce({ error: new Error('fail 2') })
      .mockResolvedValueOnce({ error: null });

    mocks.getItemMock.mockResolvedValue([
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

    expect(mocks.rpcMock).toHaveBeenCalledTimes(3);

    // Fila final vazia após sucesso
    expect(mocks.setItemMock).toHaveBeenLastCalledWith('queue', []);
  });

  it('re-enfileira o trade se falhar mesmo após tentar online', async () => {
    setNavigatorOnline(true);

    mocks.rpcMock.mockResolvedValue({ error: new Error('always fails') });

    mocks.getItemMock.mockResolvedValue([
      { ...tradeFixture, retryCount: 0 },
    ]);

    const monitor = new LiveTradeMonitor();
    await vi.runAllTicks();

    window.dispatchEvent(new Event('online'));

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(4000);

    expect(mocks.rpcMock).toHaveBeenCalledTimes(3);

    expect(mocks.setItemMock).toHaveBeenLastCalledWith(
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
