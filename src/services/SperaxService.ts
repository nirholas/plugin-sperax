/**
 * Sperax Service - Core service for interacting with Sperax Protocol
 * Handles USDs, SPA, veSPA operations on Arbitrum
 */

import { Service, type IAgentRuntime, logger } from '@elizaos/core';
import { createPublicClient, createWalletClient, http, formatUnits, parseUnits } from 'viem';
import { arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  SPERAX_CONTRACTS,
  COLLATERAL_TOKENS,
  type CollateralToken,
  type USDsBalance,
  type SPABalance,
  type ProtocolInfo,
  type MintParams,
  type RedeemParams,
  type SperaxTxResult,
  type RebaseInfo,
  type SperaxPluginConfig,
} from '../types';

// ABIs (simplified for key functions)
const USDS_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'rebaseOptedIn', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'rebaseOptIn', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'creditPerToken', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

const VAULT_ABI = [
  { name: 'mint', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_collateral', type: 'address' }, { name: '_collateralAmt', type: 'uint256' }, { name: '_minUSDSAmt', type: 'uint256' }, { name: '_deadline', type: 'uint256' }], outputs: [] },
  { name: 'redeem', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_collateral', type: 'address' }, { name: '_usdsAmt', type: 'uint256' }, { name: '_minCollAmt', type: 'uint256' }, { name: '_deadline', type: 'uint256' }], outputs: [] },
  { name: 'redeemView', type: 'function', stateMutability: 'view', inputs: [{ name: '_collateral', type: 'address' }, { name: '_usdsAmt', type: 'uint256' }], outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }] },
] as const;

const SPA_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

const VESPA_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'locked', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: 'amount', type: 'uint128' }, { name: 'end', type: 'uint128' }] },
] as const;

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
] as const;

export class SperaxService extends Service {
  static serviceType = 'sperax';
  
  private publicClient: ReturnType<typeof createPublicClient> | null = null;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private account: ReturnType<typeof privateKeyToAccount> | null = null;
  private config: SperaxPluginConfig = {};

