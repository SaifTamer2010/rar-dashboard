'use client'

import { useState } from 'react'
import Link from 'next/link'
import Marquee from 'react-fast-marquee'
import { Bot, Building2, Megaphone, Music, ShieldOff, Webhook } from 'lucide-react'
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { LinkButton } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** The design-system button tops out at h-8 / text-xs — landing-page CTAs need marketing scale. */
const ctaSize = 'h-11 rounded-lg px-5 text-[15px]'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  // { label: 'Docs', href: '#docs' },
]

/** autoFill repeats these until the row overflows, so the loop is seamless at any width. */
const marqueeItems = ['ITS 100% FREE WEBSITE', 'WE DONT TAKE ANY DATA WHATSOEVER', 'HAVE FUN USING IT']
/** Bottom row, scrolls the other way. */
const marqueeItemsReverse = ['ITS 100% FREE WEBSITE', 'WE DONT TAKE ANY DATA WHATSOEVER', 'HAVE FUN USING IT']

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <Marquee
      autoFill
      pauseOnHover
      speed={40}
      direction={reverse ? 'right' : 'left'}
      gradient={false}
      className="mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] w-[150px]"
    >
      {items.map((item, i) => (
        <span
          key={i}
          className="flex items-center gap-8 text-[17px] font-semibold tracking-tight whitespace-nowrap text-muted-foreground"
        >
          {item}
          {/* Trailing separator on every item, so the wrap-around joint gets one too. */}
          <span aria-hidden className="mr-8 text-muted-foreground/40">
            •
          </span>
        </span>
      ))}
    </Marquee>
  )
}

/** Privacy, Terms and Security are all the same one-liner — there is genuinely nothing else to say. */
const legalDocs = ['Privacy', 'Terms', 'Security'] as const

const legalBody =
  "WE DON'T TAKE PERSONAL DATA AT ALL. MAYBE THE EMAIL JUST FOR YOU TO SIGN UP, BUT RATHER THAN THAT — NO PERSONAL DATA, NO LEAD DATA, NOTHING."

