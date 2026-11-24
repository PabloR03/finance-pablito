import { useState } from 'react'
import { Card, Fila } from '../components/ui'
import { db } from '../db/db'
import type { Datos } from '../hooks'
import { estadoFijos, mesActual, montoMensual, planQuincenas, q, semanasPagadas } from '../lib/budget'
import type { Categoria, Config, Frecuencia, Moneda } from '../lib/types'

const FREC: Record<Frecuencia, string> = { semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' }
const campo = 'w-full rounded-lg bg-slate-800 px-2 py-2 text-slate-100 ring-1 ring-slate-700'

export function Presupuesto({ datos }: { datos: Datos }) {
  const { categorias, config, movimientos } = datos
  const plan = planQuincenas(categorias, config)
  const estado = estadoFijos(categorias, movimientos, config)
  const mes = mesActual()
  const [editando, setEditando] = useState<number | 'nuevo'>()

  return (
    <div className="space-y-4">
      <Salario config={config} />

      <Card title="1ª quincena">
        <div className="text-sm">
          <Fila label="Quincena" value={q(plan.quincena)} />
          <Fila label="Gastos fijos" value={q(plan.fijos)} />
          <Fila label="Queda para gastos hormiga" value={q(plan.hormiga)} strong />
        </div>
        {plan.quincena < plan.fijos && <p className="mt-2 text-xs text-rose-300">Los fijos pasan la quincena por {q(plan.fijos - plan.quincena)}.</p>}
        <p className="mt-2 text-xs text-slate-500">El presupuesto hormiga se recalcula solo al cambiar el salario o los fijos.</p>
      </Card>

      <Card title="Gastos fijos" right={<span className="text-xs text-slate-500">toca uno para editarlo</span>}>
        <ul className="divide-y divide-slate-800">
          {estado.map(({ cat, pagado }) =>
            editando === cat.id ? (
              <li key={cat.id} className="py-3">
                <EditorFijo cat={cat} onListo={() => setEditando(undefined)} />
              </li>
            ) : (
              <li key={cat.id}>
                <button onClick={() => setEditando(cat.id)} className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className={`size-2 shrink-0 rounded-full ${pagado ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      <span className="truncate">{cat.nombre}</span>
                    </span>
                    <span className="ml-4 text-xs text-slate-500">
                      {FREC[cat.frecuencia]}
                      {cat.frecuencia === 'semanal' && ` · ${semanasPagadas(cat, movimientos, mes)}/${config.semanasPorMes} semanas`}
                      {cat.frecuencia !== 'semanal' && (pagado ? ' · pagado' : ' · pendiente')}
                    </span>
                  </span>
                  <span className="text-right tabular-nums">
                    <span className="block">{cat.moneda === 'USD' ? `$${cat.monto}` : q(cat.monto)}</span>
                    {cat.frecuencia !== 'mensual' && <span className="text-xs text-slate-500">{q(montoMensual(cat, config))}/mes</span>}
                  </span>
                </button>
              </li>
            ),
          )}
        </ul>
        {editando === 'nuevo' ? (
          <div className="mt-3 border-t border-slate-800 pt-3">
            <EditorFijo orden={Math.max(0, ...categorias.map((c) => c.orden)) + 1} onListo={() => setEditando(undefined)} />
          </div>
        ) : (
          <button onClick={() => setEditando('nuevo')} className="mt-3 w-full rounded-xl bg-slate-800 py-2 text-sm text-emerald-400">
            + Agregar gasto fijo
          </button>
        )}
      </Card>
    </div>
  )
}

function Salario({ config }: { config: Config }) {
  const guardar = (cambios: Partial<Config>) => db.config.update('main', cambios)
  return (
    <Card title="Salario">
      <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
        <label>
          Sueldo neto al mes (Q)
          <input
            key={config.sueldoNeto}
            inputMode="decimal"
            defaultValue={config.sueldoNeto}
            aria-label="Sueldo neto al mes"
            onBlur={(e) => {
              const v = Number(e.target.value.replace(',', '.'))
              if (v > 0 && v !== config.sueldoNeto) guardar({ sueldoNeto: v })
            }}
            className={`mt-1 ${campo}`}
          />
        </label>
        <label>
          Tipo de cambio (Q por $)
          <input
            key={config.tipoCambio}
            inputMode="decimal"
            defaultValue={config.tipoCambio}
            aria-label="Tipo de cambio"
            onBlur={(e) => {
              const v = Number(e.target.value.replace(',', '.'))
              if (v > 0 && v !== config.tipoCambio) guardar({ tipoCambio: v })
            }}
            className={`mt-1 ${campo}`}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-slate-500">Cada quincena: {q(config.sueldoNeto / 2)}. La 2ª va completa al ahorro.</p>
    </Card>
  )
}

/** Formulario para editar un fijo existente o crear uno nuevo (sin `cat`). */
function EditorFijo({ cat, orden = 0, onListo }: { cat?: Categoria; orden?: number; onListo: () => void }) {
  const [nombre, setNombre] = useState(cat?.nombre ?? '')
  const [monto, setMonto] = useState(cat ? String(cat.monto) : '')
  const [moneda, setMoneda] = useState<Moneda>(cat?.moneda ?? 'GTQ')
  const [frecuencia, setFrecuencia] = useState<Frecuencia>(cat?.frecuencia ?? 'mensual')
  const [confirmarQuitar, setConfirmarQuitar] = useState(false)
  const valor = Number(monto.replace(',', '.'))
  const valido = nombre.trim().length > 0 && valor > 0

  async function guardar() {
    if (!valido) return
    const datos = { nombre: nombre.trim(), monto: valor, moneda, frecuencia }
    if (cat) await db.categorias.update(cat.id!, datos)
    else await db.categorias.add({ ...datos, tipo: 'fijo', cuentaId: 'bi-monetaria', orden })
    onListo()
  }

  async function quitar() {
    // Se archiva en vez de borrarse: los pagos ya registrados siguen mostrando su nombre.
    await db.categorias.update(cat!.id!, { archivada: true })
    onListo()
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="font-semibold">{cat ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}</p>
      <label className="block text-slate-400">
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Netflix, colegiatura…" className={`mt-1 ${campo}`} autoFocus={!cat} />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-1 block text-slate-400">
          Monto
          <input inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} className={`mt-1 ${campo} tabular-nums`} />
        </label>
        <label className="block text-slate-400">
          Moneda
          <select value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)} className={`mt-1 ${campo}`}>
            <option value="GTQ">Q</option>
            <option value="USD">$</option>
          </select>
        </label>
        <label className="block text-slate-400">
          Cada
          <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as Frecuencia)} className={`mt-1 ${campo}`}>
            <option value="semanal">semana</option>
            <option value="quincenal">quincena</option>
            <option value="mensual">mes</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <button disabled={!valido} onClick={guardar} className="flex-1 rounded-lg bg-emerald-600 py-2 font-semibold disabled:opacity-40">
          Guardar
        </button>
        <button onClick={onListo} className="flex-1 rounded-lg bg-slate-800 py-2">
          Cancelar
        </button>
      </div>
      {cat &&
        (confirmarQuitar ? (
          <div className="rounded-lg bg-rose-950/50 p-3 ring-1 ring-rose-900">
            <p className="text-rose-200">¿Quitar {cat.nombre}? Deja de aparecer en el checklist y en el presupuesto. Los pagos que ya registraste se conservan.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={quitar} className="flex-1 rounded-lg bg-rose-600 py-2 font-semibold">
                Sí, quitar
              </button>
              <button onClick={() => setConfirmarQuitar(false)} className="flex-1 rounded-lg bg-slate-800 py-2">
                No
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmarQuitar(true)} className="w-full py-1 text-rose-300">
            Quitar este gasto fijo
          </button>
        ))}
    </div>
  )
}
