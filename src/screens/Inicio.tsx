import { useState } from 'react'
import { Barra, Card, Fila } from '../components/ui'
import { db } from '../db/db'
import type { Datos } from '../hooks'
import { ahorradoEnMes, estadoFijos, historialHormiga, hoy, mesActual, nombreMes, planQuincenas, q, repartoAhorro, saldos } from '../lib/budget'

export function Inicio({ datos, irA }: { datos: Datos; irA: (tab: 'registrar' | 'observabilidad') => void }) {
  const { categorias, config, movimientos } = datos
  const mes = mesActual()
  const plan = planQuincenas(categorias, config)
  const fijos = estadoFijos(categorias, movimientos, config)
  const pendientes = fijos.filter((f) => !f.pagado)
  const hormiga = historialHormiga(movimientos, categorias, config).at(-1)!
  const ahorrado = ahorradoEnMes(movimientos, mes)
  const s = saldos(movimientos)
  const pendienteAhorro = Math.max(plan.ahorro - ahorrado, 0)
  const reparto = repartoAhorro(pendienteAhorro, s['bi-ahorro'], config)
  const [confirmar, setConfirmar] = useState(false)

  async function transferirAhorro() {
    const base = { fecha: hoy(), tipo: 'transferencia' as const, cuentaOrigen: 'bi-monetaria' as const, creadoEn: Date.now(), nota: 'Ahorro 2ª quincena' }
    const movs = [
      { ...base, monto: reparto.biAhorro, cuentaDestino: 'bi-ahorro' as const },
      { ...base, monto: reparto.banrural, cuentaDestino: 'banrural' as const },
    ].filter((m) => m.monto > 0)
    await db.movimientos.bulkAdd(movs)
    setConfirmar(false)
  }

  async function registrarQuincena() {
    await db.movimientos.add({ fecha: hoy(), monto: plan.quincena, tipo: 'ingreso', cuentaOrigen: 'bi-monetaria', nota: 'Quincena', creadoEn: Date.now() })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">{nombreMes(mes)}</p>

      <Card title="Gastos hormiga" right={<span className="text-xs text-slate-500">pasa al mes siguiente</span>}>
        <div className="mb-2 flex items-baseline justify-between">
          <span className={`text-2xl font-bold tabular-nums ${hormiga.disponible < 0 ? 'text-rose-300' : ''}`}>{q(hormiga.disponible)}</span>
          <span className="text-sm text-slate-400">disponible</span>
        </div>
        <Barra valor={hormiga.gastado} max={hormiga.presupuesto + Math.max(hormiga.saldoAnterior, 0)} />
        <div className="mt-3 text-sm">
          <Fila label="Presupuesto del mes" value={q(hormiga.presupuesto)} />
          <Fila label="Saldo del mes pasado" value={q(hormiga.saldoAnterior)} />
          <Fila label="Gastado" value={q(hormiga.gastado)} />
        </div>
      </Card>

      <Card title="Gastos fijos" right={<span className="text-xs text-slate-500">{fijos.length - pendientes.length}/{fijos.length} al día</span>}>
        {pendientes.length === 0 ? (
          <p className="text-sm text-emerald-300">Todo pagado por ahora ✓</p>
        ) : (
          <button onClick={() => irA('registrar')} className="w-full text-left text-sm text-slate-300">
            Pendientes: {pendientes.map((p) => p.cat.nombre).join(', ')}
            <span className="mt-2 block text-emerald-400">Marcar pagos →</span>
          </button>
        )}
      </Card>

      <Card title="2ª quincena · ahorro">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">{q(ahorrado)}</span>
          <span className="text-sm text-slate-400">de {q(plan.ahorro)}</span>
        </div>
        <Barra valor={ahorrado} max={plan.ahorro} meta />
        {pendienteAhorro > 0 &&
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
              Registrar ahorro de {q(pendienteAhorro)}
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
