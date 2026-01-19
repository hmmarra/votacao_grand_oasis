'use client'

import Image from 'next/image'

export function Footer() {
  return (
    <footer className="w-full flex justify-center py-8 shrink-0 z-40">
      <div className="flex flex-col sm:flex-row items-center gap-x-6 gap-y-4 px-8 py-4 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl sm:rounded-full shadow-2xl text-[10px] font-bold uppercase tracking-widest text-slate-500/60 dark:text-slate-500/40 transition-all duration-300 hover:border-slate-700/60 hover:bg-slate-900/60 w-fit">
        <div className="flex items-center gap-2">
          <Image
            src="/img/logo_grand_oasis.webp"
            alt="Meu Condomínio Logo"
            width={18}
            height={18}
            className="h-4 w-auto object-contain opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
            style={{ height: 'auto' }}
          />
          <span className="text-slate-500">Meu Condomínio</span>
        </div>

        <span className="hidden sm:block opacity-30">•</span>

        <span className="text-slate-500/50">© 2026</span>

        <span className="hidden sm:block opacity-30">•</span>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-slate-500/40">Desenvolvido por</span>
          <span className="text-slate-400 font-black">Luis Marra</span>
        </div>
      </div>
    </footer>
  )
}

