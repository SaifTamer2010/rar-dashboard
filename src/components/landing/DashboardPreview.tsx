import { cn } from '@/lib/utils'

/**
 * A static, decorative mock of the real agent dashboard — the same stat tiles,
 * leaderboard rows and live pulse card the app actually renders. It replaces
 * the old "[ product screenshot ]" placeholder, so the hero shows the product
 * instead of describing it. Numbers are made up, hence aria-hidden.
 */

const stats = [
  { label: 'Total leads', value: '47' },
  { label: 'Active ringers', value: '9' },
  { label: 'Campaigns', value: '4' },
  { label: 'Avg. per ringer', value: '5.2' },
]

const ringers = [
  { name: 'Mariam H.', count: 12 },
  { name: 'Youssef A.', count: 9 },
  { name: 'Nada K.', count: 7 },
  { name: 'Omar S.', count: 5 },
]

const campaigns = [
  { name: 'Downtown Rentals', count: 18 },
  { name: 'New Cairo Resale', count: 14 },
  { name: 'North Coast', count: 9 },
]

const topRinger = ringers[0].count
const topCampaign = campaigns[0].count

export default function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-2xl border bg-muted/40 shadow-[0_24px_60px_-30px_var(--foreground)]"
    >
      {/* Window chrome */}
      <div className="flex h-9.5 items-center gap-1.5 border-b bg-background px-3.5">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="ml-3 font-mono text-[11px] text-muted-foreground/70">
          Lead activity · Today · live
        </span>
      </div>

      <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-5">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-xl border bg-background p-3.5"
            >
              <span className="text-[11px] font-medium text-muted-foreground">{stat.label}</span>
              <span className="text-2xl leading-none font-semibold tracking-tighter">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.4fr_1fr]">
          {/* Leaderboard */}
          <div className="overflow-hidden rounded-xl border bg-background">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <span className="text-[13px] font-semibold">Top R&amp;R Ringers</span>
              <span className="text-[11px] text-muted-foreground">47 total leads</span>
            </div>

            {ringers.map((row, index) => (
              <div
                key={row.name}
                className={cn(
                  'flex items-center justify-between gap-3 border-b px-4 py-2.5 last:border-b-0',
                  index === 0 && 'bg-muted/50'
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold',
                      index === 0
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate text-[13px] font-medium">{row.name}</span>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                    <span
                      className={cn(
                        'block h-full rounded-full',
                        index === 0 ? 'bg-primary' : 'bg-muted-foreground/40'
                      )}
                      style={{ width: `${(row.count / topRinger) * 100}%` }}
                    />
                  </span>
                  <span className="min-w-5 text-right text-[13px] font-semibold">{row.count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right column: pulse + campaign split */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 rounded-xl border bg-background px-4 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold">Recent pulse</span>
                <span className="flex items-center gap-1.5 text-[10px] tracking-widest text-muted-foreground/70 uppercase">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  Live
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium">Mariam H.</span>
                <span className="text-[12px] text-muted-foreground">Downtown Rentals</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-background">
              <div className="border-b px-4 py-2.5 text-[13px] font-semibold">
                Campaign distribution
              </div>
              {campaigns.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between gap-3 border-b px-4 py-2.5 last:border-b-0"
                >
                  <span className="truncate text-[12px] text-foreground/80">{row.name}</span>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${(row.count / topCampaign) * 100}%` }}
                      />
                    </span>
                    <span className="min-w-4 text-right text-[12px] font-semibold">{row.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
