"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Rocket, X } from "lucide-react";

interface FeatureUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeatureUpdateModal({ isOpen, onClose }: FeatureUpdateModalProps) {
  const features = [
    {
      title: "Global Sound Store",
      description: "Not up yet but upload more sounds for now😉",
      icon: <Sparkles className="w-5 h-5 text-blue-400" />,
    },
    {
      title: "Personal Presets",
      description: "Quickly swap between your last 2 uploaded sounds directly from your settings.",
      icon: <Check className="w-5 h-5 text-emerald-400" />,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 40,
              rotateX: -10,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            }}
            className="relative w-full max-w-xl bg-slate-900 border-2 border-blue-500/20 rounded-[3.5rem] p-10 shadow-[0_0_50px_rgba(59,130,246,0.15)] overflow-hidden"
          >
            {/* Top Border Accent */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>

            {/* Header */}
            <div className="space-y-4 mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">System Upgrade</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                v1.1.0 <span className="text-blue-500">LIVE</span>
              </h2>
              <p className="text-gray-400 font-medium leading-relaxed">
                The dashboard has evolved.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-6 mb-10">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="flex gap-5 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-950/60 border border-white/5 rounded-2xl flex items-center justify-center group-hover:border-blue-500/30 transition-all">
                    {feature.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black uppercase italic text-sm text-blue-100 tracking-wide">{feature.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black uppercase tracking-[0.3em] py-6 rounded-[2rem] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              LET'S GO <Rocket className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
