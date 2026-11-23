import { Barra, Card, Fila } from '../components/ui'
import { db } from '../db/db'
import type { Datos } from '../hooks'
import { gastadoPorCategoria, mesActual, montoMensual, planQuincenas, q, totalGastado } from '../lib/budget'

const FREC = { semanal: '/semana', quincenal: '/quincena', mensual: '/mes' } as const

export function Presupuesto({ datos }: { datos: Datos }) {
  const { categorias, config, movimientos } = datos
  const mes = mesActual()
  const gastado = gastadoPorCategoria(movimientos, mes)
  const plan = planQuincenas(categorias, config)

  return (
    <div className="space-y-4">
      <Card title="Resumen del mes">
        <div className="text-sm">
          <Fila label="1ª quincena" value={q(plan.quincena)} />
          <Fila label="Gastos presupuestados" value={q(plan.gastos)} />
          <Fila label="Reserva" value={q(plan.reserva)} strong />
          <Fila label="Gastado este mes" value={q(totalGastado(movimientos, mes))} />
        </div>
      </Card>

      <Card title="Por categoría" right={<span className="text-xs text-slate-500">toca el monto para editarlo</span>}>
        <ul className="space-y-3">
          {categorias.map((c) => {
            const tope = montoMensual(c, config)
            const g = gastado.get(c.id!) ?? 0
            return (
              <li key={c.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{c.nombre}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    {c.moneda === 'USD' ? '$' : 'Q'}
                    <input
                      inputMode="decimal"
                      defaultValue={c.monto}
                      onBlur={(e) => {
                        const v = Number(e.target.value)
                        if (v >= 0 && v !== c.monto) db.categorias.update(c.id!, { monto: v })
                      }}
                      className="w-14 rounded bg-slate-800 px-1 text-right text-slate-100"
                    />
                    <span className="text-xs">{FREC[c.frecuencia]}</span>
                  </span>
                </div>
                <Barra valor={g} max={tope} />
                <p className="mt-0.5 text-right text-xs tabular-nums text-slate-500">
                  {q(g)} de {q(tope)}
                </p>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
