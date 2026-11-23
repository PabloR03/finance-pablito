import { useState } from 'react'
import { Card } from '../components/ui'
import { db } from '../db/db'
import type { Datos } from '../hooks'
import { estadoFijos, historialHormiga, hoy, q, type EstadoFijo } from '../lib/budget'
import type { CuentaId } from '../lib/types'

const CUENTAS: { id: CuentaId; nombre: string }[] = [
  { id: 'bi-monetaria', nombre: 'BI Monetaria' },
  { id: 'bi-ahorro', nombre: 'BI Ahorro' },
  { id: 'banrural', nombre: 'Banrural' },
]

type Modo = 'hormiga' | 'fijos' | 'ingreso'

const chip = (activo: boolean) =>
  `rounded-full px-3 py-1.5 text-sm ring-1 ${activo ? 'bg-emerald-600 ring-emerald-500' : 'bg-slate-900 ring-slate-700'}`

export function Registrar({ datos, onListo }: { datos: Datos; onListo: () => void }) {
  const { categorias, config, movimientos } = datos
  const pendientes = estadoFijos(categorias, movimientos, config).filter((e) => !e.pagado)
  const [modo, setModo] = useState<Modo>('hormiga')

  const tabs: { id: Modo; label: string }[] = [
    { id: 'hormiga', label: 'Hormiga' },
    { id: 'fijos', label: pendientes.length ? `Fijos (${pendientes.length})` : 'Fijos ✓' },
    { id: 'ingreso', label: 'Ingreso' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setModo(t.id)} className={`rounded-lg py-2 text-sm ${modo === t.id ? 'bg-slate-700' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>
      {modo === 'fijos' ? (
        <Fijos pendientes={pendientes} />
      ) : (
        <Formulario key={modo} datos={datos} modo={modo} onListo={onListo} disponible={historialHormiga(movimientos, categorias, config).at(-1)?.disponible ?? 0} />
      )}
    </div>
  )
}

/** Checklist del periodo: al pagar un fijo desaparece hasta la próxima semana o mes. */
function Fijos({ pendientes }: { pendientes: EstadoFijo[] }) {
  const [abierto, setAbierto] = useState<number>()
  const [monto, setMonto] = useState('')

  async function pagar(e: EstadoFijo) {
    const v = Number(monto.replace(',', '.'))
    if (!(v > 0)) return
    await db.movimientos.add({ fecha: hoy(), monto: v, tipo: 'gasto', categoriaId: e.cat.id, cuentaOrigen: e.cat.cuentaId, creadoEn: Date.now() })
    setAbierto(undefined)
  }

  if (pendientes.length === 0)
    return <p className="py-10 text-center text-slate-400">Todos los fijos están pagados. Vuelven a aparecer la próxima semana o el próximo mes.</p>

  return (
    <Card>
      <ul className="divide-y divide-slate-800">
        {pendientes.map((e) => (
          <li key={e.cat.id} className="py-2.5">
            <button
              className="flex w-full items-center justify-between text-left"
              onClick={() => {
                setAbierto(abierto === e.cat.id ? undefined : e.cat.id)
                setMonto(String(Math.round(e.montoSugerido * 100) / 100))
              }}
            >
              <span>
                <span className="block text-sm">{e.cat.nombre}</span>
                <span className="text-xs text-slate-500">{e.periodo}</span>
              </span>
              <span className="tabular-nums text-sm text-slate-300">{q(e.montoSugerido, e.cat.moneda === 'USD' ? 2 : 0)}</span>
            </button>
            {abierto === e.cat.id && (
              <div className="mt-2 flex gap-2">
                <input
                  inputMode="decimal"
                  value={monto}
                  onChange={(ev) => setMonto(ev.target.value)}
                  aria-label={`Monto de ${e.cat.nombre}`}
                  className="w-28 rounded-lg bg-slate-800 px-2 text-right tabular-nums"
                />
                <button onClick={() => pagar(e)} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold">
                  Marcar pagado
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Formulario({ datos, modo, onListo, disponible }: { datos: Datos; modo: 'hormiga' | 'ingreso'; onListo: () => void; disponible: number }) {
  const hormigaId = datos.categorias.find((c) => c.tipo === 'hormiga')?.id
  const [monto, setMonto] = useState('')
  const [cuenta, setCuenta] = useState<CuentaId>('bi-monetaria')
  const [fecha, setFecha] = useState(hoy())
  const [nota, setNota] = useState('')
  const valor = Number(monto.replace(',', '.'))

  async function guardar() {
    if (!(valor > 0)) return
    await db.movimientos.add({
      fecha,
      monto: valor,
      tipo: modo === 'hormiga' ? 'gasto' : 'ingreso',
      categoriaId: modo === 'hormiga' ? hormigaId : undefined,
      cuentaOrigen: cuenta,
      nota: nota.trim() || undefined,
      creadoEn: Date.now(),
    })
    onListo()
  }

  return (
    <>
      <label className="block">
        <span className="flex justify-between text-sm text-slate-400">
          Monto (Q)
          {modo === 'hormiga' && <span className={disponible < 0 ? 'text-rose-300' : ''}>Disponible: {q(disponible)}</span>}
        </span>
        <input
          autoFocus
          inputMode="decimal"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0"
          className="mt-1 w-full bg-transparent text-5xl font-bold tabular-nums outline-none placeholder:text-slate-700"
        />
      </label>

      <label className="block text-sm text-slate-400">
        {modo === 'hormiga' ? '¿En qué?' : 'Nota'}
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder={modo === 'hormiga' ? 'Café, shuco, chicles… (opcional)' : 'Quincena, bono… (opcional)'}
          className="mt-1 w-full rounded-lg bg-slate-900 p-2 text-slate-100 ring-1 ring-slate-700"
        />
      </label>

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

      <label className="block text-sm text-slate-400">
        Fecha
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 p-2 text-slate-100 ring-1 ring-slate-700" />
      </label>

      <button disabled={!(valor > 0)} onClick={guardar} className="w-full rounded-xl bg-emerald-600 py-3 font-semibold disabled:opacity-40">
        Guardar
      </button>
    </>
  )
}
