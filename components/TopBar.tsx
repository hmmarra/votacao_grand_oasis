'use client'

import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/lib/auth'

export function TopBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const isAdminPage = pathname === '/admin'

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo e Link para Pautas */}
          <div className="flex items-center gap-4">
            <Image
              src="/img/logo_grand_oasis.webp"
              alt="Grand Oasis Poá Logo"
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
            <button
              onClick={() => router.push('/pautas')}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 hover:bg-violet-700 text-sm font-medium transition-colors h-9"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M19.5 12a.75.75 0 0 1-.75.75H7.31l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 1 1 1.06 1.06l-3.22 3.22h11.44c.414 0 .75.336.75.75Z" clipRule="evenodd"/>
              </svg>
              Pautas
            </button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Admin Button (only for Administradores) */}
            {user?.acesso === 'Administrador' && (
              <button
                onClick={() => router.push(isAdminPage ? '/pautas' : '/admin')}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 hover:bg-violet-700 text-sm font-medium transition-colors h-9"
              >
                {isAdminPage ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M19.5 12a.75.75 0 0 1-.75.75H7.31l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 1 1 1.06 1.06l-3.22 3.22h11.44c.414 0 .75.336.75.75Z" clipRule="evenodd"/>
                    </svg>
                    Ir Pautas
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd"/>
                    </svg>
                    Admin
                  </>
                )}
              </button>
            )}

            {/* Divider */}
            {user && (
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            )}

            {/* User Menu */}
            {user && (
              <div className="relative group">
                <button className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm font-medium transition-all h-9">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.nome.split(' ')[0]}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l7.47-7.47a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd"/>
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-2">
                    <div className="px-3 py-3 text-sm border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{user.nome}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {user.acesso} • AP {user.apartamento} • Torre {user.torre}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        logout()
                        router.push('/login')
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9a.75.75 0 0 1-1.5 0V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H12a.75.75 0 0 1 0-1.5h8.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                        </svg>
                        Sair
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

