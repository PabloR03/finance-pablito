import type { Categoria, Config, CuentaId, Movimiento } from './types'

// ---------- Fechas (siempre en hora local, como 'YYYY-MM-DD') ----------

const dos = (n: number) => String(n).padStart(2, '0')

/** 'YYYY-MM' del día de hoy en hora local. */
export function mesActual(d = new Date()): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}`
}

export function hoy(d = new Date()): string {
  return `${mesActual(d)}-${dos(d.getDate())}`
}

const aFecha = (s: string) => new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)) || 1)

/** Lunes de la semana (lunes a domingo) que contiene la fecha. */
export function lunesDe(fecha: string): string {
  const d = aFecha(fecha)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return hoy(d)
}

export function diasDelMes(mes: string): number {
  return new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate()
}

export function sumarMeses(mes: string, n: number): string {
  const d = aFecha(`${mes}-01`)
  d.setMonth(d.getMonth() + n)
  return mesActual(d)
}

/** Meses desde `desde` hasta `hasta`, ambos incluidos. */
export function mesesEntre(desde: string, hasta: string): string[] {
  const out: string[] = []
  for (let m = desde; m <= hasta && out.length < 240; m = sumarMeses(m, 1)) out.push(m)
  return out
}

export const nombreMes = (mes: string, formato: 'long' | 'short' = 'long') => {
  const t = aFecha(`${mes}-01`).toLocaleDateString('es-GT', { month: formato, ...(formato === 'long' ? { year: 'numeric' } : {}) })
  return t.charAt(0).toUpperCase() + t.slice(1).replace('.', '')
}

// ---------- Presupuesto ----------

/** Monto de un pago en quetzales (una semana, una quincena o un mes, según la frecuencia). */
export function montoPorPago(cat: Categoria, cfg: Config): number {
  return cat.moneda === 'USD' ? cat.monto * cfg.tipoCambio : cat.monto
}

/** Monto mensual en quetzales de una categoría fija. */
export function montoMensual(cat: Categoria, cfg: Config): number {
  const veces = cat.frecuencia === 'semanal' ? cfg.semanasPorMes : cat.frecuencia === 'quincenal' ? 2 : 1
  return montoPorPago(cat, cfg) * veces
}

export const fijas = (cats: Categoria[]) => cats.filter((c) => c.tipo === 'fijo')
export const idsHormiga = (cats: Categoria[]) => new Set(cats.filter((c) => c.tipo === 'hormiga').map((c) => c.id!))

export function totalFijosMes(cats: Categoria[], cfg: Config): number {
  return fijas(cats).reduce((s, c) => s + montoMensual(c, cfg), 0)
}

/** Lo que queda de la 1ª quincena después de los fijos: es el presupuesto de gastos hormiga. */
export function presupuestoHormiga(cats: Categoria[], cfg: Config): number {
  return Math.max(cfg.sueldoNeto / 2 - totalFijosMes(cats, cfg), 0)
}

/**
 * Regla del plan: la 1ª quincena paga los fijos y los gastos hormiga;
 * la 2ª quincena va completa al ahorro.
 */
export function planQuincenas(cats: Categoria[], cfg: Config) {
  const quincena = cfg.sueldoNeto / 2
  const fijos = totalFijosMes(cats, cfg)
  return { quincena, fijos, hormiga: presupuestoHormiga(cats, cfg), ahorro: quincena }
}

// ---------- Fijos: checklist por periodo ----------

const gastosDe = (movs: Movimiento[], catId: number) => movs.filter((m) => m.tipo === 'gasto' && m.categoriaId === catId)

/** ¿El movimiento cae en el mismo periodo de pago que `fecha`? */
function mismoPeriodo(cat: Categoria, movFecha: string, fecha: string): boolean {
  if (cat.frecuencia === 'semanal') return lunesDe(movFecha) === lunesDe(fecha)
  if (movFecha.slice(0, 7) !== fecha.slice(0, 7)) return false
  if (cat.frecuencia === 'quincenal') return (Number(movFecha.slice(8)) <= 15) === (Number(fecha.slice(8)) <= 15)
  return true
}

export interface EstadoFijo {
  cat: Categoria
  pagado: boolean
  montoSugerido: number
  periodo: string
}

const PERIODO = { semanal: 'esta semana', quincenal: 'esta quincena', mensual: 'este mes' } as const

/** Estado de cada gasto fijo en el periodo actual: pagado o pendiente. */
export function estadoFijos(cats: Categoria[], movs: Movimiento[], cfg: Config, fecha = hoy()): EstadoFijo[] {
  return fijas(cats).map((cat) => ({
    cat,
    pagado: gastosDe(movs, cat.id!).some((m) => mismoPeriodo(cat, m.fecha, fecha)),
    montoSugerido: montoPorPago(cat, cfg),
    periodo: PERIODO[cat.frecuencia],
  }))
}

/** Semanas distintas (por su lunes) en las que se pagó un fijo semanal dentro del mes. */
export function semanasPagadas(cat: Categoria, movs: Movimiento[], mes: string): number {
  return new Set(gastosDe(movs, cat.id!).filter((m) => m.fecha.startsWith(mes)).map((m) => lunesDe(m.fecha))).size
}

// ---------- Movimientos ----------

export const delMes = (movs: Movimiento[], mes: string) => movs.filter((m) => m.fecha.startsWith(mes))

export function gastadoPorCategoria(movs: Movimiento[], mes: string): Map<number, number> {
  const out = new Map<number, number>()
  for (const m of delMes(movs, mes)) {
    if (m.tipo !== 'gasto' || m.categoriaId == null) continue
    out.set(m.categoriaId, (out.get(m.categoriaId) ?? 0) + m.monto)
  }
  return out
}

export function totalGastado(movs: Movimiento[], mes: string, ids?: Set<number>): number {
  return delMes(movs, mes).reduce((s, m) => (m.tipo === 'gasto' && (!ids || ids.has(m.categoriaId!)) ? s + m.monto : s), 0)
}

/** Gasto por día del mes (índice 0 = día 1). */
export function gastoPorDia(movs: Movimiento[], mes: string, ids?: Set<number>): number[] {
  const dias = Array.from({ length: diasDelMes(mes) }, () => 0)
  for (const m of delMes(movs, mes)) {
    if (m.tipo === 'gasto' && (!ids || ids.has(m.categoriaId!))) dias[Number(m.fecha.slice(8)) - 1] += m.monto
  }
  return dias
}

export function gastoPorMes(movs: Movimiento[], cats: Categoria[], meses: string[]) {
  const hormiga = idsHormiga(cats)
  return meses.map((mes) => {
    const h = totalGastado(movs, mes, hormiga)
    return { mes, hormiga: h, fijos: totalGastado(movs, mes) - h }
  })
}

// ---------- Hormiga con saldo que pasa de un mes al siguiente ----------

export interface MesHormiga {
  mes: string
  saldoAnterior: number
  presupuesto: number
  gastado: number
  /** saldoAnterior + presupuesto − gastado; lo que sobra (o falta) pasa al mes siguiente */
  disponible: number
}

export function historialHormiga(movs: Movimiento[], cats: Categoria[], cfg: Config, hasta = mesActual()): MesHormiga[] {
  const ids = idsHormiga(cats)
  const presupuesto = presupuestoHormiga(cats, cfg)
  let saldo = 0
  return mesesEntre(cfg.mesInicio, hasta).map((mes) => {
    const gastado = totalGastado(movs, mes, ids)
    const fila = { mes, saldoAnterior: saldo, presupuesto, gastado, disponible: saldo + presupuesto - gastado }
    saldo = fila.disponible
    return fila
  })
}

// ---------- Ahorro ----------

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
