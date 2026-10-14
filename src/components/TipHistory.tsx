import { useEffect, useState } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { arcTestnet } from 'viem/chains'
import { Clock, ExternalLink } from 'lucide-react'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

const TARGET_CHAIN_ID = arcTestnet.id
const usdcFact = getUsdc(TARGET_CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
})

interface TipEvent {
  from: string
  amount: string
  txHash: string
  blockNumber: bigint
}

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
)

interface TipHistoryProps {
  recipientAddress: string
}

export function TipHistory({ recipientAddress }: TipHistoryProps) {
  const [tips, setTips] = useState<TipEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!recipientAddress) return
    let cancelled = false

    const fetchLogs = async () => {
      setLoading(true)
      setError(null)
      try {
        const latest = await client.getBlockNumber()
        const fromBlock = latest > 2000n ? latest - 2000n : 0n

        const logs = await client.getLogs({
          address: USDC_ADDRESS,
          event: TRANSFER_EVENT,
          args: { to: recipientAddress as `0x${string}` },
          fromBlock,
          toBlock: 'latest',
        })

        if (cancelled) return

        const decimals = usdcDecimalsFor(TARGET_CHAIN_ID)
        const parsed: TipEvent[] = logs
          .slice(-20)
          .reverse()
          .map((log) => ({
            from: log.args.from ?? '0x',
            amount: Amount.fromRaw(log.args.value ?? 0n, decimals).toFixed(2),
            txHash: log.transactionHash ?? '',
            blockNumber: log.blockNumber ?? 0n,
          }))
        setTips(parsed)
      } catch {
        if (!cancelled) setError('Could not load tip history.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchLogs()
    const interval = setInterval(() => { void fetchLogs() }, 15_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [recipientAddress])

  if (!recipientAddress) return null

  return (
    <section>
      <div className="mb-3 flex items-center gap-1.5">
        <Clock className="size-3.5" style={{ color: 'var(--muted)' }} />
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Recent tips
        </p>
      </div>

      {loading && tips.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-2xl"
              style={{ background: 'var(--surface-muted)' }}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {!loading && !error && tips.length === 0 && (
        <div
          className="rounded-2xl px-4 py-6 text-center"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            No tips yet — be the first!
          </p>
        </div>
      )}

      {tips.length > 0 && (
        <ul className="space-y-2">
          {tips.map((tip) => (
            <li
              key={`${tip.txHash}-${tip.blockNumber}`}
              className="flex items-center justify-between rounded-2xl px-4 py-3"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
            >
              <div className="min-w-0">
                <p className="mono truncate text-xs" style={{ color: 'var(--subtle)' }}>
                  {tip.from.slice(0, 6)}…{tip.from.slice(-4)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="display tabular-nums text-sm font-semibold"
                  style={{ color: 'var(--ink)' }}
                >
                  ${tip.amount}
                </span>
                {tip.txHash && (
                  <a
                    href={buildTxExplorerUrl(TARGET_CHAIN_ID, tip.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-opacity hover:opacity-60"
                    aria-label="View transaction"
                  >
                    <ExternalLink className="size-3" style={{ color: 'var(--subtle)' }} />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
