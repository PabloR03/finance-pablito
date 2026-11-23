import Dexie, { type EntityTable } from 'dexie'
import type { Categoria, Config, Cuenta, Movimiento } from '../lib/types'
import { CATEGORIAS_INICIALES, CONFIG_INICIAL, CUENTAS } from './seed'

export const db = new Dexie('finance-pablito') as Dexie & {
  cuentas: EntityTable<Cuenta, 'id'>
  categorias: EntityTable<Categoria, 'id'>
  movimientos: EntityTable<Movimiento, 'id'>
  config: EntityTable<Config, 'id'>
}

db.version(1).stores({
  cuentas: 'id',
  categorias: '++id, orden',
  movimientos: '++id, fecha, tipo, categoriaId, cuentaOrigen',
  config: 'id',
})

// Primera vez que se abre la app: carga el presupuesto acordado.
db.on('populate', (tx) => {
  tx.table('cuentas').bulkAdd(CUENTAS)
  tx.table('categorias').bulkAdd(CATEGORIAS_INICIALES)
  tx.table('config').add(CONFIG_INICIAL)
})
