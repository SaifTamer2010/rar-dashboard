'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useState } from 'react'

const cardClass = "rounded-xl border bg-background"

const Page = () => {
    const [dataResponse, setDataResponse] = useState('null')
    const [searchBar, setSearchBar] = useState('')
    const [loading, setLoading] = useState(false)

    const submitSearch = async () => {
        setLoading(true)
        try {
            const res = await fetch('http://localhost:8000/search',
                {
                    method: "POST",
                    body: searchBar
                }
            )

            const data = await res.json()
            console.log(data)
            setLoading(false)
        } catch (err) {
            console.log(err)
            setLoading(false)
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

        <div className={`${cardClass} p-4`}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchBar}
                onChange={(e) => setSearchBar(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                placeholder="123 Main St, Chicago, IL 60601"
                className="w-full rounded-lg border bg-background py-2.5 pr-3 pl-9 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10"
              />
            </div>
            <button
              onClick={submitSearch}
              disabled={loading}
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
                <button className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50">
                  <span className="truncate text-sm font-medium">123 Main St, Chicago, IL 23457</span>
                  <span className="shrink-0 rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Sold
                  </span>
                </button>
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
                {[
                  'Link',
                  'Property type',
                  'Estimate',
                  'Beds',
                  'Baths',
                  'Sqft',
                  'Lot sqft',
                  'Year built',
                  'Address',
                  'Status',
                  'Last sold price',
                  'Last sold date',
                ].map((label) => (
                  <div key={label} className="flex items-center justify-between gap-4 border-b pb-2">
                    <dt className="text-[13px] text-muted-foreground">{label}</dt>
                    <dd className="truncate text-sm font-medium">—</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default Page
