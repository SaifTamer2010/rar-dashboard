'use client'

import { useState } from 'react'
import Link from 'next/link'
import Marquee from 'react-fast-marquee'
import {
  Activity,
  Bell,
  Building2,
  Music,
  Search,
  Send,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react'
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { LinkButton } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import DashboardPreview from '@/components/landing/DashboardPreview'
import { cn } from '@/lib/utils'

/** The design-system button tops out at h-8 / text-xs — landing-page CTAs need marketing scale. */
const ctaSize = 'h-11 w-full rounded-lg px-5 text-[15px] sm:w-auto'

/** Every section header reads the same: small eyebrow, big line, one sentence. */
const eyebrow = 'text-[13px] font-medium text-muted-foreground'
const sectionTitle = 'text-3xl leading-tight font-semibold tracking-tighter sm:text-4xl'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Roles', href: '#roles' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

/** autoFill repeats these until the row overflows, so the loop is seamless at any width. */
const marqueeItems = ['ITS 100% FREE', 'WE DONT TAKE ANY DATA WHATSOEVER', 'HAVE FUN USING IT']
/** Bottom row, scrolls the other way. */
const marqueeItemsReverse = ['NO CREDIT CARD', 'NO LEAD DATA STORED', 'JUST LOG THE LEAD']

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <Marquee autoFill pauseOnHover speed={40} direction={reverse ? 'right' : 'left'} gradient={false}>
      {items.map((item, i) => (
        <span
          key={i}
          className="flex items-center gap-8 text-[15px] font-semibold tracking-tight whitespace-nowrap text-muted-foreground sm:text-[17px]"
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
      <Button className="cursor-pointer text-left text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline">
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

/** Everything here is a thing the app actually ships. No roadmap items. */
const features = [
  {
    icon: Music,
    title: 'Every lead gets a sound',
    body: 'Log a lead and your own sound fires on every dashboard that is open. Pick one from the shared sound store or upload your own and set it as your default.',
  },
  {
    icon: Activity,
    title: 'Live board, no refresh',
    body: 'Leads arrive over a realtime channel. The stat tiles, the leaderboard and the campaign split all move the second somebody rings.',
  },
  {
    icon: Trophy,
    title: 'A leaderboard that means something',
    body: 'Top R&R Ringers, campaign distribution, active ringers and average per ringer — filtered to today or any date range you pick.',
  },
  {
    icon: Send,
    title: 'Push the day to Telegram',
    body: 'Copy the summary to your clipboard, or send the whole board straight to the work group without retyping a single number.',
  },
  {
    icon: Bell,
    title: 'The shame bell',
    body: 'Thirty quiet minutes and the dashboard says so out loud, on every screen. Nobody wants to be the reason it rang.',
  },
  {
    icon: Search,
    title: 'Property lookup built in',
    body: 'Search a property by address without leaving the dashboard, so the tab you were about to open stays closed.',
  },
]

const steps = [
  {
    title: 'Set up your teams',
    body: 'An owner creates the teams and campaigns, sends invite links, and drops each agent under a leader.',
  },
  {
    title: 'Pick a campaign, log the lead',
    body: 'The agent hits Log Lead, chooses the campaign, and that is the whole interaction. Two clicks.',
  },
  {
    title: 'The room hears about it',
    body: 'The sound plays everywhere, the board reorders itself, and the day is one Telegram message away from the group chat.',
  },
]

/** Mirrors ROLE_LABELS / ROLE_HOME in src/lib/roles.ts — four seats, four homes. */
const roles = [
  {
    icon: UserRound,
    name: 'Agent',
    body: 'Logs leads, picks a default sound from the store, and watches their own row climb the board.',
  },
  {
    icon: Users,
    name: 'Team leader',
    body: 'Owns the intervals view — their agents, their campaigns, and how the day is actually going.',
  },
  {
    icon: Building2,
    name: 'Business owner',
    body: 'Creates teams and campaigns, invites people, and sees everything every team has logged.',
  },
  {
    icon: ShieldCheck,
    name: 'Super admin',
    body: 'Users, campaigns and leads across the whole install, plus a force-refresh for when a screen gets stuck.',
  },
]

const plans = [
  {
    name: 'Starter',
    blurb: 'For small team below 50 agents.',
    price: '$0',
    note: 'forever',
    cta: 'Get started',
    href: '/sign-up',
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
    price: '$0',
    note: 'forever',
    cta: 'Get started',
    href: '/sign-up',
    featured: true,
    features: [
      "Doesn't really need to be funny",
      'more than 100 IQ',
      "doesn't really have to be a top achiever",
      'Breathing (still optional)',
      'Meeh i can respond from time to time',
      'Lollipop',
    ],
  },
  {
    name: 'Enterprise',
    blurb: 'Its really free but if you want to book a meeting who am i to judge.',
    price: 'Custom',
    note: 'still zero, though',
    cta: 'Contact the developer',
    href: '#contact',
    featured: false,
    features: ['you really want to meet me'],
  },
]

const faqs = [
  {
    q: 'What is Daily Dashboard?',
    a: "It's a dashboard made by a really funny developer to track your team's intervals — every lead, live, with a sound.",
  },
  {
    q: 'Does Daily Dashboard take any lead data?',
    a: 'Nope, nothing really — just the agent name and the campaign name and nothing else.',
  },
  {
    q: 'How long does setup take?',
    a: 'Usually around 5 mins to set the whole thing up, unless something crashes LOL.',
  },
  {
    q: "What's the purpose of Daily Dashboard?",
    a: 'Nothing really, i got bored and decided to build this — otherwise to make my manager crash out midday.',
  },
  {
    q: 'Why are you so funny like this?',
    a: 'Built different.',
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number>(0)

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-280 items-center gap-6 px-4 sm:h-15 sm:px-6 lg:gap-8">
          <Link href="/" className="flex items-center" aria-label="Daily Dashboard, home">
            <Logo size={22} />
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
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
      <section className="mx-auto flex max-w-280 flex-col items-center gap-6 px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 py-1 pr-1 pl-3 text-[13px] text-muted-foreground">
          <span>v2.0 — now free for everyone</span>
          <Badge className="rounded-full px-2 py-0.5 text-[11px] font-medium">New</Badge>
        </div>

        <h1 className="max-w-[15ch] text-4xl leading-[1.05] font-semibold tracking-tighter text-balance sm:text-5xl lg:text-6xl">
          Every lead deserves an entrance
        </h1>

        <p className="max-w-[56ch] text-[17px] leading-relaxed text-pretty text-muted-foreground sm:text-[19px]">
          Pick a campaign, hit the button, and your sound announces it on every screen in the office.
          Daily Dashboard is the live lead board for real-estate teams — leaderboard, campaign split
          and Telegram digest included.
        </p>

        <div className="flex w-full max-w-xs flex-col gap-3 pt-2 sm:max-w-none sm:flex-row sm:justify-center">
          <LinkButton href="/sign-in" className={ctaSize}>
            Open your dashboard
          </LinkButton>
          <LinkButton href="/sign-up" variant="outline" className={ctaSize}>
            Create an account
          </LinkButton>
        </div>

        <p className="font-mono text-[13px] text-muted-foreground/70">
          Free forever · No credit card · Set up in 5 minutes
        </p>
      </section>

      {/* Product shot */}
      <section className="mx-auto max-w-280 px-4 pb-8 sm:px-6 sm:pb-6">
        <DashboardPreview />
      </section>

      {/* Ticker */}
      <section className="flex w-full flex-col gap-6 overflow-hidden border-y py-10 sm:py-12">
        <MarqueeRow items={marqueeItems} />
        <MarqueeRow items={marqueeItemsReverse} reverse />
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/40">
        <div className="mx-auto max-w-280 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 flex max-w-[52ch] flex-col gap-3 sm:mb-12">
            <span className={eyebrow}>Features</span>
            <h2 className={sectionTitle}>Track your team&apos;s intervals like you never did before</h2>
            <p className="leading-relaxed text-muted-foreground">
              What&apos;s better than a sound going off midday, mid-work, because one of your agents
              just closed something.
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

      {/* How it works */}
      <section id="how" className="border-t">
        <div className="mx-auto max-w-280 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 flex max-w-[52ch] flex-col gap-3 sm:mb-12">
            <span className={eyebrow}>How it works</span>
            <h2 className={sectionTitle}>Three steps, then it runs itself</h2>
          </div>

          <ol className="grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-3">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-6"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-1 text-[15px] font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-t bg-muted/40">
        <div className="mx-auto max-w-280 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 flex max-w-[52ch] flex-col gap-3 sm:mb-12">
            <span className={eyebrow}>Built for every seat</span>
            <h2 className={sectionTitle}>Four roles, four different home screens</h2>
            <p className="leading-relaxed text-muted-foreground">
              Sign in and you land on the page that is yours. Nobody has to scroll past a view they
              were never going to use.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <div
                key={role.name}
                className="flex flex-col gap-2 rounded-xl border bg-background p-6"
              >
                <div className="mb-1.5 flex size-8 items-center justify-center rounded-lg border bg-muted">
                  <role.icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <h3 className="text-[15px] font-semibold">{role.name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{role.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t">
        <div className="mx-auto flex max-w-280 flex-col items-center gap-9 px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex max-w-[46ch] flex-col items-center gap-3 text-center">
            <span className={eyebrow}>Pricing</span>
            <h2 className={sectionTitle}>It is free. All of it.</h2>
            <p className="leading-relaxed text-muted-foreground">
              There is no paid tier hiding behind a feature flag. Every plan includes everything.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'flex flex-col gap-2.5 rounded-xl border bg-background p-6',
                  plan.featured && 'border-foreground shadow-[0_12px_32px_-18px_var(--foreground)]'
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
                  <span className="text-[38px] font-semibold tracking-tighter">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.note}</span>
                </div>

                <LinkButton
                  href={plan.href}
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
      <section id="faq" className="border-t bg-muted/40">
        <div className="mx-auto grid max-w-280 grid-cols-1 gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[340px_1fr] lg:gap-14">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-[28px] leading-tight font-semibold tracking-tighter sm:text-[32px]">
              Frequently asked
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Still stuck?{' '}
              <Link href="#contact" className="underline underline-offset-[3px]">
                Talk to the developer
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

      {/* Closing CTA — inverted band, driven off the primary pair so it flips with the theme. */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-280 flex-col items-center gap-5 px-4 py-18 text-center sm:px-6 sm:py-22">
          <h2 className="max-w-[20ch] text-[32px] leading-tight font-semibold tracking-tighter sm:text-[40px]">
            Your team is one loud dashboard away
          </h2>
          <p className="max-w-[52ch] text-[16px] leading-relaxed text-primary-foreground/70 sm:text-[17px]">
            Free forever, five minutes to set up, and nobody has to ask &quot;how many did we get
            today?&quot; ever again.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-3 pt-2 sm:max-w-none sm:flex-row sm:justify-center">
            <LinkButton
              href="/sign-up"
              className={cn(ctaSize, 'bg-background text-foreground hover:bg-background/85')}
            >
              Create an account
            </LinkButton>
            <LinkButton
              href="/sign-in"
              variant="outline"
              className={cn(
                ctaSize,
                'border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground dark:bg-transparent'
              )}
            >
              Sign in
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto grid max-w-280 grid-cols-2 gap-10 px-4 pt-14 pb-8 sm:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-2.5 lg:col-span-1">
            <Logo size={22} />
            <p className="max-w-[34ch] text-[13px] leading-relaxed text-muted-foreground">
              The live lead board for real-estate teams. Log it, hear it, count it.
            </p>
          </div>

          {[
            {
              title: 'Product',
              links: [
                { label: 'Features', href: '#features' },
                { label: 'How it works', href: '#how' },
                { label: 'Roles', href: '#roles' },
                { label: 'Pricing', href: '#pricing' },
              ],
            },
            {
              title: 'Account',
              links: [
                { label: 'Sign in', href: '/sign-in' },
                { label: 'Create an account', href: '/sign-up' },
                { label: 'FAQ', href: '#faq' },
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

        <div className="mx-auto max-w-280 px-4 pb-10 sm:px-6">
          <div className="flex flex-col gap-2 border-t pt-5 text-xs text-muted-foreground/70 sm:flex-row sm:justify-between">
            <span>© 2026 Daily Dashboard</span>
            <span className="font-mono">Built different</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
