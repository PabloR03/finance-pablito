export type Frecuencia = 'semanal' | 'quincenal' | 'mensual'
export type Moneda = 'GTQ' | 'USD'
export type CuentaId = 'bi-monetaria' | 'bi-ahorro' | 'banrural'
export type TipoMovimiento = 'gasto' | 'ingreso' | 'transferencia'

export interface Cuenta {
  id: CuentaId
  nombre: string
  rol: 'gastos' | 'emergencia' | 'intocable'
}

/** fijo: se marca como pagado cada semana/mes; hormiga: gasto variable del día a día. */
export type TipoCategoria = 'fijo' | 'hormiga'

export interface Categoria {
  id?: number
  nombre: string
  tipo: TipoCategoria
  frecuencia: Frecuencia
  monto: number
  moneda: Moneda
  cuentaId: CuentaId
  nota?: string
  orden: number
  /** Quitada del presupuesto; se conserva para que el historial siga mostrando su nombre. */
  archivada?: boolean
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
  /** 'YYYY-MM' desde el que se acumula el saldo de gastos hormiga */
  mesInicio: string
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
