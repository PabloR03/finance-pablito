import type { Categoria, Config, CuentaId, Movimiento } from './types'

/** Monto mensual en quetzales de una categoría del presupuesto. */
export function montoMensual(cat: Categoria, cfg: Config): number {
  const enQ = cat.moneda === 'USD' ? cat.monto * cfg.tipoCambio : cat.monto
  const veces = cat.frecuencia === 'semanal' ? cfg.semanasPorMes : cat.frecuencia === 'quincenal' ? 2 : 1
  return enQ * veces
}

export function totalGastosMes(cats: Categoria[], cfg: Config): number {
  return cats.reduce((s, c) => s + montoMensual(c, cfg), 0)
}

/**
 * Regla del plan: la 1ª quincena paga todos los gastos del mes y lo que sobra es reserva;
 * la 2ª quincena va completa al ahorro.
 */
export function planQuincenas(cats: Categoria[], cfg: Config) {
  const quincena = cfg.sueldoNeto / 2
  const gastos = totalGastosMes(cats, cfg)
  return { quincena, gastos, reserva: quincena - gastos, ahorro: quincena }
}

/** Reparte un monto de ahorro entre BI Ahorro y Banrural según el saldo actual del fondo. */
export function repartoAhorro(monto: number, saldoFondo: number, cfg: Config) {
  if (saldoFondo >= cfg.topeFondo) {
    const bi = monto * cfg.pctBiDespuesDelTope
    return { biAhorro: bi, banrural: monto - bi }
  }
  const bi = Math.min(monto * cfg.pctBiAntesDelTope, cfg.topeFondo - saldoFondo)
  return { biAhorro: bi, banrural: monto - bi }
}

export interface FilaPlan {
  mes: number
  ahorro: number
  biAhorro: number
  banrural: number
  biAcumulado: number
  banruralAcumulado: number
}

/** Proyección mes a mes; `reales[i]` reemplaza la meta del mes i cuando existe. */
export function planAhorro(cfg: Config, meses = 12, reales: (number | undefined)[] = []): FilaPlan[] {
  const meta = cfg.sueldoNeto / 2
  let bi = 0
  let ban = 0
  const filas: FilaPlan[] = []
  for (let i = 0; i < meses; i++) {
    const ahorro = reales[i] ?? meta
    const r = repartoAhorro(ahorro, bi, cfg)
    bi += r.biAhorro
    ban += r.banrural
    filas.push({ mes: i + 1, ahorro, biAhorro: r.biAhorro, banrural: r.banrural, biAcumulado: bi, banruralAcumulado: ban })
  }
  return filas
}

export function repartoBono(monto: number, cfg: Config) {
  return {
    ahorro: monto * cfg.bonoPctAhorro,
    personal: monto * cfg.bonoPctPersonal,
    hermano: monto * cfg.bonoPctHermano,
  }
}

/** 'YYYY-MM' del día de hoy en hora local. */
export function mesActual(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function hoy(d = new Date()): string {
  return `${mesActual(d)}-${String(d.getDate()).padStart(2, '0')}`
}

export const delMes = (movs: Movimiento[], mes: string) => movs.filter((m) => m.fecha.startsWith(mes))

export function gastadoPorCategoria(movs: Movimiento[], mes: string): Map<number, number> {
  const out = new Map<number, number>()
  for (const m of delMes(movs, mes)) {
    if (m.tipo !== 'gasto' || m.categoriaId == null) continue
    out.set(m.categoriaId, (out.get(m.categoriaId) ?? 0) + m.monto)
  }
  return out
}

export function totalGastado(movs: Movimiento[], mes: string): number {
  return delMes(movs, mes).reduce((s, m) => (m.tipo === 'gasto' ? s + m.monto : s), 0)
}

/** Lo transferido este mes desde BI Monetaria a las cuentas de ahorro. */
export function ahorradoEnMes(movs: Movimiento[], mes: string): number {
  return delMes(movs, mes).reduce(
    (s, m) =>
      m.tipo === 'transferencia' && m.cuentaOrigen === 'bi-monetaria' && (m.cuentaDestino === 'bi-ahorro' || m.cuentaDestino === 'banrural')
        ? s + m.monto
        : s,
    0,
  )
}

export function saldos(movs: Movimiento[]): Record<CuentaId, number> {
  const s: Record<CuentaId, number> = { 'bi-monetaria': 0, 'bi-ahorro': 0, banrural: 0 }
  for (const m of movs) {
    if (m.tipo === 'ingreso') s[m.cuentaOrigen] += m.monto
    else if (m.tipo === 'gasto') s[m.cuentaOrigen] -= m.monto
    else if (m.cuentaDestino) {
      s[m.cuentaOrigen] -= m.monto
      s[m.cuentaDestino] += m.monto
    }
  }
  return s
}

export const q = (n: number, dec = 0) =>
  `${n < 0 ? '−' : ''}Q${Math.abs(n).toLocaleString('es-GT', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`
