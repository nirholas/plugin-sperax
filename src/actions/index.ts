/**
 * Sperax Actions - User command handlers for Sperax Protocol
 */

import type {
  Action,
  ActionResult,
  HandlerCallback,
  HandlerOptions,
  IAgentRuntime,
  Memory,
  State,
} from '@elizaos/core';
import { parseUnits, formatUnits } from 'viem';
import { SperaxService } from '../services/SperaxService';
import type { CollateralToken } from '../types';
import { COLLATERAL_TOKENS } from '../types';

// Helper to safely call callback
const safeCallback = async (callback: HandlerCallback | undefined, data: Parameters<HandlerCallback>[0]) => {
  if (callback) await callback(data);
};

/**
 * Get USDs Balance Action
 * Allows users to check their USDs stablecoin balance and yield status
 */
export const getUSDsBalanceAction: Action = {
  name: 'SPERAX_GET_USDS_BALANCE',
  description: 'Get USDs stablecoin balance for an address on Arbitrum. Shows balance, auto-yield status, and estimated daily yield.',
  similes: [
    'check usds balance',
    'how much usds do i have',
    'usds holdings',
    'my sperax balance',
    'show usds',
  ],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return (
      text.includes('usds') ||
      text.includes('sperax') ||
      (text.includes('balance') && text.includes('stable'))
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const service = runtime.getService<SperaxService>('sperax');
      if (!service) {
        throw new Error('Sperax service not available');
      }

      // Extract address from message or use configured wallet
      const text = message.content.text || '';
      const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
      const address = addressMatch?.[0] || service.getWalletAddress();

      if (!address) {
        await safeCallback(callback, {
          text: 'Please provide an Ethereum address to check, or configure SPERAX_PRIVATE_KEY to check your own balance.',
          action: 'SPERAX_GET_USDS_BALANCE',
        });
        return { success: false, error: 'No address provided' };
      }

      const balance = await service.getUSDsBalance(address);

      const responseText = `
**USDs Balance for ${address.slice(0, 6)}...${address.slice(-4)}**

💰 **Balance:** ${parseFloat(balance.formattedBalance).toLocaleString()} USDs
${balance.isRebaseOptedIn ? '✅' : '❌'} **Auto-Yield:** ${balance.isRebaseOptedIn ? 'Enabled' : 'Disabled'}
📈 **Est. Daily Yield:** ~${balance.estimatedYield24h} USDs

${!balance.isRebaseOptedIn ? '_Tip: Enable auto-yield to earn passive income on your USDs!_' : ''}
      `.trim();

      await safeCallback(callback, {
        text: responseText,
        action: 'SPERAX_GET_USDS_BALANCE',
      });

      return {
        success: true,
        text: responseText,
        values: {
          address,
          balance: balance.formattedBalance,
          isRebaseOptedIn: balance.isRebaseOptedIn,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await safeCallback(callback, {
        text: `Failed to get USDs balance: ${errorMsg}`,
        action: 'SPERAX_GET_USDS_BALANCE',
      });
      return { success: false, error: errorMsg };
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: 'What is my USDs balance?' } },
      { name: '{{name2}}', content: { text: 'Let me check your USDs balance on Arbitrum...', actions: ['SPERAX_GET_USDS_BALANCE'] } },
    ],
    [
      { name: '{{name1}}', content: { text: 'Check USDs for 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD95' } },
      { name: '{{name2}}', content: { text: 'Checking USDs balance for that address...', actions: ['SPERAX_GET_USDS_BALANCE'] } },
    ],
  ],
};

/**
 * Get SPA/veSPA Balance Action
 */
