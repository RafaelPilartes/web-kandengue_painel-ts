// src/pages/main/AuditLogs/index.tsx
import { useMemo, useState } from 'react'
import { Spinner } from 'phosphor-react'
import {
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  User,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import { Pagination } from '@/components/Pagination'
import { SelectCustom } from '@/components/selects/SelectCustom'

import { useAuditLogViewModel } from '@/viewModels/AuditLogViewModel'
import type { AuditLogInterface, AuditModule } from '@/interfaces/IAuditLog'
import type { LogActionType } from '@/types/enum'
import { rowPerPageOptions } from '@/data/selectOption'

const moduleOptions = [
  { value: '', label: 'Todos' },
  { value: 'auth', label: 'Autenticação' },
  { value: 'passengers', label: 'Passageiros' },
  { value: 'drivers', label: 'Motoristas' },
  { value: 'admins', label: 'Administradores' },
  { value: 'applications', label: 'Candidaturas' },
  { value: 'rides', label: 'Corridas' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'topup_requests', label: 'Recargas' },
  { value: 'missions', label: 'Missões' },
  { value: 'notifications', label: 'Notificações' },
  { value: 'settings', label: 'Configurações' },
  { value: 'system', label: 'Sistema' }
]

const actionOptions = [
  { value: '', label: 'Todas' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Criar' },
  { value: 'read', label: 'Ler' },
  { value: 'update', label: 'Atualizar' },
  { value: 'delete', label: 'Excluir' },
  { value: 'access', label: 'Acesso' },
  { value: 'error', label: 'Erro' }
]

const severityOptions = [
  { value: '', label: 'Todas' },
  { value: 'info', label: 'Informação' },
  { value: 'warning', label: 'Aviso' },
  { value: 'critical', label: 'Crítico' }
]

function SeverityBadge({ severity }: { severity: string }) {
  const config = {
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      icon: <Info size={12} />
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      icon: <AlertTriangle size={12} />
    },
    critical: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      icon: <Shield size={12} />
    }
  }[severity] || {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    icon: <Info size={12} />
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.icon}
      {severity === 'info'
        ? 'Info'
        : severity === 'warning'
          ? 'Aviso'
          : 'Crítico'}
    </span>
  )
}

