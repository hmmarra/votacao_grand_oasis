'use client'

import Image from 'next/image'

export function Footer() {
  return (
    <footer className="w-full flex justify-center py-6 shrink-0 z-40">
      <div className="inline-flex items-center gap-x-6 gap-y-2 px-6 py-3 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-full shadow-2xl text-[10px] font-bold uppercase tracking-widest text-slate-500/60 dark:text-slate-500/40 transition-all duration-300 hover:border-slate-700/60 hover:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Image
            src="/img/logo_grand_oasis.webp"
            alt="Meu Condomínio Logo"
            width={18}
            height={18}
            className="h-4 w-auto object-contain opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
            style={{ height: 'auto' }}
          />
          <span className="text-slate-500 dark:text-slate-500">Meu Condomínio</span>
        </div>

        <span className="opacity-30">•</span>

        <span>© 2026</span>

        <span className="opacity-30">•</span>

        <div className="flex items-center gap-1">
          <span>Desenvolvido por</span>
          <span className="text-slate-500 dark:text-slate-400">Luis Marra</span>
        </div>
      </div>
    </footer>
  )
}

