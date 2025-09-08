import { useEffect, useState } from 'react'

interface ListItemProps {
  title: string
  subtitle?: string
  extra?: string
}

function SimpleList({ title, data }: { title: string; data: ListItemProps[] }) {
  return (
    <div className="w-full bg-light dark:bg-dark rounded-xl shadow p-6">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.length === 0 ? (
          <li className="text-gray-500 text-sm">Nenhum registro encontrado.</li>
        ) : (
          data.map((item, index) => (
            <li key={index} className="py-3 flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.subtitle}
                  </p>
                )}
              </div>
              {item.extra && (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {item.extra}
                </span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

export function AdminListsSection() {
  const [appointments, setAppointments] = useState<ListItemProps[]>([])
  const [payments, setPayments] = useState<ListItemProps[]>([])

  useEffect(() => {
    // Simulação de dados mockados
    const mockAppointments: ListItemProps[] = [
      {
        title: 'João da Silva',
        subtitle: 'Fisioterapia - 06/05/2025',
        extra: 'AOA 120,000'
      },
      {
        title: 'Maria Santos',
        subtitle: 'Enfermagem - 07/05/2025',
        extra: 'AOA 95,000'
      },
      {
        title: 'Pedro Oliveira',
        subtitle: 'Cuidador - 08/05/2025',
        extra: 'AOA 105,000'
      },
      {
        title: 'Ana Clara',
        subtitle: 'Fonoaudiologia - 09/05/2025',
        extra: 'AOA 140,000'
      },
      {
        title: 'Carlos Moura',
        subtitle: 'Fisioterapia - 10/05/2025',
        extra: 'AOA 110,000'
      }
    ]

    const mockPayments: ListItemProps[] = [
      {
        title: 'João da Silva',
        subtitle: 'Pago em 05/05/2025',
        extra: 'AOA 120,000'
      },
      {
        title: 'Maria Santos',
        subtitle: 'Pago em 04/05/2025',
        extra: 'AOA 95,000'
      },
      {
        title: 'Pedro Oliveira',
        subtitle: 'Pago em 03/05/2025',
        extra: 'AOA 105,000'
      },
      {
        title: 'Ana Clara',
        subtitle: 'Pago em 02/05/2025',
        extra: 'AOA 140,000'
      },
      {
        title: 'Carlos Moura',
        subtitle: 'Pago em 01/05/2025',
        extra: 'AOA 110,000'
      }
    ]

    setAppointments(mockAppointments)
    setPayments(mockPayments)
  }, [])

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
      <SimpleList title="📅 Próximos Agendamentos" data={appointments} />
      <SimpleList title="💳 Pagamentos Recentes" data={payments} />
    </div>
  )
}
