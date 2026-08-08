import { ReactNode } from 'react'

interface Column {
  key: string
  label: ReactNode
  align?: 'left' | 'center' | 'right'
}

interface TableProps {
  columns?: Column[]
  children?: ReactNode
  className?: string
}

const Table = ({ columns, children, className = '' }: TableProps) => {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        {columns && (
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">{children}</tbody>
      </table>
    </div>
  )
}

export default Table
