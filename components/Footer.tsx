'use client'

import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo_grand_oasis.webp"
              alt="Grand Oasis Poá Logo"
              width={60}
              height={60}
              className="h-12 w-auto object-contain"
            />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Sistema de Votação - Grand Oasis Poá
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © 2025 Grand Oasis Poá. Todos os direitos reservados.
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-right">
            <p>Desenvolvido para assembleias e votações</p>
            <p className="mt-1">Desenvolvido por <span className="font-semibold">Luis Marra</span></p>
          </div>
        </div>
      </div>
    </footer>
  )
}

