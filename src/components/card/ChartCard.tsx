export function ChartCard({
  title,
  chart
}: {
  title: string
  chart: React.ReactNode
}) {
  return (
    <div className="bg-light dark:bg-dark p-6 rounded-md shadow-3xl">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {chart}
    </div>
  )
}
