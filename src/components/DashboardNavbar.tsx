'use client'
import React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

const DashboardNavbar = () => {
    return (
        <div className="w-full flex justify-between items-center mb-5 bg-slate-900 p-4 rounded-2xl backdrop-blur-md sticky top-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-300"><span className='text-gray-400'>Daily Dashboard</span> {`/`} Power Ringers</h1>
            <div className=" flex justify-between gap-4">
                <Link
                    href="/settings"
                    className="text-md md:text-xl font-bold mb-2 bg-slate-800 w-30 h-12 rounded-xl shadow-black shadow-2xl hover:bg-slate-700 transition-all cursor-pointer flex justify-center items-center"
                >
                    Settings
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: "/sign-in" })}
                    className="text-md md:text-lg font-semibold mb-2 bg-red-800 w-30 h-12 rounded-xl shadow-black shadow-2xl hover:bg-red-700 transition-all cursor-pointer flex justify-center items-center"
                >
                    Sign out
                </button>
            </div>
        </div>
    )
}

export default DashboardNavbar