# Lovepay

Lovepay is a permissionless USDC payment gateway. Merchants register their business onchain, create payment links, invoices and QR codes, and receive USDC directly in their own wallet. There is no platform fee, no subscription and no KYC.

Built with [Arc Studio](https://studio.arc.io)

Live app: https://lovepayyy.xyz
X: https://x.com/lovepayyy

## What you can do

- **Register a business** with a name, contact email, business type and optional social links.
- **Payment links**: fixed-amount or open-amount links, single-use or multi-use, each with a shareable URL and QR code.
- **Invoices**: line items, tax and discount, due date, a shareable checkout link and QR code. An invoice is marked as paid when the customer pays it.
- **Checkout**: customers open a link or scan a QR code, connect a wallet, approve USDC and pay. The checkout opens on the network the merchant used.
- **History**: all payments sent and received, with a link to the transaction on the block explorer.
- **Merchant profile**: edit business details and social links at any time.
- **Wallets**: MetaMask, Rabby and other EVM wallets, or a Circle passkey wallet (testnet only).

All merchant, link, invoice and payment data is stored in the smart contract. The app has no backend or database.

## Networks

| Network | Chain ID | Contract | USDC |
| --- | --- | --- | --- |
| Arc Mainnet | 5042 | `0xD133FE191eDB4f7fd8bE0bcFEeAc0948875A7de9` | `0x3600000000000000000000000000000000000000` |
| Arc Testnet | 5042002 | `0x16c966614e32dfa9e56a0c3a44004d589283f8f9` | `0x3600000000000000000000000000000000000000` |
| QMS Testnet | 19480 | `0xD133FE191eDB4f7fd8bE0bcFEeAc0948875A7de9` | `0xDd4D61DF875cc613E1372c78827a5F4C2741bf11` |

Explorers: [Arc Mainnet](https://explorer.arc.io), [Arc Testnet](https://explorer.testnet.arc.io), [QMS Testnet](https://testnet.qmsscan.io).

The contract is immutable: it has no admin role and no upgrade path. It has unit, fuzz and invariant tests but has **not been audited by a third party**. Use Arc Mainnet at your own risk.

## Tech stack

- Solidity smart contract, built and tested with Foundry
- React, TypeScript and Vite
- viem and wagmi for onchain reads and writes, ConnectKit for external wallets
- Circle Modular Wallets for passkey wallets
- Tailwind CSS and Framer Motion

## Development

### Prerequisites

- [Bun](https://bun.sh)
- [Foundry](https://book.getfoundry.sh) (only needed to build or test the contract)

### Install

```bash
bun install
```

### Environment variables

Create a `.env` file in the project root. Never commit it.

| Variable | Purpose |
| --- | --- |
| `VITE_CLIENT_KEY` | Circle Modular Wallets client key, required for passkey wallets |
| `VITE_CLIENT_URL` | Circle Modular Wallets client URL, required for passkey wallets |
| `VITE_MAINNET_CONTRACT` | Optional. Overrides the Arc Mainnet contract address |
| `VITE_QMS_CONTRACT` | Optional. Overrides the QMS Testnet contract address |

The passkey domain and allowed domain of the Circle client key must match the domain where the app runs.

### Run

```bash
bun run dev
```

### Lint and typecheck

```bash
bun run check
```

### Contract

```bash
bun run contracts:build
bun run contracts:test
```

## Disclaimer

Transactions on mainnet involve real funds and are irreversible. Review the code and addresses yourself before using Lovepay with real money.
