/**
 * Tests for Sperax Plugin
 */

import { describe, it, expect, mock } from 'bun:test';
import { speraxPlugin } from '../plugin';

// Mock @elizaos/core
mock.module('@elizaos/core', () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

describe('speraxPlugin', () => {
  it('should have correct name', () => {
    expect(speraxPlugin.name).toBe('plugin-sperax');
  });

  it('should have description', () => {
    expect(speraxPlugin.description).toBeDefined();
    expect(speraxPlugin.description.length).toBeGreaterThan(0);
    expect(speraxPlugin.description.toLowerCase()).toContain('sperax');
  });

  describe('config', () => {
    it('should define ARBITRUM_RPC_URL config', () => {
      expect(speraxPlugin.config).toHaveProperty('ARBITRUM_RPC_URL');
    });

    it('should define SPERAX_PRIVATE_KEY config', () => {
      expect(speraxPlugin.config).toHaveProperty('SPERAX_PRIVATE_KEY');
    });
  });

  describe('init', () => {
    it('should be a function', () => {
      expect(typeof speraxPlugin.init).toBe('function');
    });

    it('should initialize without errors with valid config', async () => {
      const config = {
        ARBITRUM_RPC_URL: 'https://arb1.arbitrum.io/rpc',
        SPERAX_PRIVATE_KEY: '0x' + '1'.repeat(64),
      };

      await expect(speraxPlugin.init!(config)).resolves.not.toThrow();
    });

    it('should initialize without errors with minimal config', async () => {
      const config = {};

      await expect(speraxPlugin.init!(config)).resolves.not.toThrow();
    });
  });

  describe('services', () => {
    it('should register SperaxService', () => {
      expect(speraxPlugin.services).toBeDefined();
      expect(Array.isArray(speraxPlugin.services)).toBe(true);
      expect(speraxPlugin.services!.length).toBeGreaterThan(0);
    });
  });

  describe('actions', () => {
    it('should register actions', () => {
      expect(speraxPlugin.actions).toBeDefined();
      expect(Array.isArray(speraxPlugin.actions)).toBe(true);
      expect(speraxPlugin.actions!.length).toBeGreaterThan(0);
    });

    it('should include balance check actions', () => {
      const actionNames = speraxPlugin.actions!.map((a: any) => a.name);
      expect(actionNames).toContain('SPERAX_GET_USDS_BALANCE');
      expect(actionNames).toContain('SPERAX_GET_SPA_BALANCE');
    });

    it('should include mint/redeem actions', () => {
      const actionNames = speraxPlugin.actions!.map((a: any) => a.name);
      expect(actionNames).toContain('SPERAX_MINT_USDS');
      expect(actionNames).toContain('SPERAX_REDEEM_USDS');
    });

    it('should include auto-yield action', () => {
      const actionNames = speraxPlugin.actions!.map((a: any) => a.name);
      expect(actionNames).toContain('SPERAX_ENABLE_AUTO_YIELD');
    });

    it('should include protocol info action', () => {
      const actionNames = speraxPlugin.actions!.map((a: any) => a.name);
      expect(actionNames).toContain('SPERAX_GET_PROTOCOL_INFO');
    });
  });

  describe('providers', () => {
    it('should register providers', () => {
      expect(speraxPlugin.providers).toBeDefined();
      expect(Array.isArray(speraxPlugin.providers)).toBe(true);
      expect(speraxPlugin.providers!.length).toBeGreaterThan(0);
    });

    it('should include portfolio provider', () => {
      const providerNames = speraxPlugin.providers!.map((p: any) => p.name);
      expect(providerNames).toContain('SPERAX_PORTFOLIO');
    });

    it('should include protocol provider', () => {
      const providerNames = speraxPlugin.providers!.map((p: any) => p.name);
      expect(providerNames).toContain('SPERAX_PROTOCOL');
    });
  });

  describe('events', () => {
    it('should have events property', () => {
      expect(speraxPlugin.events).toBeDefined();
    });
  });

  describe('routes', () => {
    it('should have routes property', () => {
      expect(speraxPlugin.routes).toBeDefined();
      expect(Array.isArray(speraxPlugin.routes)).toBe(true);
    });
  });
});

describe('Plugin Exports', () => {
  it('should export plugin as default', async () => {
    const module = await import('../index');
    expect(module.default).toBe(module.speraxPlugin);
  });

  it('should export speraxPlugin', async () => {
    const module = await import('../index');
    expect(module.speraxPlugin).toBeDefined();
    expect(module.speraxPlugin.name).toBe('plugin-sperax');
  });

  it('should export SperaxService', async () => {
    const module = await import('../index');
    expect(module.SperaxService).toBeDefined();
  });

  it('should export speraxActions', async () => {
    const module = await import('../index');
    expect(module.speraxActions).toBeDefined();
    expect(Array.isArray(module.speraxActions)).toBe(true);
  });

  it('should export speraxProviders', async () => {
    const module = await import('../index');
    expect(module.speraxProviders).toBeDefined();
    expect(Array.isArray(module.speraxProviders)).toBe(true);
  });
});
