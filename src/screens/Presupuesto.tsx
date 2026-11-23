import { Card, Fila } from '../components/ui'
import { db } from '../db/db'
import type { Datos } from '../hooks'
import { estadoFijos, mesActual, montoMensual, planQuincenas, q, semanasPagadas } from '../lib/budget'

const FREC = { semanal: '/semana', quincenal: '/quincena', mensual: '/mes' } as const

export function Presupuesto({ datos }: { datos: Datos }) {
  const { categorias, config, movimientos } = datos
  const plan = planQuincenas(categorias, config)
  const estado = estadoFijos(categorias, movimientos, config)
  const mes = mesActual()

  return (
    <div className="space-y-4">
      <Card title="1ª quincena">
        <div className="text-sm">
          <Fila label="Quincena" value={q(plan.quincena)} />
          <Fila label="Gastos fijos" value={q(plan.fijos)} />
          <Fila label="Queda para gastos hormiga" value={q(plan.hormiga)} strong />
        </div>
        <p className="mt-2 text-xs text-slate-500">Si subes o bajas un fijo, el presupuesto de gastos hormiga se ajusta solo.</p>
      </Card>

      <Card title="Gastos fijos" right={<span className="text-xs text-slate-500">toca el monto para editarlo</span>}>
        <ul className="divide-y divide-slate-800">
          {estado.map(({ cat, pagado }) => (
            <li key={cat.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate">{cat.nombre}</span>
                <span className="text-xs text-slate-500">
                  {cat.frecuencia === 'semanal'
                    ? `${semanasPagadas(cat, movimientos, mes)}/${config.semanasPorMes} semanas · ${q(montoMensual(cat, config))}/mes`
                    : pagado
                      ? 'Pagado este mes'
                      : 'Pendiente'}
                </span>
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className={`mr-1 size-2 rounded-full ${pagado ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                {cat.moneda === 'USD' ? '$' : 'Q'}
                <input
                  inputMode="decimal"
                  defaultValue={cat.monto}
                  aria-label={`Monto de ${cat.nombre}`}
                  onBlur={(e) => {
                    const v = Number(e.target.value)
                    if (v >= 0 && v !== cat.monto) db.categorias.update(cat.id!, { monto: v })
                  }}
                  className="w-14 rounded bg-slate-800 px-1 text-right text-slate-100"
                />
                <span className="w-16 text-xs">{FREC[cat.frecuencia]}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