  constructor() {
    super();
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('Initializing Sperax Service...');
    
    // Get config from runtime settings
    const rpcUrl = runtime.getSetting('ARBITRUM_RPC_URL') as string || 'https://arb1.arbitrum.io/rpc';
    const privateKey = runtime.getSetting('SPERAX_PRIVATE_KEY') as string;
    
    this.config = { ARBITRUM_RPC_URL: rpcUrl, SPERAX_PRIVATE_KEY: privateKey };
    
    // Initialize public client (read-only)
    this.publicClient = createPublicClient({
      chain: arbitrum,
      transport: http(rpcUrl),
    });
    
    // Initialize wallet client if private key provided
    if (privateKey) {
      this.account = privateKeyToAccount(privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: arbitrum,
        transport: http(rpcUrl),
      });
      logger.info('Sperax Service initialized with wallet capabilities');
    } else {
      logger.info('Sperax Service initialized in read-only mode (no private key)');
    }
  }

  /**
   * Get USDs balance for an address
   */
  async getUSDsBalance(address: string): Promise<USDsBalance> {
    if (!this.publicClient) throw new Error('Service not initialized');
    
    const [balance, isOptedIn] = await Promise.all([
      this.publicClient.readContract({
        address: SPERAX_CONTRACTS.USDs,
        abi: USDS_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }),
      this.publicClient.readContract({
        address: SPERAX_CONTRACTS.USDs,
        abi: USDS_ABI,
        functionName: 'rebaseOptedIn',
        args: [address as `0x${string}`],
      }),
    ]);
    
    const formattedBalance = formatUnits(balance, 18);
    // Estimate 24h yield based on ~25% APY
    const estimatedYield = (parseFloat(formattedBalance) * 0.25 / 365).toFixed(4);
    
    return {
      balance,
      formattedBalance,
      isRebaseOptedIn: isOptedIn,
      estimatedYield24h: estimatedYield,
    };
  }

  /**
   * Get SPA and veSPA balance for an address
   */
  async getSPABalance(address: string): Promise<SPABalance> {
    if (!this.publicClient) throw new Error('Service not initialized');
    
    const [spaBalance, veSpBalance, locked] = await Promise.all([
      this.publicClient.readContract({
        address: SPERAX_CONTRACTS.SPA,
        abi: SPA_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }),
      this.publicClient.readContract({
        address: SPERAX_CONTRACTS.veSPA,
        abi: VESPA_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }),
      this.publicClient.readContract({
        address: SPERAX_CONTRACTS.veSPA,
        abi: VESPA_ABI,
        functionName: 'locked',
        args: [address as `0x${string}`],
      }),
    ]);
    
    return {
      spaBalance,
      formattedSpaBalance: formatUnits(spaBalance, 18),
      veSpBalance,
      formattedVeSpBalance: formatUnits(veSpBalance, 18),
      votingPower: formatUnits(veSpBalance, 18),
      lockEndTime: locked[1] > 0 ? Number(locked[1]) : null,
    };
  }

  /**
   * Get protocol-level information
   */
  async getProtocolInfo(): Promise<ProtocolInfo> {
    if (!this.publicClient) throw new Error('Service not initialized');
    
    const totalSupply = await this.publicClient.readContract({
      address: SPERAX_CONTRACTS.USDs,
      abi: USDS_ABI,
      functionName: 'totalSupply',
    });
    
    // Get collateral balances
    const collateralBalances = await Promise.all(
      Object.entries(COLLATERAL_TOKENS).map(async ([name, address]) => {
        const balance = await this.publicClient!.readContract({
          address: address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [SPERAX_CONTRACTS.Vault],
        });
        return { name, balance };
      })
    );
    
    const totalCollateral = collateralBalances.reduce((sum, { balance }) => sum + balance, 0n);
    
    return {
      totalSupply,
      formattedTotalSupply: formatUnits(totalSupply, 18),
      collateralRatio: totalCollateral > 0n ? ((totalCollateral * 100n) / totalSupply).toString() + '%' : '100%',
      currentAPY: '~25%', // This would ideally be fetched from a yield oracle
      rebaseFrequency: '~24 hours',
      collateralBreakdown: collateralBalances.map(({ name, balance }) => ({
        token: name,
        amount: balance,
        formattedAmount: formatUnits(balance, 6), // USDC/USDT have 6 decimals
        percentage: totalCollateral > 0n ? ((balance * 100n) / totalCollateral).toString() + '%' : '0%',
      })),
    };
  }

  /**
   * Mint USDs with collateral
   */
  async mintUSDs(params: MintParams): Promise<SperaxTxResult> {
    if (!this.walletClient || !this.account) {
      return { success: false, error: 'Wallet not configured. Set SPERAX_PRIVATE_KEY to enable transactions.' };
    }
    
    try {
      const collateralAddress = COLLATERAL_TOKENS[params.collateral];
      
      // Approve collateral spending first
      const approveHash = await this.walletClient.writeContract({
        address: collateralAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [SPERAX_CONTRACTS.Vault, params.amount],
      });
      
      await this.publicClient!.waitForTransactionReceipt({ hash: approveHash });
      
      // Mint USDs
      const mintHash = await this.walletClient.writeContract({
        address: SPERAX_CONTRACTS.Vault,
        abi: VAULT_ABI,
        functionName: 'mint',
        args: [collateralAddress, params.amount, params.minUSDsAmount, BigInt(params.deadline)],
      });
      
      const receipt = await this.publicClient!.waitForTransactionReceipt({ hash: mintHash });
      
      return {
        success: true,
        txHash: mintHash,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      logger.error('Mint USDs failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Redeem USDs for collateral
   */
  async redeemUSDs(params: RedeemParams): Promise<SperaxTxResult> {
    if (!this.walletClient || !this.account) {
      return { success: false, error: 'Wallet not configured. Set SPERAX_PRIVATE_KEY to enable transactions.' };
    }
    
    try {
      const collateralAddress = COLLATERAL_TOKENS[params.collateral];
      
      const redeemHash = await this.walletClient.writeContract({
        address: SPERAX_CONTRACTS.Vault,
        abi: VAULT_ABI,
        functionName: 'redeem',
        args: [collateralAddress, params.usdsAmount, params.minCollateralAmount, BigInt(params.deadline)],
      });
      
      const receipt = await this.publicClient!.waitForTransactionReceipt({ hash: redeemHash });
      
      return {
        success: true,
        txHash: redeemHash,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      logger.error('Redeem USDs failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Opt-in to USDs rebase (auto-yield)
   */
  async optInToRebase(): Promise<SperaxTxResult> {
    if (!this.walletClient || !this.account) {
      return { success: false, error: 'Wallet not configured. Set SPERAX_PRIVATE_KEY to enable transactions.' };
    }
    
    try {
      const hash = await this.walletClient.writeContract({
        address: SPERAX_CONTRACTS.USDs,
        abi: USDS_ABI,
        functionName: 'rebaseOptIn',
        args: [],
      });
      
      const receipt = await this.publicClient!.waitForTransactionReceipt({ hash });
      
      return {
        success: true,
        txHash: hash,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      logger.error('Rebase opt-in failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get quote for redeeming USDs
   */
  async getRedeemQuote(collateral: CollateralToken, usdsAmount: bigint): Promise<{
    collateralAmount: bigint;
    usdsBurnAmount: bigint;
    fee: bigint;
  }> {
    if (!this.publicClient) throw new Error('Service not initialized');
    
    const collateralAddress = COLLATERAL_TOKENS[collateral];
    
    const result = await this.publicClient.readContract({
      address: SPERAX_CONTRACTS.Vault,
      abi: VAULT_ABI,
      functionName: 'redeemView',
      args: [collateralAddress, usdsAmount],
    });
    
    return {
      collateralAmount: result[0],
      usdsBurnAmount: result[1],
      fee: result[2],
    };
  }

  /**
   * Get wallet address if configured
   */
  getWalletAddress(): string | null {
    return this.account?.address || null;
  }

  /**
   * Check if wallet is configured for write operations
   */
  hasWallet(): boolean {
    return this.walletClient !== null && this.account !== null;
  }
}

export default SperaxService;
