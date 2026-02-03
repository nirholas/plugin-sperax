/**
 * Tests for Sperax Types
 */

import { describe, it, expect } from 'bun:test';
import {
  SPERAX_CONTRACTS,
  COLLATERAL_TOKENS,
  type USDsBalance,
  type SPABalance,
  type ProtocolInfo,
  type MintParams,
  type RedeemParams,
  type SperaxTxResult,
  type CollateralToken,
} from '../types';

describe('SPERAX_CONTRACTS', () => {
  it('should have USDs address on Arbitrum', () => {
    expect(SPERAX_CONTRACTS.USDs).toBe('0xD74f5255D557944cf7Dd0E45FF521520002D5748');
  });

  it('should have SPA address on Arbitrum', () => {
    expect(SPERAX_CONTRACTS.SPA).toBe('0x5575552988A3A80504bBaeB1311674fCFd40aD4B');
  });

  it('should have veSPA address on Arbitrum', () => {
    expect(SPERAX_CONTRACTS.veSPA).toBe('0x2e2071180682Ce6C247B1eF93d382D509F5F6A17');
  });

  it('should have Vault address on Arbitrum', () => {
    expect(SPERAX_CONTRACTS.Vault).toBe('0x6Bbc476Ee35CBA9e9c3A59fc5b10d7a0BC6f74Ca');
  });

  it('should have all addresses as valid Ethereum addresses', () => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    Object.values(SPERAX_CONTRACTS).forEach((address) => {
      expect(address).toMatch(addressRegex);
    });
  });
});

describe('COLLATERAL_TOKENS', () => {
  it('should have native USDC address', () => {
    expect(COLLATERAL_TOKENS.USDC).toBe('0xaf88d065e77c8cC2239327C5EDb3A432268e5831');
  });

  it('should have bridged USDC.e address', () => {
    expect(COLLATERAL_TOKENS['USDC.e']).toBe('0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8');
  });

  it('should have USDT address', () => {
    expect(COLLATERAL_TOKENS.USDT).toBe('0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9');
  });

  it('should have all addresses as valid Ethereum addresses', () => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    Object.values(COLLATERAL_TOKENS).forEach((address) => {
      expect(address).toMatch(addressRegex);
    });
  });
});

describe('Type Definitions', () => {
  describe('USDsBalance', () => {
    it('should accept valid USDsBalance object', () => {
      const balance: USDsBalance = {
        balance: BigInt('1000000000000000000'),
        formattedBalance: '1.0',
        isRebaseOptedIn: true,
        estimatedYield24h: '0.0007',
      };

      expect(balance.balance).toBe(BigInt('1000000000000000000'));
      expect(balance.formattedBalance).toBe('1.0');
      expect(balance.isRebaseOptedIn).toBe(true);
      expect(balance.estimatedYield24h).toBe('0.0007');
    });
  });

  describe('SPABalance', () => {
    it('should accept valid SPABalance object', () => {
      const balance: SPABalance = {
        spaBalance: BigInt('5000000000000000000000'),
        formattedSpaBalance: '5000.0',
        veSpBalance: BigInt('2500000000000000000000'),
        formattedVeSpBalance: '2500.0',
        votingPower: '2500.0',
        lockEndTime: 1735689600,
      };

      expect(balance.spaBalance).toBe(BigInt('5000000000000000000000'));
      expect(balance.lockEndTime).toBe(1735689600);
    });

    it('should accept null lockEndTime', () => {
      const balance: SPABalance = {
        spaBalance: BigInt('5000000000000000000000'),
        formattedSpaBalance: '5000.0',
        veSpBalance: BigInt(0),
        formattedVeSpBalance: '0',
        votingPower: '0',
        lockEndTime: null,
      };

      expect(balance.lockEndTime).toBeNull();
    });
  });

  describe('MintParams', () => {
    it('should accept valid MintParams object', () => {
      const params: MintParams = {
        collateral: 'USDC',
        amount: BigInt('1000000000'), // 1000 USDC (6 decimals)
        minUSDsAmount: BigInt('990000000000000000000'), // 990 USDs (slippage)
        deadline: Math.floor(Date.now() / 1000) + 3600,
      };

      expect(params.collateral).toBe('USDC');
      expect(params.deadline).toBeGreaterThan(0);
    });
  });

  describe('RedeemParams', () => {
    it('should accept valid RedeemParams object', () => {
      const params: RedeemParams = {
        collateral: 'USDC',
        usdsAmount: BigInt('1000000000000000000000'), // 1000 USDs
        minCollateralAmount: BigInt('990000000'), // 990 USDC (slippage)
        deadline: Math.floor(Date.now() / 1000) + 3600,
      };

      expect(params.collateral).toBe('USDC');
    });

    it('should accept optional strategy', () => {
      const params: RedeemParams = {
        collateral: 'USDT',
        usdsAmount: BigInt('500000000000000000000'),
        minCollateralAmount: BigInt('495000000'),
        deadline: Math.floor(Date.now() / 1000) + 3600,
        strategy: 'optimal',
      };

      expect(params.strategy).toBe('optimal');
    });
  });

  describe('SperaxTxResult', () => {
    it('should accept successful transaction result', () => {
      const result: SperaxTxResult = {
        success: true,
        txHash: '0x' + '1'.repeat(64),
        gasUsed: BigInt(150000),
      };

      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
    });

    it('should accept failed transaction result', () => {
      const result: SperaxTxResult = {
        success: false,
        error: 'Insufficient balance',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient balance');
    });
  });

  describe('CollateralToken', () => {
    it('should be valid CollateralToken type', () => {
      const usdc: CollateralToken = 'USDC';
      const usdce: CollateralToken = 'USDC.e';
      const usdt: CollateralToken = 'USDT';

      expect(COLLATERAL_TOKENS[usdc]).toBeDefined();
      expect(COLLATERAL_TOKENS[usdce]).toBeDefined();
      expect(COLLATERAL_TOKENS[usdt]).toBeDefined();
    });
  });
});
