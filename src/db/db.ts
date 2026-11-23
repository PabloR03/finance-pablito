import Dexie, { type EntityTable } from 'dexie'
import { mesActual } from '../lib/budget'
import type { Categoria, Config, Cuenta, Movimiento } from '../lib/types'
import { CATEGORIAS_INICIALES, CUENTAS, ID_HORMIGA, configInicial } from './seed'

export const db = new Dexie('finance-pablito') as Dexie & {
  cuentas: EntityTable<Cuenta, 'id'>
  categorias: EntityTable<Categoria, 'id'>
  movimientos: EntityTable<Movimiento, 'id'>
  config: EntityTable<Config, 'id'>
}

const esquema = {
  cuentas: 'id',
  categorias: '++id, orden',
  movimientos: '++id, fecha, tipo, categoriaId, cuentaOrigen',
  config: 'id',
}

db.version(1).stores(esquema)

// v2: gastos fijos con checklist y una sola categoría de gastos hormiga (antes "Gustos").
db.version(2)
  .stores(esquema)
  .upgrade(async (tx) => {
    await tx
      .table('categorias')
      .toCollection()
      .modify((c: Categoria) => {
        if (c.id === ID_HORMIGA || c.nombre === 'Gustos') {
          Object.assign(c, { nombre: 'Gastos hormiga', tipo: 'hormiga', frecuencia: 'mensual', monto: 0, orden: 0, nota: 'Todo lo variable: comida extra, chucherías, antojos' })
        } else {
          c.tipo = 'fijo'
        }
      })
    const primero = await tx.table('movimientos').orderBy('fecha').first()
    await tx.table('config').update('main', { mesInicio: primero ? primero.fecha.slice(0, 7) : mesActual() })
  })

// Primera vez que se abre la app: carga el presupuesto acordado.
db.on('populate', (tx) => {
  tx.table('cuentas').bulkAdd(CUENTAS)
  tx.table('categorias').bulkAdd(CATEGORIAS_INICIALES)
  tx.table('config').add(configInicial())
})
