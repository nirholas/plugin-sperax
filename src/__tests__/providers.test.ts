/**
 * Tests for Sperax Providers
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { speraxPortfolioProvider, speraxProtocolProvider, speraxProviders } from '../providers';

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
  getWalletAddress: mock(() => '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95'),
};

const createMockRuntime = (service: any = mockService) => ({
  getService: mock(() => service),
});

describe('speraxPortfolioProvider', () => {
  beforeEach(() => {
    mockService.getUSDsBalance.mockClear();
    mockService.getSPABalance.mockClear();
  });

  it('should have correct provider name', () => {
    expect(speraxPortfolioProvider.name).toBe('SPERAX_PORTFOLIO');
  });

  it('should have description', () => {
    expect(speraxPortfolioProvider.description).toBeDefined();
    expect(speraxPortfolioProvider.description.length).toBeGreaterThan(0);
  });

  describe('get', () => {
    it('should return portfolio data when wallet is configured', async () => {
      const runtime = createMockRuntime();
      
      const result = await speraxPortfolioProvider.get(
        runtime as any,
        {} as any,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.values?.hasWallet).toBe(true);
      expect(result.values?.usdsBalance).toBe('1000.0');
      expect(result.values?.spaBalance).toBe('5000.0');
    });

    it('should handle missing service', async () => {
      const runtime = { getService: mock(() => null) };
      
      const result = await speraxPortfolioProvider.get(
        runtime as any,
        {} as any,
        undefined
      );

      expect(result.text).toContain('not available');
    });

    it('should handle missing wallet', async () => {
      const noWalletService = {
        ...mockService,
        getWalletAddress: mock(() => undefined),
      };
      const runtime = createMockRuntime(noWalletService);
      
      const result = await speraxPortfolioProvider.get(
        runtime as any,
        {} as any,
        undefined
      );

      expect(result.values?.hasWallet).toBe(false);
      expect(result.text).toContain('No Sperax wallet configured');
    });

    it('should handle service errors gracefully', async () => {
      const errorService = {
        getWalletAddress: mock(() => '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95'),
        getUSDsBalance: mock(() => Promise.reject(new Error('RPC error'))),
        getSPABalance: mock(() => Promise.reject(new Error('RPC error'))),
      };
      const runtime = createMockRuntime(errorService);
      
      const result = await speraxPortfolioProvider.get(
        runtime as any,
        {} as any,
        undefined
      );

      expect(result.text).toContain('Error');
      expect(result.values?.error).toBe(true);
    });
  });
});

describe('speraxProtocolProvider', () => {
  beforeEach(() => {
    mockService.getProtocolInfo.mockClear();
  });

  it('should have correct provider name', () => {
    expect(speraxProtocolProvider.name).toBe('SPERAX_PROTOCOL');
  });

  it('should have description', () => {
    expect(speraxProtocolProvider.description).toBeDefined();
    expect(speraxProtocolProvider.description.length).toBeGreaterThan(0);
  });

  describe('get', () => {
    it('should return protocol info', async () => {
      const runtime = createMockRuntime();
      
      const result = await speraxProtocolProvider.get(
        runtime as any,
        {} as any,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.values?.totalSupply).toBeDefined();
    });

    it('should handle missing service', async () => {
      const runtime = { getService: mock(() => null) };
      
      const result = await speraxProtocolProvider.get(
        runtime as any,
        {} as any,
        undefined
      );

      expect(result.text).toContain('not available');
    });
  });
});

describe('Providers Export', () => {
  it('should export providers array', () => {
    expect(Array.isArray(speraxProviders)).toBe(true);
  });

  it('should include portfolio provider', () => {
    const names = speraxProviders.map((p: any) => p.name);
    expect(names).toContain('SPERAX_PORTFOLIO');
  });

  it('should include protocol provider', () => {
    const names = speraxProviders.map((p: any) => p.name);
    expect(names).toContain('SPERAX_PROTOCOL');
  });

  it('should have unique provider names', () => {
    const names = speraxProviders.map((p: any) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});
