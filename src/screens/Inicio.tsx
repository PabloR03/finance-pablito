import { useState } from 'react'
import { Barra, Card, Fila } from '../components/ui'
import { db } from '../db/db'
import type { Datos } from '../hooks'
import { ahorradoEnMes, hoy, mesActual, planQuincenas, q, repartoAhorro, saldos, totalGastado } from '../lib/budget'

export function Inicio({ datos }: { datos: Datos }) {
  const { categorias, config, movimientos } = datos
  const mes = mesActual()
  const plan = planQuincenas(categorias, config)
  const gastado = totalGastado(movimientos, mes)
  const ahorrado = ahorradoEnMes(movimientos, mes)
  const s = saldos(movimientos)
  const pendiente = Math.max(plan.ahorro - ahorrado, 0)
  const reparto = repartoAhorro(pendiente, s['bi-ahorro'], config)
  const [confirmar, setConfirmar] = useState(false)
  const fechaMes = new Date().toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })
  const nombreMes = fechaMes.charAt(0).toUpperCase() + fechaMes.slice(1)

  async function transferirAhorro() {
    const base = { fecha: hoy(), tipo: 'transferencia' as const, cuentaOrigen: 'bi-monetaria' as const, creadoEn: Date.now() }
    const movs = [
      { ...base, monto: reparto.biAhorro, cuentaDestino: 'bi-ahorro' as const, nota: 'Ahorro 2ª quincena' },
      { ...base, monto: reparto.banrural, cuentaDestino: 'banrural' as const, nota: 'Ahorro 2ª quincena' },
    ].filter((m) => m.monto > 0)
    await db.movimientos.bulkAdd(movs)
    setConfirmar(false)
  }

  async function registrarQuincena() {
    await db.movimientos.add({
      fecha: hoy(),
      monto: plan.quincena,
      tipo: 'ingreso',
      cuentaOrigen: 'bi-monetaria',
      nota: 'Quincena',
      creadoEn: Date.now(),
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">{nombreMes}</p>

      <Card title="1ª quincena · gastos">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">{q(gastado)}</span>
          <span className="text-sm text-slate-400">de {q(plan.gastos)}</span>
        </div>
        <Barra valor={gastado} max={plan.gastos} />
        <div className="mt-3 text-sm">
          <Fila label="Quincena" value={q(plan.quincena)} />
          <Fila label="Te queda para gastar" value={q(plan.quincena - gastado)} strong />
        </div>
      </Card>

      <Card title="2ª quincena · ahorro">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">{q(ahorrado)}</span>
          <span className="text-sm text-slate-400">de {q(plan.ahorro)}</span>
        </div>
        <Barra valor={ahorrado} max={plan.ahorro} meta />
        {pendiente > 0 &&
          (confirmar ? (
            <div className="mt-3 space-y-2 text-sm">
              <Fila label="A BI Ahorro" value={q(reparto.biAhorro)} />
              <Fila label="A Banrural" value={q(reparto.banrural)} />
              <div className="flex gap-2 pt-1">
                <button onClick={transferirAhorro} className="flex-1 rounded-xl bg-emerald-600 py-2 font-semibold">
                  Confirmar
                </button>
                <button onClick={() => setConfirmar(false)} className="flex-1 rounded-xl bg-slate-800 py-2">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmar(true)} className="mt-3 w-full rounded-xl bg-emerald-600 py-2 text-sm font-semibold">
              Registrar ahorro de {q(pendiente)}
            </button>
          ))}
      </Card>

      <Card title="Cuentas">
        <div className="text-sm">
          <Fila label="BI Monetaria · gastos" value={q(s['bi-monetaria'])} />
          <Fila label="BI Ahorro · emergencia" value={q(s['bi-ahorro'])} />
          <Fila label="Banrural · intocable" value={q(s.banrural)} />
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Fondo de emergencia</span>
            <span>
              {q(s['bi-ahorro'])} / {q(config.topeFondo)}
            </span>
          </div>
          <Barra valor={Math.min(s['bi-ahorro'], config.topeFondo)} max={config.topeFondo} meta />
        </div>
        <button onClick={registrarQuincena} className="mt-4 w-full rounded-xl bg-slate-800 py-2 text-sm">
          Llegó la quincena (+{q(plan.quincena)} a BI Monetaria)
        </button>
      </Card>
    </div>
  )
}
