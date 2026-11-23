import { describe, expect, it } from 'vitest'
import { CATEGORIAS_INICIALES, CONFIG_INICIAL } from '../db/seed'
import { ahorradoEnMes, planAhorro, planQuincenas, repartoAhorro, repartoBono, saldos, totalGastosMes } from './budget'
import type { Movimiento } from './types'

const cfg = CONFIG_INICIAL
const cats = CATEGORIAS_INICIALES

describe('presupuesto', () => {
  it('suma los gastos del mes con 4 semanas y el dólar a 7.70', () => {
    expect(totalGastosMes(cats, cfg)).toBeCloseTo(2962.5)
  })

  it('la 1ª quincena cubre gastos y deja la reserva; la 2ª va al ahorro', () => {
    const p = planQuincenas(cats, cfg)
    expect(p.quincena).toBe(3000)
    expect(p.reserva).toBeCloseTo(37.5)
    expect(p.ahorro).toBe(3000)
  })
})

describe('ahorro', () => {
  it('reparte 70/30 hasta el tope y luego 30/70', () => {
    expect(repartoAhorro(3000, 0, cfg)).toEqual({ biAhorro: 2100, banrural: 900 })
    expect(repartoAhorro(3000, 8400, cfg)).toEqual({ biAhorro: 1600, banrural: 1400 })
    expect(repartoAhorro(3000, 10000, cfg).biAhorro).toBeCloseTo(900)
  })

  it('el fondo llega a Q10,000 en el mes 5 y se ahorran Q36,000 al año', () => {
    const plan = planAhorro(cfg)
    expect(plan[4].biAcumulado).toBe(10000)
    expect(plan[3].biAcumulado).toBeLessThan(10000)
    const ultimo = plan[11]
    expect(ultimo.biAcumulado + ultimo.banruralAcumulado).toBe(36000)
  })

  it('usa el monto real cuando existe', () => {
    const plan = planAhorro(cfg, 2, [1000])
    expect(plan[0].ahorro).toBe(1000)
    expect(plan[1].ahorro).toBe(3000)
  })

  it('reparte los bonos 70/10/20', () => {
    expect(repartoBono(6000, cfg)).toEqual({ ahorro: 4200, personal: 600, hermano: 1200 })
  })
})

describe('movimientos', () => {
  const base = { creadoEn: 0 }
  const movs: Movimiento[] = [
    { ...base, fecha: '2026-12-15', monto: 3000, tipo: 'ingreso', cuentaOrigen: 'bi-monetaria' },
    { ...base, fecha: '2026-12-16', monto: 200, tipo: 'gasto', cuentaOrigen: 'bi-monetaria', categoriaId: 2 },
    { ...base, fecha: '2026-12-31', monto: 2100, tipo: 'transferencia', cuentaOrigen: 'bi-monetaria', cuentaDestino: 'bi-ahorro' },
    { ...base, fecha: '2026-12-31', monto: 900, tipo: 'transferencia', cuentaOrigen: 'bi-monetaria', cuentaDestino: 'banrural' },
  ]

  it('calcula saldos por cuenta', () => {
    expect(saldos(movs)).toEqual({ 'bi-monetaria': -200, 'bi-ahorro': 2100, banrural: 900 })
  })

  it('cuenta lo ahorrado en el mes', () => {
    expect(ahorradoEnMes(movs, '2026-12')).toBe(3000)
    expect(ahorradoEnMes(movs, '2027-01')).toBe(0)
  })
})
