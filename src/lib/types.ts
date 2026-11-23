export type Frecuencia = 'semanal' | 'quincenal' | 'mensual'
export type Moneda = 'GTQ' | 'USD'
export type CuentaId = 'bi-monetaria' | 'bi-ahorro' | 'banrural'
export type TipoMovimiento = 'gasto' | 'ingreso' | 'transferencia'

export interface Cuenta {
  id: CuentaId
  nombre: string
  rol: 'gastos' | 'emergencia' | 'intocable'
}

export interface Categoria {
  id?: number
  nombre: string
  frecuencia: Frecuencia
  monto: number
  moneda: Moneda
  cuentaId: CuentaId
  nota?: string
  orden: number
}

export interface Movimiento {
  id?: number
  /** Fecha local en formato YYYY-MM-DD */
  fecha: string
  /** Siempre en quetzales */
  monto: number
  tipo: TipoMovimiento
  categoriaId?: number
  cuentaOrigen: CuentaId
  cuentaDestino?: CuentaId
  nota?: string
  creadoEn: number
}

export interface Config {
  id: 'main'
  sueldoNeto: number
  semanasPorMes: number
  tipoCambio: number
  topeFondo: number
  pctBiAntesDelTope: number
  pctBiDespuesDelTope: number
  bonoPctAhorro: number
  bonoPctPersonal: number
  bonoPctHermano: number
}
