/**
 * Tests for Sperax Actions
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  getUSDsBalanceAction,
  getSPABalanceAction,
  mintUSDsAction,
  redeemUSDsAction,
  optInRebaseAction,
  getProtocolInfoAction,
} from '../actions';

// Mock @elizaos/core
mock.module('@elizaos/core', () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

// Mock SperaxService
const mockService = {
  getUSDsBalance: mock(() =>
    Promise.resolve({
      balance: BigInt('1000000000000000000000'),
      formattedBalance: '1000.0',
      isRebaseOptedIn: true,
      estimatedYield24h: '0.6849',
    })
  ),
  getSPABalance: mock(() =>
    Promise.resolve({
      spaBalance: BigInt('5000000000000000000000'),
      formattedSpaBalance: '5000.0',
      veSpBalance: BigInt('2500000000000000000000'),
      formattedVeSpBalance: '2500.0',
      votingPower: '2500.0',
      lockEndTime: 1735689600,
    })
  ),
  getProtocolInfo: mock(() =>
    Promise.resolve({
      totalSupply: BigInt('50000000000000000000000000'),
      formattedTotalSupply: '50000000',
      collateralRatio: '105.5',
      currentAPY: '25.0',
      rebaseFrequency: '24 hours',
      collateralBreakdown: [],
    })
  ),
  mintUSDs: mock(() =>
    Promise.resolve({
      success: true,
      txHash: '0x' + '1'.repeat(64),
      gasUsed: BigInt(150000),
    })
  ),
  redeemUSDs: mock(() =>
    Promise.resolve({
      success: true,
      txHash: '0x' + '2'.repeat(64),
      gasUsed: BigInt(120000),
    })
  ),
  enableAutoYield: mock(() =>
    Promise.resolve({
      success: true,
      txHash: '0x' + '3'.repeat(64),
      gasUsed: BigInt(80000),
    })
  ),
  getWalletAddress: mock(() => '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95'),
};

const createMockRuntime = (service = mockService) => ({
  getService: mock(() => service),
  getSetting: mock((key: string) => {
    if (key === 'SPERAX_PRIVATE_KEY') return '0x' + '1'.repeat(64);
    return undefined;
  }),
});

const createMockMessage = (text: string) => ({
  content: { text },
  userId: 'user-123',
  roomId: 'room-456',
});

const createMockCallback = () => mock(() => Promise.resolve());

describe('getUSDsBalanceAction', () => {
  beforeEach(() => {
    mockService.getUSDsBalance.mockClear();
  });

  it('should have correct action name', () => {
    expect(getUSDsBalanceAction.name).toBe('SPERAX_GET_USDS_BALANCE');
  });

  it('should have description', () => {
    expect(getUSDsBalanceAction.description).toBeDefined();
    expect(getUSDsBalanceAction.description.length).toBeGreaterThan(0);
  });

  it('should have similes for matching', () => {
    expect(getUSDsBalanceAction.similes).toBeDefined();
    expect(Array.isArray(getUSDsBalanceAction.similes)).toBe(true);
    expect(getUSDsBalanceAction.similes!.length).toBeGreaterThan(0);
  });

  it('should have examples', () => {
    expect(getUSDsBalanceAction.examples).toBeDefined();
    expect(Array.isArray(getUSDsBalanceAction.examples)).toBe(true);
  });

  describe('validate', () => {
    it('should validate message containing "usds"', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('what is my usds balance?');
      
      const result = await getUSDsBalanceAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });

    it('should validate message containing "sperax"', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('check my sperax holdings');
      
      const result = await getUSDsBalanceAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });

    it('should not validate unrelated message', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('what is the weather today?');
      
      const result = await getUSDsBalanceAction.validate(runtime as any, message as any);
      expect(result).toBe(false);
    });
  });

  describe('handler', () => {
    it('should return balance with provided address', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('check usds for 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95');
      const callback = createMockCallback();

      const result = await getUSDsBalanceAction.handler(
        runtime as any,
        message as any,
        {} as any,
        {},
        callback
      );

      expect(result.success).toBe(true);
      expect(mockService.getUSDsBalance).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should handle missing service', async () => {
      const runtime = { getService: mock(() => null) };
      const message = createMockMessage('check usds balance');
      const callback = createMockCallback();

      const result = await getUSDsBalanceAction.handler(
        runtime as any,
        message as any,
        {} as any,
        {},
        callback
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });
  });
});

describe('getSPABalanceAction', () => {
  beforeEach(() => {
    mockService.getSPABalance.mockClear();
  });

  it('should have correct action name', () => {
    expect(getSPABalanceAction.name).toBe('SPERAX_GET_SPA_BALANCE');
  });

  describe('validate', () => {
    it('should validate message containing "spa"', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('how much spa do I have?');
      
      const result = await getSPABalanceAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });

    it('should validate message containing "vespa"', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('check my vespa balance');
      
      const result = await getSPABalanceAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });

    it('should validate message containing "voting power"', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('what is my voting power?');
      
      const result = await getSPABalanceAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });
  });

  describe('handler', () => {
    it('should return SPA balance', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('check spa for 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95');
      const callback = createMockCallback();

      const result = await getSPABalanceAction.handler(
        runtime as any,
        message as any,
        {} as any,
        {},
        callback
      );

      expect(result.success).toBe(true);
      expect(mockService.getSPABalance).toHaveBeenCalled();
    });
  });
});

describe('mintUSDsAction', () => {
  it('should have correct action name', () => {
    expect(mintUSDsAction.name).toBe('SPERAX_MINT_USDS');
  });

  it('should have description mentioning minting', () => {
    expect(mintUSDsAction.description.toLowerCase()).toContain('mint');
  });

  describe('validate', () => {
    it('should validate mint command', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('mint 100 usds with usdc');
      
      const result = await mintUSDsAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });
  });
});

describe('redeemUSDsAction', () => {
  it('should have correct action name', () => {
    expect(redeemUSDsAction.name).toBe('SPERAX_REDEEM_USDS');
  });

  it('should have description mentioning redeem', () => {
    expect(redeemUSDsAction.description.toLowerCase()).toContain('redeem');
  });

  describe('validate', () => {
    it('should validate redeem command', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('redeem 50 usds for usdc');
      
      const result = await redeemUSDsAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });
  });
});

describe('optInRebaseAction', () => {
  it('should have correct action name', () => {
    expect(optInRebaseAction.name).toBe('SPERAX_OPT_IN_REBASE');
  });

  describe('validate', () => {
    it('should validate auto-yield enable command', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('enable auto yield on my usds');
      
      const result = await optInRebaseAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });

    it('should validate rebase opt-in command', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('opt in to rebase');
      
      const result = await optInRebaseAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });
  });
});

describe('getProtocolInfoAction', () => {
  it('should have correct action name', () => {
    expect(getProtocolInfoAction.name).toBe('SPERAX_GET_PROTOCOL_INFO');
  });

  describe('validate', () => {
    it('should validate protocol info request', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('what is the sperax tvl?');
      
      const result = await getProtocolInfoAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });

    it('should validate APY request', async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage('what is the current usds apy?');
      
      const result = await getProtocolInfoAction.validate(runtime as any, message as any);
      expect(result).toBe(true);
    });
  });
});

describe('Action Export', () => {
  it('should export all actions as array', async () => {
    const { speraxActions } = await import('../actions');
    
    expect(Array.isArray(speraxActions)).toBe(true);
    expect(speraxActions.length).toBeGreaterThan(0);
  });

  it('should have unique action names', async () => {
    const { speraxActions } = await import('../actions');
    
    const names = speraxActions.map((a: any) => a.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});