export const getSPABalanceAction: Action = {
  name: 'SPERAX_GET_SPA_BALANCE',
  description: 'Get SPA governance token and veSPA voting power balance for an address',
  similes: [
    'check spa balance',
    'how much spa do i have',
    'vespa balance',
    'voting power',
    'spa holdings',
  ],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('spa') || text.includes('vespa') || text.includes('voting power');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const service = runtime.getService<SperaxService>('sperax');
      if (!service) {
        throw new Error('Sperax service not available');
      }

      const text = message.content.text || '';
      const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
      const address = addressMatch?.[0] || service.getWalletAddress();

      if (!address) {
        await safeCallback(callback, {
          text: 'Please provide an Ethereum address to check.',
          action: 'SPERAX_GET_SPA_BALANCE',
        });
        return { success: false, error: 'No address provided' };
      }

      const balance = await service.getSPABalance(address);

      const lockEndDate = balance.lockEndTime
        ? new Date(balance.lockEndTime * 1000).toLocaleDateString()
        : 'N/A';

      const responseText = `
**SPA/veSPA Balance for ${address.slice(0, 6)}...${address.slice(-4)}**

🪙 **SPA Balance:** ${parseFloat(balance.formattedSpaBalance).toLocaleString()} SPA
🗳️ **veSPA (Voting Power):** ${parseFloat(balance.formattedVeSpBalance).toLocaleString()} veSPA
🔒 **Lock End Date:** ${lockEndDate}

_Stake SPA to earn veSPA and participate in governance!_
      `.trim();

      await safeCallback(callback, {
        text: responseText,
        action: 'SPERAX_GET_SPA_BALANCE',
      });

      return {
        success: true,
        text: responseText,
        values: {
          address,
          spaBalance: balance.formattedSpaBalance,
          veSpBalance: balance.formattedVeSpBalance,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await safeCallback(callback, {
        text: `Failed to get SPA balance: ${errorMsg}`,
        action: 'SPERAX_GET_SPA_BALANCE',
      });
      return { success: false, error: errorMsg };
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: 'What is my SPA and veSPA balance?' } },
      { name: '{{name2}}', content: { text: 'Checking your SPA governance token balance...', actions: ['SPERAX_GET_SPA_BALANCE'] } },
    ],
  ],
};

/**
 * Get Protocol Info Action
 */
export const getProtocolInfoAction: Action = {
  name: 'SPERAX_GET_PROTOCOL_INFO',
  description: 'Get Sperax protocol information including total supply, collateral ratio, and current APY',
  similes: [
    'sperax protocol info',
    'usds stats',
    'protocol statistics',
    'sperax tvl',
    'collateral ratio',
    'usds apy',
  ],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return (
      (text.includes('sperax') && (text.includes('info') || text.includes('stats') || text.includes('protocol'))) ||
      (text.includes('usds') && (text.includes('apy') || text.includes('yield') || text.includes('tvl'))) ||
      text.includes('collateral ratio')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const service = runtime.getService<SperaxService>('sperax');
      if (!service) {
        throw new Error('Sperax service not available');
      }

      const info = await service.getProtocolInfo();

      const collateralList = info.collateralBreakdown
        .map((c) => `  • ${c.token}: ${parseFloat(c.formattedAmount).toLocaleString()} (${c.percentage})`)
        .join('\n');

      const responseText = `
**Sperax Protocol Stats**

📊 **Total USDs Supply:** ${parseFloat(info.formattedTotalSupply).toLocaleString()} USDs
🏦 **Collateral Ratio:** ${info.collateralRatio}
💰 **Current APY:** ${info.currentAPY}
⏱️ **Rebase Frequency:** ${info.rebaseFrequency}

**Collateral Breakdown:**
${collateralList}

_USDs is 100% backed by stablecoins on Arbitrum_
      `.trim();

      await safeCallback(callback, {
        text: responseText,
        action: 'SPERAX_GET_PROTOCOL_INFO',
      });

      return {
        success: true,
        text: responseText,
        values: {
          totalSupply: info.formattedTotalSupply,
          collateralRatio: info.collateralRatio,
          apy: info.currentAPY,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await safeCallback(callback, {
        text: `Failed to get protocol info: ${errorMsg}`,
        action: 'SPERAX_GET_PROTOCOL_INFO',
      });
      return { success: false, error: errorMsg };
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: 'What is the current Sperax protocol stats?' } },
      { name: '{{name2}}', content: { text: 'Let me fetch the latest Sperax protocol information...', actions: ['SPERAX_GET_PROTOCOL_INFO'] } },
    ],
    [
      { name: '{{name1}}', content: { text: 'What APY does USDs offer?' } },
      { name: '{{name2}}', content: { text: 'Checking current USDs yield rates...', actions: ['SPERAX_GET_PROTOCOL_INFO'] } },
    ],
  ],
};