function LegalModal({ title }: { title: string }) {
  return (
    <DialogTrigger>
      <Button className="cursor-pointer text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline">
        {title}
      </Button>
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm data-entering:animate-in data-entering:fade-in data-exiting:animate-out data-exiting:fade-out"
      >
        <Modal className="w-full max-w-lg data-entering:animate-in data-entering:zoom-in-95 data-exiting:animate-out data-exiting:zoom-out-95">
          <Dialog className="flex flex-col gap-4 rounded-xl border bg-background p-7 outline-none">
            {({ close }) => (
              <>
                <Heading slot="title" className="text-xl font-semibold tracking-tight">
                  {title}
                </Heading>
                <p className="text-[15px] leading-relaxed font-medium">{legalBody}</p>
                <Button
                  onPress={close}
                  className="mt-2 h-10 cursor-pointer self-end rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  Got it
                </Button>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}

const features = [
  {
    icon: ShieldOff,
    title: 'Policy as data',
    body: "We don't actually take any data.",
  },
  {
    icon: Megaphone,
    title: 'Built in announcer',
    body: 'Huge sound system depends on your speakers tho.',
  },
  {
    icon: Music,
    title: 'Huge sound store',
    body: "Every sound uploaded to the site gets a place in the sound store so you can't run out of Sounds",
  },
  {
    icon: Bot,
    title: 'Smart developer',
    body: 'You can actually connect telegram bot to announce on your work group',
  },
  {
    icon: Webhook,
    title: 'Smart developer II',
    body: 'Also you can connect your CRM to announce automatically once the lead is submitted ',
  },
  {
    icon: Building2,
    title: 'Big multi tenant saas',
    body: 'if you have mutliple teams you can connect them all together in one go',
  },
]

const plans = [
  {
    name: 'Starter',
    blurb: 'For small team below 50 agents.',
    monthly: '0',
    annual: '0',
    cta: 'Start free trial',
    featured: false,
    features: [
      'only the funny agents',
      'more than 150 IQ',
      'High achievers',
      'Breathing (optional)',
      "You can't contact the developer",
    ],
  },
  {
    name: 'Team',
    blurb: 'For small team above 50 agents.',
    monthly: '0',
    annual: '0',
    cta: 'Start free trial',
    featured: true,
    features: [
      "Doesn't really need to be funny",
      'more than 100IQ',
      "doesn't really have to be a top achiever",
      'Breathing (still optional)',
      'Meeh i can respond from time to time',
      'Lollipop',
    ],
  },
  {
    name: 'Enterprise',
    blurb: 'Its really free but if you want to book a meeting who am i to judge.',
    monthly: null,
    annual: null,
    cta: 'Contact sales',
    featured: false,
    features: [
      "you really want to meet me"
    ],
  },
]

const faqs = [
  {
    q: 'What is daily dashboard?',
    a: "It's actually a dashboard interval made by a really funny developer to track intervals.",
  },
  {
    q: 'Does daily dashboard take any lead data?',
    a: "Nope nothing really just the agent name and the campaign name and nothing else really",
  },
  {
    q: 'How long does setup take?',
    a: 'usually takes around 5 mins to setup the whole app unless something crashs LOL',
  },
  {
    q: "What's the purpose of daily dashboard?",
    a: 'Nothing really i got bored i decided to build this otherwise to make my manager crashout midday',
  },
  {
    q: "Why are you so funny like this?",
    a: "Built different",
  },
]

export default function LandingPage() {
  const [annual, setAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState<number>(0)

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-15 max-w-280 items-center gap-8 px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-5.5 rounded-md bg-foreground text-white text-xs flex justify-center items-center">D</div>
            <span className="text-[15px] font-semibold tracking-tight">Daily Dashboard</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <LinkButton href="/sign-in" variant="ghost" className="h-9 rounded-lg px-3 text-sm">
              Sign in
            </LinkButton>
            <LinkButton href="/sign-up" className="h-9 rounded-lg px-3.5 text-sm">
              Get started
            </LinkButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-280 flex-col items-center gap-6 px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 py-1 pr-1 pl-3 text-[13px] text-muted-foreground">
          <span>v2.0 — Now free for everyone</span>
          <Badge className="rounded-full px-2 py-0.5 text-[11px] font-medium">New</Badge>
        </div>

        <h1 className="max-w-[14ch] text-6xl leading-[1.05] font-semibold tracking-tighter text-balance">
         Every Lead Deserves an Entrance
        </h1>

        <p className="max-w-[56ch] text-[19px] leading-relaxed text-muted-foreground text-pretty">
          Pick a campaign, hit the button, and let your custom sound announce it to the whole team. Daily Dashboard turns every new lead into a moment.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <LinkButton href="/sign-up" className={ctaSize}>
            Get Started Free
          </LinkButton>
          <LinkButton href="#demo" variant="outline" className={ctaSize}>
            See how it works
          </LinkButton>
        </div>

        <p className="font-mono text-[13px] text-muted-foreground/70">
          Free forever · No credit card · Set up in 2 minutes
        </p>
      </section>

      {/* Product shot */}
      <section className="mx-auto max-w-280 px-6 pb-6">
        <div className="overflow-hidden rounded-2xl border bg-muted/40 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.25)]">
          <div className="flex h-9.5 items-center gap-1.5 border-b bg-background px-3.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </div>
          <div className="flex aspect-video items-center justify-center bg-[repeating-linear-gradient(135deg,var(--muted)_0_10px,transparent_10px_20px)]">
            <span className="font-mono text-xs tracking-wide text-muted-foreground/70">
              [ product screenshot — access review dashboard ]
            </span>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="flex flex-col gap-6 border-y py-12 w-screen">
        <MarqueeRow items={marqueeItems} />
        <MarqueeRow items={marqueeItemsReverse} reverse />
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/40">
        <div className="mx-auto max-w-280 px-6 py-20">
          <div className="mb-12 flex max-w-[52ch] flex-col gap-3">
            <span className="text-[13px] font-medium text-muted-foreground">Features</span>
            <h2 className="text-4xl leading-tight font-semibold tracking-tighter">
              Track your team intervels like you didn't before
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              What's better than a random sound music plays midday, midwork because your agent got a lead.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-2 rounded-xl border bg-background p-6"
              >
                <div className="mb-1.5 flex size-8 items-center justify-center rounded-lg border bg-muted">
                  <feature.icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <h3 className="text-[15px] font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-t">
        <div className="mx-auto grid max-w-280 grid-cols-1 items-center gap-14 px-6 py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-3.5">
            <span className="text-[13px] font-medium text-muted-foreground">Why Daily dashboard?</span>
            <h2 className="text-[32px] leading-tight font-semibold tracking-tighter">
              I don't have any idea but its funny
            </h2>
            <p className="leading-relaxed text-muted-foreground">
             My team love it i love it my managers love it so i guessed why not out for the public to try :D
            </p>
            
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-280 flex-col items-center gap-9 px-6 py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="text-4xl font-semibold tracking-tighter">Simple, per-seat pricing</h2>
            <p className="text-muted-foreground">
              Every plan includes EVERYTHING
            </p>

            <div className="mt-2 inline-flex gap-1 rounded-[10px] border bg-background p-1">
              {[
                { label: 'Monthly', value: false },
                { label: 'Annual', value: true },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setAnnual(option.value)}
                  aria-pressed={annual === option.value}
                  className={cn(
                    'cursor-pointer rounded-[7px] px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                    annual === option.value
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option.label}
                  {option.value && <span className="opacity-70"> −20%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'flex flex-col gap-2.5 rounded-xl border bg-background p-6',
                  plan.featured &&
                    'border-foreground shadow-[0_12px_32px_-18px_rgba(9,9,11,0.45)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold">{plan.name}</h3>
                  {plan.featured && (
                    <Badge className="rounded-full px-2 py-0.5 text-[11px] font-medium">
                      Most popular
                    </Badge>
                  )}
                </div>

                <p className="text-sm leading-normal text-muted-foreground">{plan.blurb}</p>

                <div className="flex items-baseline gap-1.5 pt-1.5 pb-0.5">
                  <span className="text-[38px] font-semibold tracking-tighter">
                    {plan.monthly === null ? 'Custom' : `$${annual ? plan.annual : plan.monthly}`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.monthly === null
                      ? 'annual contract'
                      : annual
                        ? '/user/mo, billed yearly'
                        : '/user/mo'}
                  </span>
                </div>

                <LinkButton
                  href={plan.monthly === null ? '#contact' : '/sign-up'}
                  variant={plan.featured ? 'default' : 'outline'}
                  className="mt-1 h-10 w-full rounded-lg text-sm"
                >
                  {plan.cta}
                </LinkButton>

                <div className="my-1.5 h-px bg-border" />

                <ul className="flex list-none flex-col gap-2.5 p-0">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm leading-normal text-foreground/80"
                    >
                      <span className="text-[13px] leading-relaxed text-muted-foreground">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t">
        <div className="mx-auto grid max-w-280 grid-cols-1 gap-14 px-6 py-20 lg:grid-cols-[340px_1fr]">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-[32px] leading-tight font-semibold tracking-tighter">
              Frequently asked
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Still stuck?{' '}
              <Link href="#contact" className="underline underline-offset-[3px]">
                Talk to us
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col border-t">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="border-b">
                <button
                  type="button"
                  onClick={() => setOpenFaq((prev) => (prev === i ? -1 : i))}
                  aria-expanded={openFaq === i}
                  className="flex w-full cursor-pointer items-center justify-between gap-6 py-4.5 text-left text-[15px] font-medium"
                >
                  <span>{faq.q}</span>
                  <span
                    className={cn(
                      'text-lg text-muted-foreground transition-transform duration-200',
                      openFaq === i && 'rotate-45'
                    )}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <p className="max-w-[70ch] pb-5 text-[15px] leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-zinc-950 text-zinc-50">
        <div className="mx-auto flex max-w-280 flex-col items-center gap-5 px-6 py-22 text-center">
          <h2 className="max-w-[20ch] text-[40px] leading-tight font-semibold tracking-tighter">
           Wanna speak to the developer?
          </h2>
          <p className="max-w-[52ch] text-[17px] leading-relaxed text-zinc-400">
            I made 2 buttons just for you
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {/* change those buttons to actually do something */}
            <LinkButton
              href="/sign-up"
              className={cn(ctaSize, 'bg-zinc-50 text-zinc-950 hover:bg-zinc-200')}
            >
              Start free trial
            </LinkButton>
            <LinkButton
              href="#demo"
              variant="outline"
              className={cn(
                ctaSize,
                'border-zinc-700 bg-transparent text-zinc-50 hover:bg-zinc-900 hover:text-zinc-50'
              )}
            >
              Book a demo
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto grid max-w-280 grid-cols-2 gap-10 px-6 pt-14 pb-8 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-2.5 lg:col-span-1">
            <div className="flex items-center gap-2">
               <div className="size-5.5 rounded-md bg-foreground text-white text-xs flex justify-center items-center">D</div>
            <span className="text-[15px] font-semibold tracking-tight">Daily Dashboard</span>
            </div>
            <p className="max-w-[34ch] text-[13px] leading-relaxed text-muted-foreground">
              Your way to go dashboard
            </p>
          </div>

          {[
            {
              title: 'Product',
              links: [
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                // { label: 'Changelog', href: '#changelog' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'About', href: '#about' },
                { label: 'Careers', href: '#careers' },
                { label: 'Contact', href: '#contact' },
              ],
            },
          ].map((column) => (
            <div key={column.title} className="flex flex-col gap-2.5 text-[13px]">
              <span className="font-medium">{column.title}</span>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="flex flex-col items-start gap-2.5 text-[13px]">
            <span className="font-medium">Legal</span>
            {legalDocs.map((title) => (
              <LegalModal key={title} title={title} />
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-280 px-6 pb-10">
          <div className="flex justify-between border-t pt-5 text-xs text-muted-foreground/70">
            <span>© 2026 Palisade Labs, Inc.</span>
            <span className="font-mono">Demo content</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
