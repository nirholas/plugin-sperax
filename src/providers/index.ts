/**
 * Sperax Providers - Context suppliers for agent state
 */

import type {
  Provider,
  ProviderResult,
  IAgentRuntime,
  Memory,
  State,
} from '@elizaos/core';
import { SperaxService } from '../services/SperaxService';

/**
 * Sperax Portfolio Provider
 * Provides the agent with current Sperax portfolio context
 */
export const speraxPortfolioProvider: Provider = {
  name: 'SPERAX_PORTFOLIO',
  description: 'Current Sperax portfolio including USDs balance, SPA holdings, and yield status',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined
  ): Promise<ProviderResult> => {
    try {
      const service = runtime.getService<SperaxService>('sperax');
      if (!service) {
        return {
          text: 'Sperax service not available',
          values: {},
          data: {},
        };
      }

      const walletAddress = service.getWalletAddress();
      if (!walletAddress) {
        return {
          text: 'No Sperax wallet configured. Set SPERAX_PRIVATE_KEY to enable portfolio tracking.',
          values: { hasWallet: false },
          data: {},
        };
      }

      const [usdsBalance, spaBalance] = await Promise.all([
        service.getUSDsBalance(walletAddress),
        service.getSPABalance(walletAddress),
      ]);

      const portfolioText = `
Sperax Portfolio for ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}:
- USDs Balance: ${usdsBalance.formattedBalance} USDs
- Auto-Yield: ${usdsBalance.isRebaseOptedIn ? 'Enabled' : 'Disabled'}
- Est. Daily Yield: ${usdsBalance.estimatedYield24h} USDs
- SPA Balance: ${spaBalance.formattedSpaBalance} SPA
- veSPA (Voting Power): ${spaBalance.formattedVeSpBalance} veSPA
      `.trim();

      return {
        text: portfolioText,
        values: {
          hasWallet: true,
          walletAddress,
          usdsBalance: usdsBalance.formattedBalance,
          spaBalance: spaBalance.formattedSpaBalance,
          veSpBalance: spaBalance.formattedVeSpBalance,
          isRebaseOptedIn: usdsBalance.isRebaseOptedIn,
        },
        data: {
          usds: usdsBalance,
          spa: spaBalance,
        },
      };
    } catch (error) {
      return {
        text: `Error fetching Sperax portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`,
        values: { error: true },
        data: {},
      };
    }
  },
};

/**
 * Sperax Protocol Provider
 * Provides current protocol state and statistics
 */
export const speraxProtocolProvider: Provider = {
  name: 'SPERAX_PROTOCOL',
  description: 'Current Sperax protocol statistics including TVL, APY, and collateral info',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined
  ): Promise<ProviderResult> => {
    try {
      const service = runtime.getService<SperaxService>('sperax');
      if (!service) {
        return {
          text: 'Sperax service not available',
          values: {},
          data: {},
        };
      }

      const protocolInfo = await service.getProtocolInfo();

      const protocolText = `
Sperax Protocol Status:
- Total USDs Supply: ${protocolInfo.formattedTotalSupply} USDs
- Collateral Ratio: ${protocolInfo.collateralRatio}
- Current APY: ${protocolInfo.currentAPY}
- Rebase Frequency: ${protocolInfo.rebaseFrequency}
- Collateral: ${protocolInfo.collateralBreakdown.map(c => `${c.token}: ${c.percentage}`).join(', ')}
      `.trim();

      return {
        text: protocolText,
        values: {
          totalSupply: protocolInfo.formattedTotalSupply,
          collateralRatio: protocolInfo.collateralRatio,
          apy: protocolInfo.currentAPY,
        },
        data: {
          protocolInfo,
        },
      };
    } catch (error) {
      return {
        text: `Error fetching Sperax protocol info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        values: { error: true },
        data: {},
      };
    }
  },
};

/**
 * Sperax Knowledge Provider
 * Provides static knowledge about the Sperax protocol
 */
export const speraxKnowledgeProvider: Provider = {
  name: 'SPERAX_KNOWLEDGE',
  description: 'Knowledge base about Sperax protocol, USDs stablecoin, and DeFi operations',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined
  ): Promise<ProviderResult> => {
    const knowledgeText = `
About Sperax Protocol:

Sperax is a DeFi protocol on Arbitrum offering:

1. **USDs Stablecoin**
   - Auto-yield stablecoin (no staking required)
   - 100% backed by USDC, USDC.e, and USDT
   - ~25% APY distributed every ~24 hours via rebase
   - Smart contracts can opt-in to receive auto-yield

2. **SPA Token**
   - Governance token for Sperax DAO
   - Stake SPA to receive veSPA voting power
   - veSPA holders earn staking rewards and control protocol parameters

3. **Demeter**
   - No-code toolkit for DAOs to deploy liquidity farms
   - Works across major DEXs on Arbitrum

4. **Key Operations**
   - Mint USDs: Deposit collateral (USDC/USDT) to receive USDs
   - Redeem USDs: Exchange USDs back for collateral
   - Opt-in to Rebase: Enable auto-yield for smart contracts

5. **Contract Addresses (Arbitrum)**
   - USDs: 0xD74f5255D557944cf7Dd0E45FF521520002D5748
   - SPA: 0x5575552988A3A80504bBaeB1311674fCFd40aD4B
   - veSPA: 0x2e2071180682Ce6C247B1eF93d382D509F5F6A17
    `.trim();

    return {
      text: knowledgeText,
      values: {
        protocol: 'Sperax',
        chain: 'Arbitrum',
        products: ['USDs', 'SPA', 'veSPA', 'Demeter'],
      },
      data: {
        contracts: {
          USDs: '0xD74f5255D557944cf7Dd0E45FF521520002D5748',
          SPA: '0x5575552988A3A80504bBaeB1311674fCFd40aD4B',
          veSPA: '0x2e2071180682Ce6C247B1eF93d382D509F5F6A17',
        },
      },
    };
  },
};

// Export all providers
export const speraxProviders = [
  speraxPortfolioProvider,
  speraxProtocolProvider,
  speraxKnowledgeProvider,
];