/**
 * Mint USDs Action
 */
export const mintUSDsAction: Action = {
  name: 'SPERAX_MINT_USDS',
  description: 'Mint USDs stablecoin by depositing collateral (USDC, USDC.e, or USDT)',
  similes: [
    'mint usds',
    'deposit to sperax',
    'get usds',
    'convert to usds',
    'buy usds',
  ],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return (
      (text.includes('mint') && text.includes('usds')) ||
      (text.includes('deposit') && text.includes('sperax')) ||
      (text.includes('convert') && text.includes('usds'))
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const service = runtime.getService<SperaxService>('sperax');
      if (!service) {
        throw new Error('Sperax service not available');
      }

      if (!service.hasWallet()) {
        await safeCallback(callback, {
          text: 'Minting requires a configured wallet. Please set SPERAX_PRIVATE_KEY in your environment.',
          action: 'SPERAX_MINT_USDS',
        });
        return { success: false, error: 'Wallet not configured' };
      }

      const text = message.content.text || '';
      
      // Parse amount and collateral type
      const amountMatch = text.match(/(\d+(?:\.\d+)?)/);  
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
      
      let collateral: CollateralToken = 'USDC';
      if (text.toLowerCase().includes('usdt')) collateral = 'USDT';
      else if (text.toLowerCase().includes('usdc.e')) collateral = 'USDC.e';

      if (!amount) {
        await safeCallback(callback, {
          text: 'Please specify an amount to mint. Example: "mint 100 USDs with USDC"',
          action: 'SPERAX_MINT_USDS',
        });
        return { success: false, error: 'No amount specified' };
      }

      const result = await service.mintUSDs({
        collateral,
        amount: parseUnits(amount.toString(), 6), // USDC/USDT have 6 decimals
        minUSDsAmount: parseUnits((amount * 0.99).toString(), 18), // 1% slippage
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      });

      if (result.success) {
        await safeCallback(callback, {
          text: `✅ Successfully minted USDs!\n\n💰 Amount: ${amount} USDs\n📝 Collateral: ${collateral}\n🔗 Tx: ${result.txHash}`,
          action: 'SPERAX_MINT_USDS',
        });
        return { success: true, text: `Minted ${amount} USDs`, values: { txHash: result.txHash } };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await safeCallback(callback, {
        text: `Failed to mint USDs: ${errorMsg}`,
        action: 'SPERAX_MINT_USDS',
      });
      return { success: false, error: errorMsg };
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: 'Mint 100 USDs with USDC' } },
      { name: '{{name2}}', content: { text: 'Minting 100 USDs using your USDC collateral...', actions: ['SPERAX_MINT_USDS'] } },
    ],
  ],
};

/**
 * Redeem USDs Action
 */
