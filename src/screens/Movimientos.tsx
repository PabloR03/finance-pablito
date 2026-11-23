import { useState } from 'react'
import { Card } from '../components/ui'
import { db } from '../db/db'
import type { Datos } from '../hooks'
import { delMes, mesActual, q } from '../lib/budget'

const NOMBRE_CUENTA = { 'bi-monetaria': 'BI Monetaria', 'bi-ahorro': 'BI Ahorro', banrural: 'Banrural' } as const

export function Movimientos({ datos }: { datos: Datos }) {
  const [mes, setMes] = useState(mesActual())
  const [borrar, setBorrar] = useState<number>()
  const cat = new Map(datos.categorias.map((c) => [c.id, c.nombre]))
  const lista = delMes(datos.movimientos, mes)

  return (
    <div className="space-y-4">
      <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="rounded-lg bg-slate-900 p-2 ring-1 ring-slate-700" />
      <Card>
        {lista.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Sin movimientos este mes</p>}
        <ul className="divide-y divide-slate-800">
          {lista.map((m) => {
            const titulo =
              m.tipo === 'gasto'
                ? cat.get(m.categoriaId!) ?? 'Gasto'
                : m.tipo === 'ingreso'
                  ? 'Ingreso'
                  : `${NOMBRE_CUENTA[m.cuentaOrigen]} → ${NOMBRE_CUENTA[m.cuentaDestino!]}`
            const signo = m.tipo === 'gasto' ? '−' : m.tipo === 'ingreso' ? '+' : ''
            const color = m.tipo === 'gasto' ? 'text-rose-300' : m.tipo === 'ingreso' ? 'text-emerald-300' : 'text-sky-300'
            return (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{titulo}</p>
                  <p className="truncate text-xs text-slate-500">
                    {m.fecha.slice(8)}/{m.fecha.slice(5, 7)} · {m.nota ?? NOMBRE_CUENTA[m.cuentaOrigen]}
                  </p>
                </div>
                <span className={`tabular-nums text-sm ${color}`}>
                  {signo}
                  {q(m.monto, 2)}
                </span>
                {borrar === m.id ? (
                  <button onClick={() => db.movimientos.delete(m.id!)} className="rounded-lg bg-rose-600 px-2 py-1 text-xs">
                    Borrar
                  </button>
                ) : (
                  <button onClick={() => setBorrar(m.id)} aria-label="Borrar" className="px-1 text-slate-500">
                    ✕
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
