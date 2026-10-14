import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi } from 'viem'
import { Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { getUsdc, buildTxExplorerUrl, requireChain } from '@/onchain-facts'
import { parseAmount, Amount, usdcDecimalsFor } from '@/onchain-money'
import { arcTestnet } from 'viem/chains'

const TARGET_CHAIN_ID = arcTestnet.id

const usdcFact = getUsdc(TARGET_CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

const PRESETS = ['0.01', '0.05', '0.10', '0.25'] as const

const glass = {
  card: {
    background: 'var(--surface-strong)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
  } as React.CSSProperties,
  inner: {
    background: 'var(--surface-muted)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
  } as React.CSSProperties,
}

function parseOnchainError(error: unknown): string {
  const message = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (message.includes('user rejected') || (error as { code?: number })?.code === 4001)
    return 'Transaction cancelled.'
  if (message.includes('insufficient funds') || message.includes('exceeds balance'))
    return 'Insufficient USDC balance.'
  if (message.includes('reverted')) return 'Transaction failed — please try again.'
  if (message.includes('network') || message.includes('timeout'))
    return 'Network issue — please retry.'
  return 'Something went wrong. Please try again.'
}

interface TipFormProps {
  recipientAddress: string
}

export function TipForm({ recipientAddress }: TipFormProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('0.05')
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const { address, chainId, isConnected } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const {
    writeContract,
    data: hash,
    isPending,
    isError,
    error,
    reset,
  } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const wrongChain = isConnected && chainId !== TARGET_CHAIN_ID
  const amount = useCustom ? customAmount : selectedPreset
  const parsedAmountValid = amount && !isNaN(Number(amount)) && Number(amount) > 0

  const txUrl = hash ? buildTxExplorerUrl(TARGET_CHAIN_ID, hash) : undefined
  const chainName = requireChain(TARGET_CHAIN_ID).name

  const handleSend = () => {
    if (wrongChain) {
      switchChain({ chainId: TARGET_CHAIN_ID })
      return
    }
    if (!parsedAmountValid || !recipientAddress) return
    const parsed = parseAmount(TARGET_CHAIN_ID, amount)
    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipientAddress as `0x${string}`, parsed.raw],
    })
  }

  if (isSuccess && hash) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div
          className="flex size-14 items-center justify-center rounded-full"
          style={{ background: 'rgba(26,128,71,0.12)' }}
        >
          <CheckCircle2 className="size-7" style={{ color: 'var(--success)' }} />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
            Tip sent!
          </p>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            {amount} USDC on {chainName}
          </p>
        </div>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
          >
            View on explorer
            <ExternalLink className="size-3" />
          </a>
        )}
        <button
          onClick={() => {
            reset()
            setMessage('')
          }}
          className="text-sm font-medium underline underline-offset-2"
          style={{ color: 'var(--accent-hover)' }}
        >
          Send another tip
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Amount presets */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Choose amount
        </p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setSelectedPreset(p); setUseCustom(false) }}
              className="rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={
                !useCustom && selectedPreset === p
                  ? { background: 'var(--accent)', color: '#fff', border: '1px solid transparent' }
                  : { background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }
              }
            >
              ${p}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <button
          onClick={() => setUseCustom(true)}
          className="mt-2 w-full rounded-2xl py-2.5 text-sm font-medium transition-all"
          style={
            useCustom
              ? { background: 'var(--accent)', color: '#fff', border: '1px solid transparent' }
              : { background: 'var(--surface-muted)', color: 'var(--muted)', border: '1px solid var(--border)' }
          }
        >
          Custom amount
        </button>
        {useCustom && (
          <div className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-3" style={glass.inner}>
            <TokenUSDC variant="branded" size={18} />
            <input
              inputMode="decimal"
              value={customAmount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '')
                if (v === '' || /^\d*\.?\d*$/.test(v)) setCustomAmount(v)
              }}
              placeholder="0.00"
              className="display flex-1 bg-transparent text-2xl font-bold tabular-nums outline-none placeholder:opacity-30"
              style={{ color: 'var(--ink)' }}
              autoFocus
            />
            <span className="text-sm font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
          </div>
        )}
      </div>

      {/* Message input */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Leave a message (optional)
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 120))}
          placeholder="Thanks for the content!"
          rows={2}
          className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none transition-colors placeholder:opacity-40"
          style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
            fontFamily: 'inherit',
          }}
        />
        <p className="mt-1 text-right text-xs" style={{ color: 'var(--subtle)' }}>
          {message.length}/120
        </p>
      </div>

      {/* Sender info */}
      {isConnected && address && (
        <p className="text-xs" style={{ color: 'var(--subtle)' }}>
          Sending from{' '}
          <span className="mono" style={{ color: 'var(--ink-2)' }}>
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </p>
      )}

      {/* Error */}
      {isError && (
        <p className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}>
          {parseOnchainError(error)}
        </p>
      )}

      {/* CTA */}
      <button
        disabled={
          !isConnected ||
          isSwitching ||
          isPending ||
          isConfirming ||
          (!wrongChain && !parsedAmountValid)
        }
        onClick={handleSend}
        className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: 'var(--accent)' }}
      >
        {!isConnected ? (
          'Connect wallet to tip'
        ) : wrongChain ? (
          isSwitching ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Switching…
            </span>
          ) : (
            `Switch to ${chainName}`
          )
        ) : isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Confirm in wallet…
          </span>
        ) : isConfirming ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Confirming…
          </span>
        ) : (
          `Send ${amount} USDC tip`
        )}
      </button>

      {/* Testnet note */}
      <p className="text-center text-xs" style={{ color: 'var(--subtle)' }}>
        Running on {chainName}. Get test USDC from the Arc Studio sidebar.
      </p>
    </div>
  )
}

// Export Amount for use in TipHistory
export { Amount, usdcDecimalsFor }
