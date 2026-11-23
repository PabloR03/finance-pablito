import { GraficaMes, GraficaMeses, GraficaSaldo } from '../components/charts'
import { Barra, Card } from '../components/ui'
import type { Datos } from '../hooks'
import {
  delMes,
  estadoFijos,
  gastoPorDia,
  gastoPorMes,
  historialHormiga,
  idsHormiga,
  mesActual,
  mesesEntre,
  nombreMes,
  planQuincenas,
  q,
  semanasPagadas,
  sumarMeses,
  totalGastado,
} from '../lib/budget'

export function Observabilidad({ datos }: { datos: Datos }) {
  const { categorias, config, movimientos } = datos
  const mes = mesActual()
  const plan = planQuincenas(categorias, config)
  const hormigaIds = idsHormiga(categorias)
  const fijos = estadoFijos(categorias, movimientos, config)
  const pagadoFijos = totalGastado(movimientos, mes) - totalGastado(movimientos, mes, hormigaIds)
  const historial = historialHormiga(movimientos, categorias, config)
  const esteMes = historial.at(-1)!
  const ultimos = mesesEntre(sumarMeses(mes, -5), mes)
  const porMes = gastoPorMes(movimientos, categorias, ultimos)
  const saldoUltimos = historial.slice(-6)

  // En qué se va el dinero hormiga: agrupado por la nota que escribiste.
  const porNota = new Map<string, number>()
  for (const m of delMes(movimientos, mes)) {
    if (m.tipo !== 'gasto' || !hormigaIds.has(m.categoriaId!)) continue
    const k = m.nota?.trim().toLowerCase() || 'sin nota'
    porNota.set(k, (porNota.get(k) ?? 0) + m.monto)
  }
  const top = [...porNota].sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">{nombreMes(mes)}</p>

      <Card title="Checklist de fijos" right={<span className="text-xs text-slate-500">{q(pagadoFijos)} de {q(plan.fijos)}</span>}>
        <Barra valor={pagadoFijos} max={plan.fijos} meta />
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {fijos.map(({ cat, pagado }) => {
            const semanal = cat.frecuencia === 'semanal'
            const n = semanal ? semanasPagadas(cat, movimientos, mes) : 0
            return (
              <li key={cat.id} className="flex items-center gap-2">
                <span className={pagado ? 'text-emerald-400' : 'text-slate-600'}>{pagado ? '✓' : '○'}</span>
                <span className={`min-w-0 flex-1 truncate ${pagado ? 'text-slate-300' : 'text-slate-400'}`}>{cat.nombre}</span>
                {semanal && (
                  <span className="flex gap-0.5" aria-label={`${n} de ${config.semanasPorMes} semanas`}>
                    {Array.from({ length: config.semanasPorMes }, (_, i) => (
                      <span key={i} className={`size-1.5 rounded-full ${i < n ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    ))}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-slate-500">✓ pagado en el periodo actual · los puntos son las semanas pagadas este mes</p>
      </Card>

      <Card title="Hormiga del mes" right={<span className="text-xs text-slate-500">{q(esteMes.gastado)} gastado</span>}>
        <GraficaMes dias={gastoPorDia(movimientos, mes, hormigaIds)} tope={esteMes.presupuesto + esteMes.saldoAnterior} hoy={new Date().getDate()} />
        <p className="mt-1 text-xs text-slate-500">Barras: gasto de cada día · línea: acumulado contra lo disponible (presupuesto + saldo del mes pasado)</p>
      </Card>

      {top.length > 0 && (
        <Card title="¿En qué se van los hormiga?">
          <ul className="space-y-2 text-sm">
            {top.map(([nota, monto]) => (
              <li key={nota}>
                <div className="mb-0.5 flex justify-between">
                  <span className="capitalize">{nota}</span>
                  <span className="tabular-nums text-slate-400">{q(monto)}</span>
                </div>
                <Barra valor={monto} max={esteMes.gastado} meta />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Últimos 6 meses">
        <GraficaMeses filas={porMes.map((f) => ({ etiqueta: nombreMes(f.mes, 'short'), fijos: f.fijos, hormiga: f.hormiga }))} />
        <div className="mt-1 flex gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-slate-600" /> Fijos
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-emerald-400" /> Hormiga
          </span>
        </div>
      </Card>

      <Card title="Saldo hormiga al cierre de cada mes">
        <GraficaSaldo filas={saldoUltimos.map((f) => ({ etiqueta: nombreMes(f.mes, 'short'), valor: f.disponible }))} />
        <p className="mt-1 text-xs text-slate-500">Lo que sobra pasa al mes siguiente; si te pasas, se descuenta del siguiente.</p>
      </Card>
    </div>
  )
}
