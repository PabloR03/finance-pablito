import { useState } from 'react'
import { db } from '../db/db'
import type { Datos } from '../hooks'
import { hoy } from '../lib/budget'
import type { CuentaId, TipoMovimiento } from '../lib/types'

const CUENTAS: { id: CuentaId; nombre: string }[] = [
  { id: 'bi-monetaria', nombre: 'BI Monetaria' },
  { id: 'bi-ahorro', nombre: 'BI Ahorro' },
  { id: 'banrural', nombre: 'Banrural' },
]

export function Registrar({ datos, onListo }: { datos: Datos; onListo: () => void }) {
  const [tipo, setTipo] = useState<Exclude<TipoMovimiento, 'transferencia'>>('gasto')
  const [monto, setMonto] = useState('')
  const [categoriaId, setCategoriaId] = useState<number>()
  const [cuenta, setCuenta] = useState<CuentaId>('bi-monetaria')
  const [fecha, setFecha] = useState(hoy())
  const [nota, setNota] = useState('')

  const valor = Number(monto.replace(',', '.'))
  const valido = valor > 0 && (tipo === 'ingreso' || categoriaId != null)

  async function guardar() {
    if (!valido) return
    await db.movimientos.add({
      fecha,
      monto: valor,
      tipo,
      categoriaId: tipo === 'gasto' ? categoriaId : undefined,
      cuentaOrigen: cuenta,
      nota: nota.trim() || undefined,
      creadoEn: Date.now(),
    })
    onListo()
  }

  const chip = (activo: boolean) =>
    `rounded-full px-3 py-1.5 text-sm ring-1 ${activo ? 'bg-emerald-600 ring-emerald-500' : 'bg-slate-900 ring-slate-700'}`

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900 p-1">
        {(['gasto', 'ingreso'] as const).map((t) => (
          <button key={t} onClick={() => setTipo(t)} className={`rounded-lg py-2 text-sm capitalize ${tipo === t ? 'bg-slate-700' : ''}`}>
            {t}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-sm text-slate-400">Monto (Q)</span>
        <input
          autoFocus
          inputMode="decimal"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0"
          className="mt-1 w-full bg-transparent text-5xl font-bold tabular-nums outline-none placeholder:text-slate-700"
        />
      </label>

      {tipo === 'gasto' && (
        <div>
          <span className="text-sm text-slate-400">Categoría</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {datos.categorias.map((c) => (
              <button key={c.id} onClick={() => setCategoriaId(c.id)} className={chip(categoriaId === c.id)}>
                {c.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="text-sm text-slate-400">Cuenta</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {CUENTAS.map((c) => (
            <button key={c.id} onClick={() => setCuenta(c.id)} className={chip(cuenta === c.id)}>
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-slate-400">
          Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 p-2 text-slate-100 ring-1 ring-slate-700" />
        </label>
        <label className="block text-sm text-slate-400">
          Nota
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-lg bg-slate-900 p-2 text-slate-100 ring-1 ring-slate-700" />
        </label>
      </div>

      <button disabled={!valido} onClick={guardar} className="w-full rounded-xl bg-emerald-600 py-3 font-semibold disabled:opacity-40">
        Guardar
      </button>
    </div>
  )
}
