import type { ReactNode } from 'react'

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      {(title || right) && (
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

/** Barra de avance; en gastos se pone ámbar al pasar el 90% y roja al pasarse. */
export function Barra({ valor, max, meta }: { valor: number; max: number; meta?: boolean }) {
  const pct = max > 0 ? Math.min(valor / max, 1) * 100 : 0
  // En una meta (ahorro) llenar la barra es bueno; en un gasto, pasarse es malo.
  const color = meta ? 'bg-emerald-500' : valor > max ? 'bg-rose-500' : valor / max > 0.9 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Fila({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${strong ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
