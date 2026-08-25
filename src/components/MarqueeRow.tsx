import { cn } from '@/lib/utils'
const MARQUEE_REPEATS = 4

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const track = Array.from({ length: MARQUEE_REPEATS }, () => items).flat()

  return (
    <div className="group flex w-full min-w-0 overflow-hidden">
      {/* Two identical tracks: the animation shifts a full track width, so track 2 lands exactly where track 1 started. */}
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn(
            'flex w-max shrink-0 items-center gap-10 pr-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none',
            reverse ? 'animate-marquee-reverse' : 'animate-marquee'
          )}
        >
          {track.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-10 text-[17px] font-semibold tracking-tight whitespace-nowrap text-muted-foreground"
            >
              {item}
              <span className="text-muted-foreground/40">•</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

export default MarqueeRow