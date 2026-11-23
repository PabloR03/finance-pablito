import { useState } from 'react'
import { Card, Fila } from '../components/ui'
import type { Datos } from '../hooks'
import { planAhorro, q, repartoBono } from '../lib/budget'

export function Ahorro({ datos }: { datos: Datos }) {
  const { config } = datos
  const plan = planAhorro(config)
  const llega = plan.find((f) => f.biAcumulado >= config.topeFondo)
  const total = plan.at(-1)!
  const [bono, setBono] = useState(String(config.sueldoNeto))
  const b = repartoBono(Number(bono) || 0, config)
  const pct = (n: number) => `${Math.round(n * 100)}%`

  return (
    <div className="space-y-4">
      <Card title="Plan: 2ª quincena completa al ahorro">
        <p className="mb-3 text-sm text-slate-300">
          {q(config.sueldoNeto / 2)} al mes · el fondo llega a {q(config.topeFondo)} en el mes {llega?.mes ?? '—'} · al año{' '}
          {q(total.biAcumulado + total.banruralAcumulado)}
        </p>
        <table className="w-full text-right text-xs tabular-nums">
          <thead className="text-slate-500">
            <tr>
              <th className="py-1 text-left font-normal">Mes</th>
              <th className="font-normal">BI Ahorro</th>
              <th className="font-normal">Banrural</th>
              <th className="font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {plan.map((f) => (
              <tr key={f.mes} className={f === llega ? 'text-emerald-300' : ''}>
                <td className="py-1 text-left">{f.mes}</td>
                <td>{q(f.biAcumulado)}</td>
                <td>{q(f.banruralAcumulado)}</td>
                <td>{q(f.biAcumulado + f.banruralAcumulado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-500">
          Reparto: {pct(config.pctBiAntesDelTope)} a BI Ahorro hasta el tope; después {pct(config.pctBiDespuesDelTope)}.
        </p>
      </Card>

      <Card title="Aguinaldo y bono 14">
        <label className="mb-3 block text-sm text-slate-400">
          Monto del bono (Q)
          <input inputMode="decimal" value={bono} onChange={(e) => setBono(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-2 text-slate-100" />
        </label>
        <div className="text-sm">
          <Fila label={`Ahorro (${pct(config.bonoPctAhorro)})`} value={q(b.ahorro)} />
          <Fila label={`Para mí (${pct(config.bonoPctPersonal)})`} value={q(b.personal)} />
          <Fila label={`Para mi hermano (${pct(config.bonoPctHermano)})`} value={q(b.hermano)} />
        </div>
      </Card>
    </div>
  )
}
