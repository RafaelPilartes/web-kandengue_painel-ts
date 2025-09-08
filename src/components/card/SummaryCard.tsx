export function SummaryCard({ title, value, icon, color }: any) {
  const borderColorMap: any = {
    blue: 'border-blue-600',
    green: 'border-green-500',
    orange: 'border-orange-500',
    yellow: 'border-yellow-500'
  }
  const textColorMap: any = {
    blue: 'text-blue-600',
    green: 'text-green-500',
    orange: 'text-orange-500',
    yellow: 'text-yellow-500'
  }
  return (
    <div
      className={`flex flex-col justify-start items-start gap-3 p-6 bg-light dark:bg-dark rounded-md shadow-3xl border-b-8 ${borderColorMap[color]}`}
    >
      <div className={textColorMap[color]}>{icon}</div>
      <p className="text-base mt-2">{title}</p>
      <h3 className="text-3xl font-semibold">{value}</h3>
    </div>
  )
}
