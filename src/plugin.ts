/**
 * @elizaos/plugin-sperax
 * 
 * Sperax DeFi Plugin for ElizaOS
 * Enables AI agents to interact with Sperax Protocol on Arbitrum
 * 
 * Features:
 * - USDs stablecoin operations (mint, redeem, balance)
 * - SPA/veSPA governance token management
 * - Auto-yield (rebase) control
 * - Protocol analytics and stats
 */

import type { Plugin } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { z } from 'zod';

// Import components
import { SperaxService } from './services/SperaxService';
import { speraxActions } from './actions';
import { speraxProviders } from './providers';

/**
 * Configuration schema for the Sperax plugin
 */
const configSchema = z.object({
  ARBITRUM_RPC_URL: z
    .string()
    .url()
    .optional()
    .default('https://arb1.arbitrum.io/rpc')
    .describe('Arbitrum One RPC endpoint URL'),
  SPERAX_PRIVATE_KEY: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional()
    .describe('Private key for signing Sperax transactions (optional)'),
});

/**
 * Sperax Plugin for ElizaOS
 * 
 * Provides AI agents with the ability to:
 * - Check USDs and SPA/veSPA balances
 * - Mint and redeem USDs stablecoins
 * - Enable auto-yield on USDs holdings
 * - Query protocol statistics and yield info
 * - Participate in Sperax governance
 */
export const speraxPlugin: Plugin = {
  name: 'plugin-sperax',
  description: 'Sperax DeFi plugin for ElizaOS - USDs stablecoin, SPA governance, and yield farming on Arbitrum',

  // Configuration mapping
  config: {
    ARBITRUM_RPC_URL: process.env.ARBITRUM_RPC_URL,
    SPERAX_PRIVATE_KEY: process.env.SPERAX_PRIVATE_KEY,
  },

  /**
   * Initialize the Sperax plugin
   */
  async init(config: Record<string, string>) {
    logger.info('Initializing Sperax plugin...');

    // Validate configuration
    try {
      const validatedConfig = configSchema.parse({
        ARBITRUM_RPC_URL: config.ARBITRUM_RPC_URL,
        SPERAX_PRIVATE_KEY: config.SPERAX_PRIVATE_KEY,
      });

      logger.info('Sperax plugin configuration validated');
      logger.info(`RPC: ${validatedConfig.ARBITRUM_RPC_URL}`);
      logger.info(`Wallet: ${validatedConfig.SPERAX_PRIVATE_KEY ? 'Configured' : 'Read-only mode'}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`Sperax plugin config validation warnings: ${JSON.stringify(error.errors)}`);
      }
    }

    logger.info('Sperax plugin initialized successfully');
  },

  // Register services
  services: [SperaxService],

  // Register actions
  actions: speraxActions,

  // Register providers
  providers: speraxProviders,

  // Event handlers (optional)
  events: {},

  // Routes (optional - for custom API endpoints)
  routes: [],
};

// Default export
export default speraxPlugin;

// Named exports for external use
export { SperaxService } from './services/SperaxService';
export { speraxActions } from './actions';
export { speraxProviders } from './providers';
export * from './types';
