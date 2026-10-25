#!/usr/bin/env bash
# Deploy LovepayRegistry to Arc Mainnet
# Run this script yourself with your own private key — never share it.
#
# Usage:
#   export PRIVATE_KEY=0x<your-deployer-private-key>
#   bash scripts/deploy-mainnet.sh
#
# After deploy, add the contract address to .env:
#   VITE_MAINNET_CONTRACT=0x<deployed-address>
# Then redeploy your frontend (Vercel / Netlify / HF).

set -e

ARC_MAINNET_RPC="https://rpc.mainnet.arc.io"
USDC_ARC="0x3600000000000000000000000000000000000000"

if [ -z "$PRIVATE_KEY" ]; then
  echo "ERROR: PRIVATE_KEY env var is not set."
  echo "  export PRIVATE_KEY=0x<your-key> and re-run."
  exit 1
fi

echo "Building contracts..."
cd "$(dirname "$0")/.."
forge build --quiet

echo "Deploying LovepayRegistry to Arc Mainnet..."
forge create contracts/LovepayRegistry.sol:LovepayRegistry \
  --rpc-url "$ARC_MAINNET_RPC" \
  --private-key "$PRIVATE_KEY" \
  --constructor-args "$USDC_ARC" \
  --broadcast

echo ""
echo "Done. Copy the 'Deployed to' address above and add it to .env:"
echo "  VITE_MAINNET_CONTRACT=0x<address>"
