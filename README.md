# @elizaos/plugin-sperax

Sperax DeFi Plugin for ElizaOS - Enables AI agents to interact with the Sperax Protocol on Arbitrum.

## Features

- **USDs Stablecoin Operations**
  - Check USDs balance and auto-yield status
  - Mint USDs with USDC, USDC.e, or USDT collateral
  - Redeem USDs for underlying collateral
  - Enable auto-yield (rebase) for passive income

- **SPA/veSPA Governance**
  - Check SPA token balance
  - View veSPA voting power
  - Track lock end dates

- **Protocol Analytics**
  - Total USDs supply and collateral ratio
  - Current APY and yield strategies
  - Collateral breakdown

## Installation

```bash
# Using elizaos CLI
elizaos plugins add @elizaos/plugin-sperax

# Or manually
npm install @elizaos/plugin-sperax
```

## Configuration

Add to your character's plugins array:

```typescript
import { speraxPlugin } from '@elizaos/plugin-sperax';

const character = {
  name: 'MyAgent',
  plugins: [speraxPlugin],
  // ... other config
};
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ARBITRUM_RPC_URL` | No | Arbitrum One RPC endpoint (default: public RPC) |
| `SPERAX_PRIVATE_KEY` | No | Private key for write operations (mint/redeem) |

## Usage

### Actions

The plugin provides the following actions:

| Action | Description | Example Prompt |
|--------|-------------|----------------|
| `SPERAX_GET_USDS_BALANCE` | Check USDs balance | "What is my USDs balance?" |
| `SPERAX_GET_SPA_BALANCE` | Check SPA/veSPA balance | "How much SPA do I have?" |
| `SPERAX_GET_PROTOCOL_INFO` | Get protocol stats | "What is the current USDs APY?" |
| `SPERAX_MINT_USDS` | Mint USDs with collateral | "Mint 100 USDs with USDC" |
| `SPERAX_REDEEM_USDS` | Redeem USDs for collateral | "Redeem 50 USDs for USDT" |
| `SPERAX_OPT_IN_REBASE` | Enable auto-yield | "Enable auto-yield for my USDs" |

### Providers

| Provider | Description |
|----------|-------------|
| `SPERAX_PORTFOLIO` | Current wallet's Sperax holdings |
| `SPERAX_PROTOCOL` | Live protocol statistics |
| `SPERAX_KNOWLEDGE` | Static knowledge about Sperax |

## About Sperax Protocol

[Sperax](https://sperax.io) is a DeFi protocol on Arbitrum featuring:

- **USDs**: Auto-yield stablecoin backed 100% by USDC, USDC.e, and USDT
- **SPA**: Governance token for Sperax DAO
- **veSPA**: Vote-escrowed SPA for governance participation
- **Demeter**: No-code liquidity farm toolkit

### Key Contracts (Arbitrum, Binance Smart Chain / BNB Chain)

| Contract | Blockchain | Contract Address |
|----------|------------|------------------|
| SPA | BNB Chain | `0x1A9Fd6eC3144Da3Dd6Ea13Ec1C25C58423a379b1` |
| USDs | Arbitrum | `0xD74f5255D557944cf7Dd0E45FF521520002D5748` |
| SPA | Arbitrum | `0x5575552988A3A80504bBaeB1311674fCFd40aD4B` |
| veSPA | Arbitrum | `0x2e2071180682Ce6C247B1eF93d382D509F5F6A17` |
| Vault | Arbitrum | `0x6Bbc476Ee35CBA9e9c3A59fc5b10d7a0BC6f74Ca` |
| SPA | Ethereum | `0xB4A3B0Faf0Ab53df58001804DdA5Bfc6a3D59008` |


## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Run tests
bun test

# E2E tests
elizaos test --type e2e
```

## License

MIT

## Links

- [Sperax Website](https://sperax.io)
- [Sperax Docs](https://docs.sperax.io)
- [Sperax App](https://app.sperax.io)
- [ElizaOS](https://elizaos.ai)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=nirholas/plugin-sperax&type=Date)](https://star-history.com/#nirholas/plugin-sperax&Date)
