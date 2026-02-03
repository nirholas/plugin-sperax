/**
 * Sperax Protocol Type Definitions
 * Arbitrum-based DeFi protocol with USDs stablecoin and SPA governance
 */

// Contract Addresses on Arbitrum One (EIP-55 checksummed)
// Verified against: https://docs.sperax.io/contract-addresses
export const SPERAX_CONTRACTS = {
  // Core Protocol
  USDs: '0xD74f5255D557944cf7Dd0E45FF521520002D5748' as const,
  SPA: '0x5575552988A3A80504bBaeB1311674fCFd40aD4B' as const,
  veSPA: '0x2e2071180682Ce6C247B1eF93d382D509F5F6A17' as const,
  
  // Vault & Collateral  
  Vault: '0x6Bbc476Ee35CBA9e9c3A59fc5b10d7a0BC6f74Ca' as const,
} as const;

// Supported Collateral Tokens
export const COLLATERAL_TOKENS = {
  USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const,
  'USDC.e': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' as const,
  USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as const,
} as const;

export type CollateralToken = keyof typeof COLLATERAL_TOKENS;

// USDs Balance Response
export interface USDsBalance {
  balance: bigint;
  formattedBalance: string;
  isRebaseOptedIn: boolean;
  estimatedYield24h: string;
}

// SPA/veSPA Balance Response
export interface SPABalance {
  spaBalance: bigint;
  formattedSpaBalance: string;
  veSpBalance: bigint;
  formattedVeSpBalance: string;
  votingPower: string;
  lockEndTime: number | null;
}

// Protocol Info
export interface ProtocolInfo {
  totalSupply: bigint;
  formattedTotalSupply: string;
  collateralRatio: string;
  currentAPY: string;
  rebaseFrequency: string;
  collateralBreakdown: CollateralBreakdown[];
}

export interface CollateralBreakdown {
  token: string;
  amount: bigint;
  formattedAmount: string;
  percentage: string;
}

// Mint/Redeem Parameters
export interface MintParams {
  collateral: CollateralToken;
  amount: bigint;
  minUSDsAmount: bigint;
  deadline: number;
}

export interface RedeemParams {
  collateral: CollateralToken;
  usdsAmount: bigint;
  minCollateralAmount: bigint;
  deadline: number;
  strategy?: string;
}

// Transaction Result
export interface SperaxTxResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: bigint;
}

// Yield Strategy Info
export interface YieldStrategy {
  name: string;
  protocol: string;
  collateral: CollateralToken;
  apy: string;
  tvl: string;
  allocation: string;
}

// Rebase Info
export interface RebaseInfo {
  lastRebaseTime: number;
  nextRebaseAvailable: boolean;
  pendingYield: string;
  totalYieldDistributed: string;
}

// Plugin Configuration - extends Metadata interface from @elizaos/core
export interface SperaxPluginConfig {
  ARBITRUM_RPC_URL?: string;
  SPERAX_PRIVATE_KEY?: string;
  [key: string]: string | undefined;
}
