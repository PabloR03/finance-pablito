import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'

/** Datos reactivos de la base local; `undefined` mientras carga. */
export function useDatos() {
  const categorias = useLiveQuery(() => db.categorias.orderBy('orden').toArray())
  const config = useLiveQuery(() => db.config.get('main'))
  const movimientos = useLiveQuery(() => db.movimientos.orderBy('fecha').reverse().toArray())
  if (!categorias || !config || !movimientos) return undefined
  return { categorias, config, movimientos }
}

export type Datos = NonNullable<ReturnType<typeof useDatos>>
