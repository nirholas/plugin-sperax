/**
 * Tests for SperaxService
 */

import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { SperaxService } from '../services/SperaxService';
import { SPERAX_CONTRACTS, COLLATERAL_TOKENS } from '../types';

// Mock viem
const mockReadContract = mock(() => Promise.resolve(BigInt(0)));
const mockWriteContract = mock(() => Promise.resolve('0x' + '1'.repeat(64)));
const mockWaitForTransactionReceipt = mock(() => Promise.resolve({ status: 'success', gasUsed: BigInt(100000) }));

mock.module('viem', () => ({
  createPublicClient: () => ({
    readContract: mockReadContract,
  }),
  createWalletClient: () => ({
    writeContract: mockWriteContract,
  }),
  http: () => ({}),
  formatUnits: (value: bigint, decimals: number) => (Number(value) / Math.pow(10, decimals)).toString(),
  parseUnits: (value: string, decimals: number) => BigInt(Math.floor(Number(value) * Math.pow(10, decimals))),
}));

mock.module('viem/chains', () => ({
  arbitrum: { id: 42161, name: 'Arbitrum One' },
}));

mock.module('viem/accounts', () => ({
  privateKeyToAccount: (key: string) => ({
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95',
  }),
}));

// Mock @elizaos/core
mock.module('@elizaos/core', () => ({
  Service: class Service {
    static serviceType = 'base';
  },
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

describe('SperaxService', () => {
  let service: SperaxService;
  let mockRuntime: any;

  beforeEach(() => {
    service = new SperaxService();
    mockRuntime = {
      getSetting: mock((key: string) => {
        if (key === 'ARBITRUM_RPC_URL') return 'https://arb1.arbitrum.io/rpc';
        if (key === 'SPERAX_PRIVATE_KEY') return '0x' + '1'.repeat(64);
        return undefined;
      }),
    };
    
    // Reset mocks
    mockReadContract.mockClear();
    mockWriteContract.mockClear();
  });

  describe('initialization', () => {
    it('should have correct service type', () => {
      expect(SperaxService.serviceType).toBe('sperax');
    });

    it('should initialize with runtime settings', async () => {
      await service.initialize(mockRuntime);
      expect(mockRuntime.getSetting).toHaveBeenCalledWith('ARBITRUM_RPC_URL');
      expect(mockRuntime.getSetting).toHaveBeenCalledWith('SPERAX_PRIVATE_KEY');
    });

    it('should initialize in read-only mode without private key', async () => {
      const readOnlyRuntime = {
        getSetting: mock((key: string) => {
          if (key === 'ARBITRUM_RPC_URL') return 'https://arb1.arbitrum.io/rpc';
          return undefined;
        }),
      };
      
      await service.initialize(readOnlyRuntime);
      expect(service.getWalletAddress()).toBeUndefined();
    });
  });

  describe('getUSDsBalance', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime);
    });

    it('should return USDs balance for valid address', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95';
      
      // Mock balance of 1000 USDs and opted in
      mockReadContract.mockImplementation(async (args: any) => {
        if (args.functionName === 'balanceOf') {
          return BigInt('1000000000000000000000'); // 1000 USDs
        }
        if (args.functionName === 'rebaseOptedIn') {
          return true;
        }
        return BigInt(0);
      });

      const balance = await service.getUSDsBalance(testAddress);
      
      expect(balance).toBeDefined();
      expect(balance.formattedBalance).toBeDefined();
      expect(typeof balance.isRebaseOptedIn).toBe('boolean');
      expect(balance.estimatedYield24h).toBeDefined();
    });

    it('should throw error when service not initialized', async () => {
      const uninitializedService = new SperaxService();
      
      await expect(
        uninitializedService.getUSDsBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95')
      ).rejects.toThrow('Service not initialized');
    });
  });

  describe('getSPABalance', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime);
    });

    it('should return SPA and veSPA balance', async () => {
      const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95';
      
      mockReadContract.mockImplementation(async (args: any) => {
        if (args.address === SPERAX_CONTRACTS.SPA && args.functionName === 'balanceOf') {
          return BigInt('5000000000000000000000'); // 5000 SPA
        }
        if (args.address === SPERAX_CONTRACTS.veSPA && args.functionName === 'balanceOf') {
          return BigInt('2500000000000000000000'); // 2500 veSPA
        }
        if (args.functionName === 'locked') {
          return { amount: BigInt('1000000000000000000000'), end: BigInt(1735689600) };
        }
        return BigInt(0);
      });

      const balance = await service.getSPABalance(testAddress);
      
      expect(balance).toBeDefined();
      expect(balance.formattedSpaBalance).toBeDefined();
      expect(balance.formattedVeSpBalance).toBeDefined();
    });
  });

  describe('getWalletAddress', () => {
    it('should return wallet address when initialized with private key', async () => {
      await service.initialize(mockRuntime);
      const address = service.getWalletAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should return undefined when no private key', async () => {
      const readOnlyRuntime = {
        getSetting: mock(() => undefined),
      };
      await service.initialize(readOnlyRuntime);
      expect(service.getWalletAddress()).toBeUndefined();
    });
  });
});

describe('Contract Addresses', () => {
  it('should have valid USDs contract address', () => {
    expect(SPERAX_CONTRACTS.USDs).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should have valid SPA contract address', () => {
    expect(SPERAX_CONTRACTS.SPA).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should have valid veSPA contract address', () => {
    expect(SPERAX_CONTRACTS.veSPA).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should have valid Vault contract address', () => {
    expect(SPERAX_CONTRACTS.Vault).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});

describe('Collateral Tokens', () => {
  it('should have USDC address', () => {
    expect(COLLATERAL_TOKENS.USDC).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should have USDC.e (bridged) address', () => {
    expect(COLLATERAL_TOKENS['USDC.e']).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should have USDT address', () => {
    expect(COLLATERAL_TOKENS.USDT).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});
