import { describe, expect, it } from 'vitest'
import { CATEGORIAS_INICIALES, ID_HORMIGA, configInicial } from '../db/seed'
import {
  ahorradoEnMes,
  estadoFijos,
  gastoPorDia,
  historialHormiga,
  lunesDe,
  mesesEntre,
  planAhorro,
  planQuincenas,
  repartoAhorro,
  repartoBono,
  saldos,
  semanasPagadas,
} from './budget'
import type { Movimiento } from './types'

const cfg = configInicial('2026-12')
const cats = CATEGORIAS_INICIALES
const mov = (m: Partial<Movimiento> & Pick<Movimiento, 'fecha' | 'monto'>): Movimiento => ({
  tipo: 'gasto',
  cuentaOrigen: 'bi-monetaria',
  creadoEn: 0,
  ...m,
})

describe('presupuesto', () => {
  it('la 1ª quincena cubre los fijos y lo que sobra es para gastos hormiga', () => {
    const p = planQuincenas(cats, cfg)
    expect(p.quincena).toBe(3000)
    expect(p.fijos).toBeCloseTo(2562.5)
    expect(p.hormiga).toBeCloseTo(437.5) // Q400 de gustos + Q37.50 de sobra
    expect(p.ahorro).toBe(3000)
  })
})

describe('fechas', () => {
  it('ubica el lunes de la semana', () => {
    expect(lunesDe('2026-12-03')).toBe('2026-11-30') // jueves → lunes anterior
    expect(lunesDe('2026-12-07')).toBe('2026-12-07') // lunes
    expect(lunesDe('2026-12-13')).toBe('2026-12-07') // domingo
  })

  it('lista meses aunque cambie el año', () => {
    expect(mesesEntre('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
  })
})

describe('checklist de fijos', () => {
  const movs = [
    mov({ fecha: '2026-12-02', monto: 210, categoriaId: 5 }), // Gym, mensual
    mov({ fecha: '2026-12-01', monto: 200, categoriaId: 1 }), // Oficina, semana del 30 nov
    mov({ fecha: '2026-12-08', monto: 200, categoriaId: 1 }), // Oficina, semana del 7 dic
  ]
  const estado = (fecha: string, id: number) => estadoFijos(cats, movs, cfg, fecha).find((e) => e.cat.id === id)!

  it('un fijo mensual queda pagado todo el mes y vuelve a salir el mes siguiente', () => {
    expect(estado('2026-12-28', 5).pagado).toBe(true)
    expect(estado('2027-01-02', 5).pagado).toBe(false)
  })

  it('un fijo semanal vuelve a salir cada lunes', () => {
    expect(estado('2026-12-09', 1).pagado).toBe(true)
    expect(estado('2026-12-14', 1).pagado).toBe(false)
    expect(semanasPagadas(cats[0], movs, '2026-12')).toBe(2)
  })

  it('sugiere el monto en quetzales, también para lo que se paga en dólares', () => {
    expect(estado('2026-12-02', 6).montoSugerido).toBeCloseTo(192.5)
    expect(estado('2026-12-02', 6).pagado).toBe(false)
  })

  it('un fijo quitado sale del checklist y del presupuesto, y lo libera para hormiga', () => {
    const sinGym = cats.map((c) => (c.id === 5 ? { ...c, archivada: true } : c))
    expect(estadoFijos(sinGym, movs, cfg).some((e) => e.cat.id === 5)).toBe(false)
    expect(planQuincenas(sinGym, cfg).hormiga).toBeCloseTo(647.5)
  })

  it('el presupuesto hormiga sigue al salario', () => {
    expect(planQuincenas(cats, { ...cfg, sueldoNeto: 7000 }).hormiga).toBeCloseTo(937.5)
  })

  it('los gastos hormiga no aparecen en el checklist', () => {
    expect(estadoFijos(cats, movs, cfg).some((e) => e.cat.id === ID_HORMIGA)).toBe(false)
  })
})

describe('saldo de gastos hormiga', () => {
  const movs = [
    mov({ fecha: '2026-12-05', monto: 300, categoriaId: ID_HORMIGA }),
    mov({ fecha: '2027-01-10', monto: 600, categoriaId: ID_HORMIGA }),
    mov({ fecha: '2027-01-10', monto: 210, categoriaId: 5 }), // fijo: no cuenta
  ]

  it('lo que sobra de un mes pasa al siguiente (y lo que falta también)', () => {
    const h = historialHormiga(movs, cats, cfg, '2027-02')
    expect(h.map((f) => f.mes)).toEqual(['2026-12', '2027-01', '2027-02'])
    expect(h[0].disponible).toBeCloseTo(137.5)
    expect(h[1].saldoAnterior).toBeCloseTo(137.5)
    expect(h[1].disponible).toBeCloseTo(-25)
    expect(h[2].disponible).toBeCloseTo(412.5)
  })

  it('suma el gasto por día', () => {
    const dias = gastoPorDia(movs, '2027-01', new Set([ID_HORMIGA]))
    expect(dias).toHaveLength(31)
    expect(dias[9]).toBe(600)
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
    expect(plan[11].biAcumulado + plan[11].banruralAcumulado).toBe(36000)
  })

  it('reparte los bonos 70/10/20', () => {
    expect(repartoBono(6000, cfg)).toEqual({ ahorro: 4200, personal: 600, hermano: 1200 })
  })
})

describe('cuentas', () => {
  const movs: Movimiento[] = [
    mov({ fecha: '2026-12-15', monto: 3000, tipo: 'ingreso' }),
    mov({ fecha: '2026-12-16', monto: 200, categoriaId: 2 }),
    mov({ fecha: '2026-12-31', monto: 2100, tipo: 'transferencia', cuentaDestino: 'bi-ahorro' }),
    mov({ fecha: '2026-12-31', monto: 900, tipo: 'transferencia', cuentaDestino: 'banrural' }),
  ]

  it('calcula saldos y lo ahorrado en el mes', () => {
    expect(saldos(movs)).toEqual({ 'bi-monetaria': -200, 'bi-ahorro': 2100, banrural: 900 })
    expect(ahorradoEnMes(movs, '2026-12')).toBe(3000)
  })
})
