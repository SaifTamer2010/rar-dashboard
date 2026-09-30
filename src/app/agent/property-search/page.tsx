'use client'

import RoleGate from '@/components/RoleGate'

import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const cardClass = "rounded-xl border bg-background"

/** Whatever the search service answers with. Every field is optional — we render what we get. */
type PropertyDetails = {
  link?: string
  property_type?: string
  estimate?: string | number
  beds?: string | number
  baths?: string | number
  sqft?: string | number
  lot_sqft?: string | number
  year_built?: string | number
  address?: string
  status?: string
  last_sold_price?: string | number
  last_sold_date?: string
}

type PropertyMatch = {
  id?: string
  address?: string
  status?: string
  property?: PropertyDetails
}

type SearchResponse = {
  results?: PropertyMatch[]
  property?: PropertyDetails
}

const DETAIL_FIELDS: { label: string; key: keyof PropertyDetails }[] = [
  { label: 'Link', key: 'link' },
  { label: 'Property type', key: 'property_type' },
  { label: 'Estimate', key: 'estimate' },
  { label: 'Beds', key: 'beds' },
  { label: 'Baths', key: 'baths' },
  { label: 'Sqft', key: 'sqft' },
  { label: 'Lot sqft', key: 'lot_sqft' },
  { label: 'Year built', key: 'year_built' },
  { label: 'Address', key: 'address' },
  { label: 'Status', key: 'status' },
  { label: 'Last sold price', key: 'last_sold_price' },
  { label: 'Last sold date', key: 'last_sold_date' },
]

// No search service ships with this repo — point this at yours to switch the page on.
const SEARCH_URL = process.env.NEXT_PUBLIC_PROPERTY_SEARCH_URL

const Page = () => {
    const [dataResponse, setDataResponse] = useState('null')
    const [matches, setMatches] = useState<PropertyMatch[]>([])
    const [property, setProperty] = useState<PropertyDetails | null>(null)
    const [searchBar, setSearchBar] = useState('')
    const [loading, setLoading] = useState(false)

    const clear = () => {
        setMatches([])
        setProperty(null)
        setDataResponse('null')
    }

    const runSearch = async (rawQuery: string) => {
        const query = rawQuery.trim()

        if (!SEARCH_URL) {
            toast.error('Property search is not configured yet.')
            return
        }

        if (!query) {
            toast.error('Type an address first.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(SEARCH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            })

            if (!res.ok) {
                throw new Error(`Search failed (${res.status})`)
            }

            const data: SearchResponse = await res.json()

            if (data.property) {
                setMatches([])
                setProperty(data.property)
                setDataResponse('property-received')
            } else if (data.results?.length) {
                setProperty(null)
                setMatches(data.results)
                setDataResponse('search-received')
            } else {
                clear()
                toast('No properties matched that address.')
            }
        } catch (err) {
            clear()
            toast.error(
                err instanceof Error ? err.message : 'Could not reach the property search service.',
            )
        } finally {
            setLoading(false)
        }
    }

    const submitSearch = () => runSearch(searchBar)

    // A match either carries its details already, or we re-run the search on its address.
    const openMatch = (match: PropertyMatch) => {
        if (match.property) {
            setMatches([])
            setProperty(match.property)
            setDataResponse('property-received')
            return
        }

        if (match.address) {
            setSearchBar(match.address)
            runSearch(match.address)
        }
    }

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-240 px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Property search</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Look up a property through Realtor by address.
          </p>
        </div>

        {!SEARCH_URL && (
          <div className="mb-4 rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground">
            Property search is switched off. Set{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-[13px]">
              NEXT_PUBLIC_PROPERTY_SEARCH_URL
            </code>{' '}
            to the address of your search service to turn it on.
          </div>
        )}

        <div className={`${cardClass} p-4`}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchBar}
                onChange={(e) => setSearchBar(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                disabled={!SEARCH_URL}
                placeholder="123 Main St, Chicago, IL 60601"
                className="w-full rounded-lg border bg-background py-2.5 pr-3 pl-9 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <button
              onClick={submitSearch}
              disabled={loading || !SEARCH_URL}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {dataResponse === 'search-received' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`${cardClass} mt-4 overflow-hidden`}
            >
              <p className="border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">Matches</p>
              <div className="divide-y">
                {matches.map((match, i) => (
                  <button
                    key={match.id ?? `${match.address ?? 'match'}-${i}`}
                    onClick={() => openMatch(match)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate text-sm font-medium">
                      {match.address ?? 'Unknown address'}
                    </span>
                    {match.status && (
                      <span className="shrink-0 rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {match.status}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {dataResponse === 'property-received' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`${cardClass} mt-4 p-6`}
            >
              <h2 className="text-[15px] font-semibold tracking-tight">Property details</h2>

              <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {DETAIL_FIELDS.map(({ label, key }) => {
                  const value = property?.[key]

                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b pb-2"
                    >
                      <dt className="text-[13px] text-muted-foreground">{label}</dt>
                      <dd className="truncate text-sm font-medium">
                        {value === undefined || value === null || value === '' ? (
                          '—'
                        ) : key === 'link' ? (
                          <a
                            href={String(value)}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            Open listing
                          </a>
                        ) : (
                          String(value)
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function GuardedPropertySearchPage() {
  return (
    <RoleGate role="agent">
      <Page />
    </RoleGate>
  )
}
