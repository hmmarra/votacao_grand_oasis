'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredAccess?: 'Administrador' | 'Morador' | 'Engenharia' | 'Desenvolvedor'
}

export function ProtectedRoute({ children, requiredAccess }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.push('/login')
        return
      }

      if (requiredAccess === 'Administrador' &&
        user.acesso !== 'Administrador' &&
        user.acesso !== 'Desenvolvedor') {
        router.push('/pautas')
        return
      }
    }
  }, [user, loading, mounted, router, requiredAccess])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredAccess === 'Administrador' &&
    user.acesso !== 'Administrador' &&
    user.acesso !== 'Desenvolvedor') {
    return null
  }

  return <>{children}</>
}

