/**
 * @elizaos/plugin-sperax
 * 
 * Main entry point for the Sperax DeFi plugin
 */

// Export the plugin
export { speraxPlugin, speraxPlugin as default } from './plugin';

// Export components for direct use
export { SperaxService } from './services';
export { speraxActions } from './actions';
export { speraxProviders } from './providers';

// Export types
export * from './types';