export const redeemUSDsAction: Action = {
  name: 'SPERAX_REDEEM_USDS',
  description: 'Redeem USDs for underlying collateral (USDC, USDC.e, or USDT)',
  similes: [
    'redeem usds',
    'withdraw from sperax',
    'convert usds',
    'cash out usds',
    'sell usds',
  ],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return (
      (text.includes('redeem') && text.includes('usds')) ||
      (text.includes('withdraw') && text.includes('usds')) ||
      (text.includes('cash out') && text.includes('usds'))
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const service = runtime.getService<SperaxService>('sperax');
      if (!service) {
        throw new Error('Sperax service not available');
      }

      if (!service.hasWallet()) {
        await safeCallback(callback, {
          text: 'Redeeming requires a configured wallet. Please set SPERAX_PRIVATE_KEY in your environment.',
          action: 'SPERAX_REDEEM_USDS',
        });
        return { success: false, error: 'Wallet not configured' };
      }

      const text = message.content.text || '';
      
      const amountMatch = text.match(/(\d+(?:\.\d+)?)/);  
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
      
      let collateral: CollateralToken = 'USDC';
      if (text.toLowerCase().includes('usdt')) collateral = 'USDT';
      else if (text.toLowerCase().includes('usdc.e')) collateral = 'USDC.e';

      if (!amount) {
        await safeCallback(callback, {
          text: 'Please specify an amount to redeem. Example: "redeem 100 USDs for USDC"',
          action: 'SPERAX_REDEEM_USDS',
        });
        return { success: false, error: 'No amount specified' };
      }

      // Get quote first
      const quote = await service.getRedeemQuote(collateral, parseUnits(amount.toString(), 18));
      
      const result = await service.redeemUSDs({
        collateral,
        usdsAmount: parseUnits(amount.toString(), 18),
        minCollateralAmount: quote.collateralAmount * 99n / 100n, // 1% slippage
        deadline: Math.floor(Date.now() / 1000) + 3600,
      });

      if (result.success) {
        const receivedAmount = formatUnits(quote.collateralAmount, 6);
        await safeCallback(callback, {
          text: `✅ Successfully redeemed USDs!\n\n💰 Redeemed: ${amount} USDs\n💵 Received: ~${receivedAmount} ${collateral}\n📝 Fee: ${formatUnits(quote.fee, 18)} USDs\n🔗 Tx: ${result.txHash}`,
          action: 'SPERAX_REDEEM_USDS',
        });
        return { success: true, text: `Redeemed ${amount} USDs`, values: { txHash: result.txHash } };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await safeCallback(callback, {
        text: `Failed to redeem USDs: ${errorMsg}`,
        action: 'SPERAX_REDEEM_USDS',
      });
      return { success: false, error: errorMsg };
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: 'Redeem 50 USDs for USDC' } },
      { name: '{{name2}}', content: { text: 'Redeeming 50 USDs for USDC collateral...', actions: ['SPERAX_REDEEM_USDS'] } },
    ],
  ],
};

/**
 * Opt-in to Rebase Action
 */
export const optInRebaseAction: Action = {
  name: 'SPERAX_OPT_IN_REBASE',
  description: 'Enable auto-yield (rebase) for USDs holdings to earn passive income',
  similes: [
    'enable auto yield',
    'opt in rebase',
    'enable usds yield',
    'start earning on usds',
    'activate auto-yield',
  ],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return (
      (text.includes('opt') && text.includes('rebase')) ||
      (text.includes('enable') && (text.includes('yield') || text.includes('auto'))) ||
      (text.includes('activate') && text.includes('yield'))
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: HandlerOptions | undefined,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const service = runtime.getService<SperaxService>('sperax');
      if (!service) {
        throw new Error('Sperax service not available');
      }

      if (!service.hasWallet()) {
        await safeCallback(callback, {
          text: 'Opting in to rebase requires a configured wallet. Please set SPERAX_PRIVATE_KEY.',
          action: 'SPERAX_OPT_IN_REBASE',
        });
        return { success: false, error: 'Wallet not configured' };
      }

      const result = await service.optInToRebase();

      if (result.success) {
        await safeCallback(callback, {
          text: `✅ Successfully opted in to USDs auto-yield!\n\nYour USDs balance will now automatically grow every ~24 hours.\n🔗 Tx: ${result.txHash}`,
          action: 'SPERAX_OPT_IN_REBASE',
        });
        return { success: true, text: 'Opted in to rebase', values: { txHash: result.txHash } };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await safeCallback(callback, {
        text: `Failed to opt in to rebase: ${errorMsg}`,
        action: 'SPERAX_OPT_IN_REBASE',
      });
      return { success: false, error: errorMsg };
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: 'Enable auto-yield for my USDs' } },
      { name: '{{name2}}', content: { text: 'Enabling auto-yield on your USDs holdings...', actions: ['SPERAX_OPT_IN_REBASE'] } },
    ],
  ],
};

// Export all actions
export const speraxActions = [
  getUSDsBalanceAction,
  getSPABalanceAction,
  getProtocolInfoAction,
  mintUSDsAction,
  redeemUSDsAction,
  optInRebaseAction,
];
