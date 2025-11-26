'use client'

import { useEffect } from 'react'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'terms' | 'privacy'
}

export function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
  // Bloquear scroll do body quando modal estiver aberto
  useBodyScrollLock(isOpen)
  
  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isTerms = type === 'terms'

  const content = isTerms ? (
    <div className="space-y-4 text-gray-700 dark:text-gray-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Termos de Uso</h2>
      
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">1. Aceitação dos Termos</h3>
        <p className="text-sm leading-relaxed">
          Ao acessar e utilizar o Sistema de Votação do Condomínio Grand Oasis Poá, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concorda com qualquer parte destes termos, não deve utilizar o sistema.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">2. Uso do Sistema</h3>
        <p className="text-sm leading-relaxed">
          O sistema é destinado exclusivamente para moradores e administradores autorizados do Condomínio Grand Oasis Poá. É proibido:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
          <li>Compartilhar suas credenciais de acesso com terceiros</li>
          <li>Tentar acessar contas de outros usuários</li>
          <li>Manipular ou interferir no processo de votação</li>
          <li>Utilizar o sistema para fins não autorizados</li>
          <li>Realizar tentativas de acesso não autorizado ou violação de segurança</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">3. Responsabilidades do Usuário</h3>
        <p className="text-sm leading-relaxed">
          Você é responsável por:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
          <li>Manter a confidencialidade de suas credenciais de acesso</li>
          <li>Notificar imediatamente sobre qualquer uso não autorizado de sua conta</li>
          <li>Garantir que as informações fornecidas sejam verdadeiras e atualizadas</li>
          <li>Utilizar o sistema de forma ética e respeitosa</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">4. Processo de Votação</h3>
        <p className="text-sm leading-relaxed">
          Cada usuário autorizado possui direito a um voto por pauta. O voto é secreto e não pode ser alterado após a confirmação, exceto em casos especiais autorizados pela administração. Os resultados das votações são divulgados de acordo com as regras estabelecidas pelo condomínio.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">5. Modificações e Suspensão</h3>
        <p className="text-sm leading-relaxed">
          A administração reserva-se o direito de modificar, suspender ou encerrar o acesso ao sistema a qualquer momento, sem aviso prévio, em caso de violação destes termos ou por questões de segurança e manutenção.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">6. Limitação de Responsabilidade</h3>
        <p className="text-sm leading-relaxed">
          O sistema é fornecido "como está", sem garantias de qualquer tipo. A administração não se responsabiliza por interrupções, erros técnicos ou perda de dados decorrentes do uso do sistema, exceto em casos de negligência comprovada.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">7. Lei Aplicável</h3>
        <p className="text-sm leading-relaxed">
          Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais competentes do Brasil.
        </p>
      </section>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  ) : (
    <div className="space-y-4 text-gray-700 dark:text-gray-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Política de Privacidade e Proteção de Dados</h2>
      
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">1. Introdução</h3>
        <p className="text-sm leading-relaxed">
          Esta Política de Privacidade descreve como o Sistema de Votação do Condomínio Grand Oasis Poá coleta, usa, armazena e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">2. Dados Coletados</h3>
        <p className="text-sm leading-relaxed">
          Coletamos os seguintes dados pessoais para operação do sistema:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
          <li><strong>Dados de Identificação:</strong> Nome completo, CPF</li>
          <li><strong>Dados de Contato:</strong> Email (quando fornecido)</li>
          <li><strong>Dados de Localização:</strong> Número do apartamento e torre</li>
          <li><strong>Dados de Acesso:</strong> Credenciais de login e registros de acesso</li>
          <li><strong>Dados de Votação:</strong> Opções escolhidas nas pautas (mantidas de forma segura e confidencial)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">3. Finalidade do Tratamento</h3>
        <p className="text-sm leading-relaxed">
          Seus dados pessoais são utilizados exclusivamente para:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
          <li>Identificação e autenticação no sistema</li>
          <li>Validação de elegibilidade para votação</li>
          <li>Registro e contabilização de votos</li>
          <li>Comunicação sobre pautas e resultados de votações</li>
          <li>Garantia da segurança e integridade do processo eleitoral</li>
          <li>Cumprimento de obrigações legais e regulatórias</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">4. Base Legal</h3>
        <p className="text-sm leading-relaxed">
          O tratamento de seus dados pessoais é baseado em:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
          <li><strong>Consentimento:</strong> Ao aceitar esta política, você consente com o tratamento de seus dados</li>
          <li><strong>Execução de Contrato:</strong> Necessário para o funcionamento do sistema de votação</li>
          <li><strong>Legítimo Interesse:</strong> Garantia da segurança e integridade do processo eleitoral</li>
          <li><strong>Cumprimento de Obrigação Legal:</strong> Atendimento a requisitos legais e regulatórios</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">5. Compartilhamento de Dados</h3>
        <p className="text-sm leading-relaxed">
          Seus dados pessoais não são compartilhados com terceiros, exceto:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
          <li>Quando necessário para cumprimento de obrigação legal ou ordem judicial</li>
          <li>Com prestadores de serviços técnicos (hospedagem, segurança) sob rigorosos acordos de confidencialidade</li>
          <li>Com a administração do condomínio para fins de gestão e transparência, respeitando a confidencialidade dos votos</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">6. Segurança dos Dados</h3>
        <p className="text-sm leading-relaxed">
          Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição, incluindo:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
          <li>Criptografia de dados sensíveis</li>
          <li>Controles de acesso baseados em autenticação</li>
          <li>Monitoramento contínuo de segurança</li>
          <li>Backups regulares e planos de recuperação</li>
          <li>Treinamento de pessoal autorizado</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">7. Retenção de Dados</h3>
        <p className="text-sm leading-relaxed">
          Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política ou conforme exigido por lei. Dados de votação são mantidos para fins de auditoria e transparência, respeitando os prazos legais aplicáveis.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">8. Seus Direitos (LGPD)</h3>
        <p className="text-sm leading-relaxed">
          De acordo com a LGPD, você possui os seguintes direitos:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
          <li><strong>Confirmação e Acesso:</strong> Saber se tratamos seus dados e acessá-los</li>
          <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
          <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> Solicitar remoção de dados desnecessários</li>
          <li><strong>Portabilidade:</strong> Solicitar portabilidade dos dados para outro fornecedor</li>
          <li><strong>Eliminação:</strong> Solicitar eliminação de dados tratados com base em consentimento</li>
          <li><strong>Revogação de Consentimento:</strong> Revogar seu consentimento a qualquer momento</li>
          <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em certas circunstâncias</li>
        </ul>
        <p className="text-sm leading-relaxed mt-2">
          Para exercer seus direitos, entre em contato com a administração do condomínio.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">9. Confidencialidade dos Votos</h3>
        <p className="text-sm leading-relaxed">
          Os votos individuais são mantidos em sigilo. Apenas resultados agregados são divulgados publicamente. A identidade dos votantes não é revelada, exceto quando necessário para auditoria legal ou investigação de irregularidades, sempre com autorização judicial quando aplicável.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">10. Alterações nesta Política</h3>
        <p className="text-sm leading-relaxed">
          Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas serão comunicadas através do sistema ou por outros meios apropriados. Recomendamos revisar esta política regularmente.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">11. Contato</h3>
        <p className="text-sm leading-relaxed">
          Para questões relacionadas a esta Política de Privacidade ou para exercer seus direitos, entre em contato com a administração do Condomínio Grand Oasis Poá.
        </p>
      </section>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  )

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isTerms ? 'Termos de Uso' : 'Política de Privacidade'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-violet-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}

