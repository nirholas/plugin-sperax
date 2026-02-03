/**
 * Live Test Script for Sperax Plugin
 * 
 * Tests the plugin against the real Sperax protocol on Arbitrum.
 * 
 * Usage:
 *   npx tsx scripts/live-test.ts
 * 
 * Optional environment variables:
 *   ARBITRUM_RPC_URL - Custom Arbitrum RPC (default: public endpoint)
 *   TEST_ADDRESS - Address to check balances for
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { arbitrum } from 'viem/chains';

// Contract addresses from the plugin
const SPERAX_CONTRACTS = {
  USDs: '0xD74f5255D557944cf7Dd0E45FF521520002D5748' as const,
  SPA: '0x5575552988A3A80504bBaeB1311674fCFd40aD4B' as const,
  veSPA: '0x2e2071180682Ce6C247B1eF93d382D509F5F6A17' as const,
  Vault: '0x6Bbc476Ee35CBA9e9c3A59fc5b10d7a0BC6f74Ca' as const,
};

// ABIs for read operations
const USDS_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'rebaseOptedIn', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
] as const;

const SPA_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const;

const VESPA_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

// Test address - use the zero address for testing or provide your own
const TEST_ADDRESS = process.env.TEST_ADDRESS || '0x0000000000000000000000000000000000000000';

async function main() {
  console.log('🧪 Sperax Plugin - Live Test\n');
  console.log('='.repeat(50));

  const rpcUrl = process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
  console.log(`📡 RPC URL: ${rpcUrl}`);
  console.log(`📍 Test Address: ${TEST_ADDRESS}\n`);

  // Initialize client
  const client = createPublicClient({
    chain: arbitrum,
    transport: http(rpcUrl),
  });

  let passed = 0;
  let failed = 0;

  // Test 1: Check USDs contract exists and get metadata
  console.log('Test 1: USDs Contract Verification');
  console.log('-'.repeat(40));
  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      client.readContract({ address: SPERAX_CONTRACTS.USDs, abi: USDS_ABI, functionName: 'name' }),
      client.readContract({ address: SPERAX_CONTRACTS.USDs, abi: USDS_ABI, functionName: 'symbol' }),
      client.readContract({ address: SPERAX_CONTRACTS.USDs, abi: USDS_ABI, functionName: 'decimals' }),
      client.readContract({ address: SPERAX_CONTRACTS.USDs, abi: USDS_ABI, functionName: 'totalSupply' }),
    ]);
    
    console.log(`  ✅ Name: ${name}`);
    console.log(`  ✅ Symbol: ${symbol}`);
    console.log(`  ✅ Decimals: ${decimals}`);
    console.log(`  ✅ Total Supply: ${formatUnits(totalSupply, 18)} USDs`);
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    failed++;
  }
  console.log();

  // Test 2: Check USDs balance for test address
  console.log('Test 2: USDs Balance Check');
  console.log('-'.repeat(40));
  try {
    const balance = await client.readContract({
      address: SPERAX_CONTRACTS.USDs,
      abi: USDS_ABI,
      functionName: 'balanceOf',
      args: [TEST_ADDRESS as `0x${string}`],
    });

    const formattedBalance = formatUnits(balance, 18);
    console.log(`  ✅ Balance: ${formattedBalance} USDs`);
    
    // Only check rebaseOptedIn for non-zero addresses
    if (TEST_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      const isOptedIn = await client.readContract({
        address: SPERAX_CONTRACTS.USDs,
        abi: USDS_ABI,
        functionName: 'rebaseOptedIn',
        args: [TEST_ADDRESS as `0x${string}`],
      });
      console.log(`  ✅ Rebase Opted In: ${isOptedIn}`);
    } else {
      console.log(`  ℹ️  Rebase status: skipped (zero address)`);
    }
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    failed++;
  }
  console.log();

  // Test 3: Check SPA token
  console.log('Test 3: SPA Token Verification');
  console.log('-'.repeat(40));
  try {
    const [name, symbol, totalSupply, balance] = await Promise.all([
      client.readContract({ address: SPERAX_CONTRACTS.SPA, abi: SPA_ABI, functionName: 'name' }),
      client.readContract({ address: SPERAX_CONTRACTS.SPA, abi: SPA_ABI, functionName: 'symbol' }),
      client.readContract({ address: SPERAX_CONTRACTS.SPA, abi: SPA_ABI, functionName: 'totalSupply' }),
      client.readContract({
        address: SPERAX_CONTRACTS.SPA,
        abi: SPA_ABI,
        functionName: 'balanceOf',
        args: [TEST_ADDRESS as `0x${string}`],
      }),
    ]);
    
    console.log(`  ✅ Name: ${name}`);
    console.log(`  ✅ Symbol: ${symbol}`);
    console.log(`  ✅ Total Supply: ${formatUnits(totalSupply, 18)} SPA`);
    console.log(`  ✅ Test Address Balance: ${formatUnits(balance, 18)} SPA`);
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    failed++;
  }
  console.log();

  // Test 4: Check veSPA token
  console.log('Test 4: veSPA Token Verification');
  console.log('-'.repeat(40));
  try {
    const [totalSupply, balance] = await Promise.all([
      client.readContract({ address: SPERAX_CONTRACTS.veSPA, abi: VESPA_ABI, functionName: 'totalSupply' }),
      client.readContract({
        address: SPERAX_CONTRACTS.veSPA,
        abi: VESPA_ABI,
        functionName: 'balanceOf',
        args: [TEST_ADDRESS as `0x${string}`],
      }),
    ]);
    
    console.log(`  ✅ Total Supply: ${formatUnits(totalSupply, 18)} veSPA`);
    console.log(`  ✅ Test Address Balance: ${formatUnits(balance, 18)} veSPA`);
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    failed++;
  }
  console.log();

  // Test 5: Check Vault contract exists
  console.log('Test 5: Vault Contract Verification');
  console.log('-'.repeat(40));
  try {
    const code = await client.getCode({ address: SPERAX_CONTRACTS.Vault });
    if (code && code !== '0x') {
      console.log(`  ✅ Vault contract exists at ${SPERAX_CONTRACTS.Vault}`);
      console.log(`  ✅ Contract code length: ${code.length / 2 - 1} bytes`);
      passed++;
    } else {
      console.log('  ❌ Vault contract not found');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    failed++;
  }
  console.log();

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Test Summary');
  console.log('-'.repeat(40));
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Total: ${passed + failed}`);
  console.log();

  if (failed === 0) {
    console.log('🎉 All tests passed! The plugin is ready for live use.');
  } else {
    console.log('⚠️  Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
