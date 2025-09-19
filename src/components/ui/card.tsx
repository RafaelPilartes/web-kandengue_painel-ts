export function Card({ title, value, icon }: any) {
  return (
    <div className="p-4 rounded-xl bg-light dark:bg-dark shadow-3xl border-b-4 border-gray-300 dark:border-gray-600 flex items-center gap-3">
      <div className="p-2 bg-gray-400 dark:bg-gray-200 text-gray-500 dark:text-gray-600 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-200">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  )
}
