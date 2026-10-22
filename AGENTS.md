# Lovepay

> Built with Arc Studio - money-powered apps in minutes

Payment gateway platform built on Arc Testnet. All data (merchants, payment links, invoices, payments) is stored in the `LovepayRegistry` smart contract.

---

## Deployed Contracts

| Contract | Chain | Address | Explorer |
|---|---|---|---|
| LovepayRegistry v3 | Arc Testnet (5042002) | 0x16c966614e32dfa9e56a0c3a44004d589283f8f9 | [View](https://explorer.testnet.arc.io/address/0x16c966614e32dfa9e56a0c3a44004d589283f8f9) |
| LovepayRegistry v2 (deprecated) | Arc Testnet (5042002) | 0xf2f7052b9d116c283540f88adf2137f0f1d741fc | [View](https://explorer.testnet.arc.io/address/0xf2f7052b9d116c283540f88adf2137f0f1d741fc) |
| LovepayRegistry v1 (deprecated) | Arc Testnet (5042002) | 0xf1d2f4b823a2ec8ffa91be154029e8c0e5113b65 | [View](https://explorer.testnet.arc.io/address/0xf1d2f4b823a2ec8ffa91be154029e8c0e5113b65) |

**Constructor args:** `_usdc = 0x3600000000000000000000000000000000000000` (Arc Testnet USDC)

## What This App Does

Lovepay is a USDC payment gateway with:
- Merchant onboarding (register via smart contract)
- Payment links (single-use or multi-use, fixed or open amount)
- Invoices (line items, tax/discount, due dates, status tracking)
- Checkout page (customer-facing, approve + pay via contract)
- Transaction history (all payments stored onchain)

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, tests in `contracts/test/`. Build: `forge build`, test: `forge test`.
- Chain: Arc Testnet (Chain ID 5042002)
- Token: USDC (Arc Testnet, 6 decimals, 0x3600000000000000000000000000000000000000)

## Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Root app: wallet + chain + merchant guards, view routing |
| `src/contract.ts` | Contract address + ABI import |
| `src/store.ts` | All wagmi hooks for contract read/write |
| `src/components/MerchantOnboarding.tsx` | First-time merchant registration flow |
| `src/components/Dashboard.tsx` | Merchant dashboard: stats + recent payments |
| `src/components/PaymentLinks.tsx` | Create/manage payment links |
| `src/components/Invoices.tsx` | Create/manage invoices |
| `src/components/Transactions.tsx` | Payment ledger with export |
| `src/components/Checkout.tsx` | Customer-facing payment page |
| `contracts/LovepayRegistry.sol` | Main smart contract (immutable, permissionless) |
| `contracts/LovepayRegistry-design.md` | Contract design doc |
| `contracts/test/LovepayRegistry.t.sol` | Forge unit tests (38 tests, all passing) |

## To Run

```
bun install
bun run dev
```

Open http://localhost:5173. Connect a wallet, register as merchant, then use the dashboard.
