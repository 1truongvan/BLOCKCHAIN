import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { Wallet } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { getUsdc } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import { arcTestnet } from 'viem/chains'
import { TipForm } from './TipForm'
import { TipHistory } from './TipHistory'

const TARGET_CHAIN_ID = arcTestnet.id
const usdcFact = getUsdc(TARGET_CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

const glass = {
  page: {
    background: 'var(--surface-strong)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    border: '1px solid var(--border)',
    borderRadius: '28px',
  } as React.CSSProperties,
}

// Spectral strip for the top of the card
const spectral = 'linear-gradient(90deg, #acc6e9 0%, #c5b4f0 25%, #f4a4b0 50%, #f9d37f 75%, #a8e6cf 100%)'

export function TipJar() {
  const { address, isConnected } = useAccount()

  // Owner = connected wallet. If not connected, show a prompt.
  const ownerAddress = isConnected ? address : undefined

  // Read owner's USDC balance
  const { data: rawBalance, isLoading: balanceLoading } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: ownerAddress ? [ownerAddress] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: { enabled: !!ownerAddress },
  })

  const formattedBalance =
    rawBalance !== undefined
      ? Amount.fromRaw(rawBalance, usdcDecimalsFor(TARGET_CHAIN_ID)).toFixed(2)
      : null

  const [tab, setTab] = useState<'tip' | 'history'>('tip')

  return (
    <div className="flex min-h-dvh flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-md" style={glass.page}>
        {/* Spectral strip */}
        <div className="h-1 rounded-t-[28px]" style={{ background: spectral }} />

        <div className="px-6 pb-6 pt-5">
          {/* Header row */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                Tip Jar
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
                Send USDC tips on Arc Testnet
              </p>
            </div>
            <ConnectKitButton />
          </div>

          {/* Owner balance hero — only shown when connected */}
          {isConnected && ownerAddress && (
            <div
              className="mb-5 rounded-3xl p-5"
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <div
                  className="flex size-5 items-center justify-center rounded-md"
                  style={{ background: 'rgba(26,128,71,0.12)' }}
                >
                  <TokenUSDC variant="branded" size={12} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                  Your balance
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="display text-4xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                  {balanceLoading ? '…' : formattedBalance ?? '0.00'}
                </span>
                <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
              </div>
              <p className="mono mt-1 truncate text-xs" style={{ color: 'var(--subtle)' }}>
                {ownerAddress.slice(0, 10)}…{ownerAddress.slice(-6)}
              </p>
            </div>
          )}

          {/* Not connected state */}
          {!isConnected && (
            <div
              className="mb-5 flex flex-col items-center gap-3 rounded-3xl py-8"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex size-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(18,45,69,0.08)' }}
              >
                <Wallet className="size-5" style={{ color: 'var(--ink)' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  Connect your wallet
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                  Connect to send or receive USDC tips
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div
            className="mb-5 flex gap-1 rounded-2xl p-1"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
          >
            {(['tip', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={
                  tab === t
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { color: 'var(--muted)' }
                }
              >
                {t === 'tip' ? 'Send Tip' : 'History'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'tip' ? (
            ownerAddress ? (
              <TipForm recipientAddress={ownerAddress} />
            ) : (
              <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                Connect your wallet to enable tipping.
              </p>
            )
          ) : (
            ownerAddress ? (
              <TipHistory recipientAddress={ownerAddress} />
            ) : (
              <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                Connect your wallet to see tip history.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  )
}
