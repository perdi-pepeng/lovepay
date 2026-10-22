/**
 * Circle Modular Wallet — passkey-based smart account for Arc Testnet.
 * Uses @circle-fin/modular-wallets-core + viem/account-abstraction.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  startTransition,
  type ReactNode,
} from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi'
import { createPublicClient, encodeFunctionData, type Abi, type Address } from 'viem'
import { arcTestnet } from 'viem/chains'
import { createBundlerClient, toWebAuthnAccount } from 'viem/account-abstraction'
import {
  WebAuthnMode,
  toCircleSmartAccount,
  toModularTransport,
  toPasskeyTransport,
  toWebAuthnCredential,
} from '@circle-fin/modular-wallets-core'
import type { WebAuthnCredential } from '@circle-fin/modular-wallets-core'

// ─── env ─────────────────────────────────────────────────────────────────────
const CLIENT_KEY = import.meta.env.VITE_CLIENT_KEY as string
const CLIENT_URL = import.meta.env.VITE_CLIENT_URL as string

// ─── transports (created once) ───────────────────────────────────────────────
const passkeyTransport = toPasskeyTransport(CLIENT_URL, CLIENT_KEY)
const modularTransport = toModularTransport(`${CLIENT_URL}/arcTestnet`, CLIENT_KEY)

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: modularTransport,
})

export const bundlerClient = createBundlerClient({
  chain: arcTestnet,
  transport: modularTransport,
})

// ─── types ────────────────────────────────────────────────────────────────────
type CircleSmartAccount = Awaited<ReturnType<typeof toCircleSmartAccount>>

export type CircleWalletState =
  | { status: 'disconnected' }
  | { status: 'loading' }
  | { status: 'connected'; address: `0x${string}`; account: CircleSmartAccount }

interface CircleWalletCtx {
  wallet: CircleWalletState
  register: (username: string) => Promise<void>
  login: () => Promise<void>
  disconnect: () => void
  error: string | null
}

const Ctx = createContext<CircleWalletCtx | null>(null)

const STORAGE_KEY = 'lovepay_circle_credential'

function loadStoredCredential(): WebAuthnCredential | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WebAuthnCredential) : null
  } catch {
    return null
  }
}

function saveCredential(cred: WebAuthnCredential) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cred))
}

function clearCredential() {
  localStorage.removeItem(STORAGE_KEY)
}

async function credToAccount(cred: WebAuthnCredential): Promise<CircleSmartAccount> {
  return toCircleSmartAccount({
    client: publicClient,
    owner: toWebAuthnAccount({ credential: cred }),
  })
}

// ─── provider ─────────────────────────────────────────────────────────────────
export function CircleWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<CircleWalletState>({ status: 'disconnected' })
  const [error, setError] = useState<string | null>(null)

  // Restore session on mount — async work, setState inside .then() is fine
  useEffect(() => {
    const cred = loadStoredCredential()
    if (!cred) return
    let cancelled = false
    startTransition(() => setWallet({ status: 'loading' }))
    credToAccount(cred)
      .then(account => {
        if (cancelled) return
        startTransition(() =>
          setWallet({ status: 'connected', address: account.address, account })
        )
      })
      .catch(() => {
        if (cancelled) return
        clearCredential()
        startTransition(() => setWallet({ status: 'disconnected' }))
      })
    return () => { cancelled = true }
  }, [])

  const connectWithCredential = useCallback(async (cred: WebAuthnCredential) => {
    const account = await credToAccount(cred)
    saveCredential(cred)
    setWallet({ status: 'connected', address: account.address, account })
  }, [])

  const register = useCallback(async (username: string) => {
    setError(null)
    setWallet({ status: 'loading' })
    try {
      const cred = await toWebAuthnCredential({
        transport: passkeyTransport,
        mode: WebAuthnMode.Register,
        username,
      })
      await connectWithCredential(cred)
    } catch (e) {
      setWallet({ status: 'disconnected' })
      setError(e instanceof Error ? e.message : 'Registrasi gagal')
    }
  }, [connectWithCredential])

  const login = useCallback(async () => {
    setError(null)
    setWallet({ status: 'loading' })
    try {
      const cred = await toWebAuthnCredential({
        transport: passkeyTransport,
        mode: WebAuthnMode.Login,
      })
      await connectWithCredential(cred)
    } catch (e) {
      setWallet({ status: 'disconnected' })
      setError(e instanceof Error ? e.message : 'Login gagal')
    }
  }, [connectWithCredential])

  const disconnect = useCallback(() => {
    clearCredential()
    setWallet({ status: 'disconnected' })
    setError(null)
  }, [])

  return (
    <Ctx.Provider value={{ wallet, register, login, disconnect, error }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCircleWallet() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCircleWallet must be used inside CircleWalletProvider')
  return ctx
}

// ─── Generic write hook via Circle bundler ────────────────────────────────────
// Replaces wagmi useWriteContract for Circle Modular Wallet accounts.
export function useCircleWrite() {
  const { wallet } = useCircleWallet()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const [isPending, setIsPending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const write = useCallback(async (params: {
    address: Address
    abi: Abi
    functionName: string
    args?: readonly unknown[]
    paymaster?: true
  }) => {
    if (wallet.status !== 'connected') {
      setError(new Error('Wallet tidak terhubung'))
      return
    }
    setError(null)
    setIsSuccess(false)
    setHash(undefined)
    setIsPending(true)
    try {
      const callData = encodeFunctionData({
        abi: params.abi,
        functionName: params.functionName,
        args: params.args ?? [],
      })
      const opHash = await bundlerClient.sendUserOperation({
        account: wallet.account,
        calls: [{ to: params.address, data: callData }],
        paymaster: true,
      })
      setIsPending(false)
      setIsConfirming(true)
      const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: opHash })
      setHash(receipt.transactionHash)
      setIsConfirming(false)
      setIsSuccess(true)
    } catch (e) {
      setIsPending(false)
      setIsConfirming(false)
      setError(e instanceof Error ? e : new Error(String(e)))
    }
  }, [wallet])

  const reset = useCallback(() => {
    setHash(undefined)
    setIsPending(false)
    setIsConfirming(false)
    setIsSuccess(false)
    setError(null)
  }, [])

  return { write, hash, isPending, isConfirming, isSuccess, error, reset }
}

// ─── Universal write hook — auto-routes to Circle bundler OR wagmi ─────────────
// Circle wallet active → sendUserOperation via bundler (gasless, passkey sign)
// Wagmi/injected wallet active → useWriteContract (MetaMask / Rabby sign)
export interface WriteParams {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
}

interface UniversalWriteResult {
  write: (params: WriteParams) => void
  hash: `0x${string}` | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
  reset: () => void
}

export function useUniversalWrite(): UniversalWriteResult {
  const { wallet } = useCircleWallet()
  const { isConnected: wagmiConnected, chainId: wagmiChainId } = useAccount()
  const isCircle = wallet.status === 'connected'

  // Circle path state
  const {
    write: circleWrite,
    hash: circleHash,
    isPending: circlePending,
    isConfirming: circleConfirming,
    isSuccess: circleSuccess,
    error: circleError,
    reset: circleReset,
  } = useCircleWrite()

  // Wagmi path state
  const {
    writeContract,
    data: wagmiHash,
    isPending: wagmiPending,
    error: wagmiWriteError,
    reset: wagmiReset,
  } = useWriteContract()

  const { switchChainAsync } = useSwitchChain()

  const {
    isLoading: wagmiConfirming,
    isSuccess: wagmiSuccess,
    error: wagmiReceiptError,
  } = useWaitForTransactionReceipt({ hash: wagmiHash })

  const write = useCallback((params: WriteParams) => {
    if (isCircle) {
      void circleWrite({ ...params, paymaster: true })
    } else if (wagmiConnected) {
      // Auto-switch to Arc Testnet if MetaMask is on a different chain
      const doWrite = () => writeContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args as never[],
        chainId: arcTestnet.id,
      })
      if (wagmiChainId !== arcTestnet.id) {
        void switchChainAsync({ chainId: arcTestnet.id })
          .then(doWrite)
          .catch(() => doWrite()) // if switch fails, try anyway
      } else {
        doWrite()
      }
    }
  }, [isCircle, wagmiConnected, wagmiChainId, circleWrite, writeContract, switchChainAsync])

  const reset = useCallback(() => {
    if (isCircle) circleReset()
    else wagmiReset()
  }, [isCircle, circleReset, wagmiReset])

  if (isCircle) {
    return {
      write,
      hash: circleHash,
      isPending: circlePending ?? false,
      isConfirming: circleConfirming ?? false,
      isSuccess: circleSuccess ?? false,
      error: circleError,
      reset,
    }
  }

  return {
    write,
    hash: wagmiHash,
    isPending: wagmiPending ?? false,
    isConfirming: wagmiConfirming ?? false,
    isSuccess: wagmiSuccess ?? false,
    error: (wagmiWriteError ?? wagmiReceiptError),
    reset,
  }
}
