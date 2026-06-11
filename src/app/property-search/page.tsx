'use client'

import {motion, AnimatePresence} from 'framer-motion'
import { Home } from 'lucide-react'
import { useState } from 'react'

const page = () => {
    const [dataResponse, setDataResponse] = useState('null')
    const [searchBar,setSearchBar] = useState('')
    const [loading,setLoading] = useState(false)

    const submitSearch = async () =>{
        setLoading(true)
        try {
            const res = await fetch('http://localhost:8000/search',
                {
                    method:"POST",
                    body:searchBar
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
    <div className=' grid grid-rows-[1fr_3fr] gap-6 p-4'>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-6 bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border-2 border-blue-500/20 shadow-2xl shadow-blue-500/5 relative"
        >
            <header className='w-full'>
             <h3 className="text-2xl font-bold text-white  uppercase tracking-widest text-center">
               Search property through realtor
              </h3>
            </header>

            <div className='flex justify-center gap-4'>
            <input className='bg- backdrop-blur-3xl p-4 rounded-[1rem] border-1 border-blue-600/20 shadow-2xl shadow-blue-500/5 w-150 focus:outline-blue-300/20 focus:outline-2 relative' 
            onChange={(e)=>setSearchBar(e.target.value)}/>

            <div className="flex items-end">
            <button
              onClick={submitSearch}
             className={`flex items-center gap-2 h-12 px-8 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${loading
                ?  "bg-slate-800/50 text-gray-600 border-2 border-white/5 cursor-not-allowed":"bg-blue-500/10 text-blue-500 border-2 border-blue-500/20 hover:bg-blue-500 hover:text-white"
                }`}
            >
              Search
            </button>
          </div>
          </div>

        {dataResponse == "search-received" && <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className=" bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[1.5rem] border-2 border-blue-500/20 shadow-2xl shadow-blue-500/5 absolute top-45 w-220 max-h-150 flex flex-col gap-4"
        >
            <div className='text-xl border-b-1 border-slate-900/100 pb-2 hover:bg-slate-900/100 transition-all p-2 flex flex-col gap-2 cursor-pointer rounded-md'>
                <h1>123 Main st,Chicago,Il 23457</h1>
                <h1>Sold</h1>
            </div>
       
        </motion.div>}
        
           
            
        </motion.div>

        {dataResponse == 'property-received' && <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className=" bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[2.5rem] border-2 border-blue-500/20 shadow-2xl shadow-blue-500/5"
        >
           <header className=''>
             <h3 className="text-2xl font-bold text-white mb-8 uppercase tracking-widest w-screen inline-flex gap-2">
              <Home className='mr-2 mt-0.5'/> Property <span className='text-blue-500'>details</span>
              </h3>
            </header>
            <div>
                <h6>link</h6>
                <h6>property type</h6>
                <h6>estimate</h6>
                <h6>beds</h6>
                <h6>baths</h6>
                <h6>sqft</h6>
                <h6>lot sqft</h6>
                <h6>year built</h6>
                <h6>address</h6>
                <h6>status</h6>
                <h6>last sold price</h6>
                <h6>last sold date</h6>
            </div>
        </motion.div>}
    </div>
  )
}

export default page