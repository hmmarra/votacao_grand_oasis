'use client'

import Image from 'next/image'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo_grand_oasis.webp"
              alt="Grand Oasis Poá Logo"
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Grand Oasis Poá
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © 2025
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-right">
            <p>Desenvolvido por <span className="font-medium text-gray-600 dark:text-gray-300">Luis Marra</span></p>
          </div>
        </div>
      </div>
    </footer>
  )
}