function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    login: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    logout: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    create: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    update: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
    delete: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    access: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    error: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
  }

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
        colorMap[action] || 'bg-gray-100 dark:bg-gray-700 text-gray-500'
      }`}
    >
      {action.toUpperCase()}
    </span>
  )
}

function LogRow({
  log,
  isExpanded,
  onToggle
}: {
  log: AuditLogInterface
  isExpanded: boolean
  onToggle: () => void
}) {
  const date = log.created_at
    ? new Date(log.created_at).toLocaleString('pt-AO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : 'N/A'

  return (
    <>
      <tr
        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs whitespace-nowrap">{date}</span>
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{log.admin_name}</span>
              <span className="text-xs text-gray-400">{log.admin_email}</span>
            </div>
          </div>
        </td>
        <td className="px-3 py-3">
          <ActionBadge action={log.action} />
        </td>
        <td className="px-3 py-3">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
            {log.module}
          </span>
        </td>
        <td className="px-3 py-3">
          <p className="text-sm max-w-xs truncate">{log.description}</p>
        </td>
        <td className="px-3 py-3">
          <SeverityBadge severity={log.severity} />
        </td>
        <td className="px-3 py-3">
          {log.success ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          )}
        </td>
        <td className="px-3 py-3">
          {isExpanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-gray-50/80 dark:bg-gray-800/40">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Context */}
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold text-xs uppercase text-gray-400">
                  Contexto
                </h4>
                <p>
                  <span className="text-gray-400">IP:</span> {log.ip_address}
                </p>
                <p>
                  <span className="text-gray-400">Sessão:</span>{' '}
                  <span className="text-xs font-mono">{log.session_id}</span>
                </p>
                <p>
                  <span className="text-gray-400">User Agent:</span>{' '}
                  <span className="text-xs break-all">
                    {log.user_agent?.substring(0, 80)}...
                  </span>
                </p>
                {log.location && (
                  <p className="flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    <span>
                      {log.location.city && `${log.location.city}, `}
                      {log.location.country || ''}
                      {log.location.latitude &&
                        ` (${log.location.latitude.toFixed(4)}, ${log.location.longitude?.toFixed(4)})`}
                    </span>
                  </p>
                )}
              </div>

              {/* Target */}
              {(log.target_id || log.target_type) && (
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-xs uppercase text-gray-400">
                    Alvo
                  </h4>
                  {log.target_type && (
                    <p>
                      <span className="text-gray-400">Tipo:</span>{' '}
                      {log.target_type}
                    </p>
                  )}
                  {log.target_id && (
                    <p>
                      <span className="text-gray-400">ID:</span>{' '}
                      <span className="font-mono text-xs">{log.target_id}</span>
                    </p>
                  )}
                  {log.target_label && (
                    <p>
                      <span className="text-gray-400">Nome:</span>{' '}
                      {log.target_label}
                    </p>
                  )}
                </div>
              )}

              {/* Changes */}
              {(log.changed_fields || log.error_message) && (
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-xs uppercase text-gray-400">
                    Detalhes
                  </h4>
                  {log.changed_fields && (
                    <p>
                      <span className="text-gray-400">Campos alterados:</span>{' '}
                      {log.changed_fields.join(', ')}
                    </p>
                  )}
                  {log.error_message && (
                    <p className="text-red-500">
                      <span className="text-gray-400">Erro:</span>{' '}
                      {log.error_message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Previous/New Data */}
            {(log.previous_data || log.new_data) && (
              <div className="mt-4 flex flex-col gap-4">
                <h4 className="font-semibold text-xs uppercase text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Comparação de Dados {log.action === 'update' ? '(Antes / Depois)' : ''}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {log.previous_data && (
                    <div className="flex flex-col h-full">
                      <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-t font-semibold text-xs border border-b-0 border-red-100 dark:border-red-900/30 flex items-center justify-between">
                        <span>Estado Anterior</span>
                        {log.action === 'delete' && <span className="bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded text-[10px] uppercase">Apagado</span>}
                      </div>
                      <pre className="bg-white dark:bg-gray-950 border border-red-100 dark:border-red-900/30 rounded-b p-4 text-xs overflow-auto max-h-96 text-gray-600 dark:text-gray-300 shadow-inner flex-1">
                        {JSON.stringify(log.previous_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.new_data && (
                    <div className="flex flex-col h-full">
                      <div className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 px-3 py-1.5 rounded-t font-semibold text-xs border border-b-0 border-green-100 dark:border-green-900/30 flex items-center justify-between">
                        <span>Estado Atual</span>
                        {log.action === 'create' && <span className="bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded text-[10px] uppercase">Criado</span>}
                      </div>
                      <pre className="bg-white dark:bg-gray-950 border border-green-100 dark:border-green-900/30 rounded-b p-4 text-xs overflow-auto max-h-96 text-gray-600 dark:text-gray-300 shadow-inner flex-1">
                        {JSON.stringify(log.new_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function AuditLogsPage() {
  const [currentPage, setCurrentPage] = useState(0)
  const [docsPerPage, setDocsPerPage] = useState(25)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const [selectedModule, setSelectedModule] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')

  const filters = useMemo(
    () => ({
      ...(selectedModule ? { module: selectedModule as AuditModule } : {}),
      ...(selectedAction ? { action: selectedAction as LogActionType } : {}),
      ...(selectedSeverity ? { severity: selectedSeverity } : {})
    }),
    [selectedModule, selectedAction, selectedSeverity]
  )

  const { logs, pagination, isLoading } = useAuditLogViewModel(
    docsPerPage,
    currentPage * docsPerPage,
    Object.keys(filters).length > 0 ? filters : undefined
  )

  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 25 : value
    setDocsPerPage(rowsPerPage)
    setCurrentPage(0)
  }

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* Header */}
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-6">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            Logs de Auditoria
          </h1>
          <Breadcrumbs
            items={[
              { label: 'Início', to: '/' },
              { label: 'Auditoria' }
            ]}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="w-full grid gap-4 md:grid-cols-4">
        <SelectSearchableCustom
          name="module"
          label="Módulo"
          options={moduleOptions}
          onOptionChange={e => setSelectedModule(e || '')}
        />
        <SelectSearchableCustom
          name="action"
          label="Ação"
          options={actionOptions}
          onOptionChange={e => setSelectedAction(e || '')}
        />
        <SelectSearchableCustom
          name="severity"
          label="Severidade"
          options={severityOptions}
          onOptionChange={e => setSelectedSeverity(e || '')}
        />
        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedModule('')
              setSelectedAction('')
              setSelectedSeverity('')
              setCurrentPage(0)
            }}
            className="py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-all text-sm"
          >
            <Filter size={14} />
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-6">
        <h2 className="text-xl font-bold text-dark dark:text-light">
          Registos de Actividade
        </h2>

        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-sm font-thin bg-gray-300/40 dark:bg-gray-500/40">
              <tr>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Admin</th>
                <th className="px-3 py-3">Ação</th>
                <th className="px-3 py-3">Módulo</th>
                <th className="px-3 py-3">Descrição</th>
                <th className="px-3 py-3">Severidade</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6">
                    <Spinner
                      size={28}
                      className="text-primary-200 animate-spin inline-block"
                    />
                  </td>
                </tr>
              ) : logs?.length ? (
                logs.map(log => (
                  <LogRow
                    key={log.id}
                    log={log}
                    isExpanded={expandedRow === log.id}
                    onToggle={() =>
                      setExpandedRow(
                        expandedRow === log.id ? null : log.id
                      )
                    }
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-6">
                    Nenhum registo de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="pt-4 flex flex-row justify-between items-center">
          <p className="text-xs flex flex-row gap-1">
            Mostrando
            <strong>
              {logs?.length ? currentPage * docsPerPage + 1 : 0}
            </strong>
            a
            <strong>
              {currentPage * docsPerPage + (logs?.length ?? 0)}
            </strong>
            de
            <strong>{pagination?.count ?? 0}</strong> registos
          </p>

          <div className="flex flex-row justify-center items-center gap-4 mb-3 max-w-s-640:flex-wrap">
            <div className="flex flex-row max-w-s-640:w-full max-w-s-640:flex-col justify-center items-center gap-4 mb-3 max-w-s-640:flex-wrap">
              <span>Registos por página: </span>
              <span className="max-w-24">
                <SelectCustom
                  options={rowPerPageOptions}
                  selectedValue={docsPerPage}
                  onChange={value => handleSelectChange(Number(value))}
                  padding="2"
                />
              </span>
            </div>
            <Pagination
              currentPage={currentPage}
              totalDocs={pagination?.count ?? 0}
              docsPerPage={docsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
