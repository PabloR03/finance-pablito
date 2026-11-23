import { mesActual } from '../lib/budget'
import type { Categoria, Config, Cuenta } from '../lib/types'

export const CUENTAS: Cuenta[] = [
  { id: 'bi-monetaria', nombre: 'BI Monetaria', rol: 'gastos' },
  { id: 'bi-ahorro', nombre: 'BI Ahorro', rol: 'emergencia' },
  { id: 'banrural', nombre: 'Banrural', rol: 'intocable' },
]

export const configInicial = (mesInicio = mesActual()): Config => ({
  id: 'main',
  mesInicio,
  sueldoNeto: 6000,
  semanasPorMes: 4,
  tipoCambio: 7.7,
  topeFondo: 10000,
  pctBiAntesDelTope: 0.7,
  pctBiDespuesDelTope: 0.3,
  bonoPctAhorro: 0.7,
  bonoPctPersonal: 0.1,
  bonoPctHermano: 0.2,
})

export const ID_HORMIGA = 3

const fijo = (
  orden: number,
  nombre: string,
  frecuencia: Categoria['frecuencia'],
  monto: number,
  moneda: Categoria['moneda'] = 'GTQ',
  nota?: string,
): Categoria => ({ id: orden, orden, nombre, tipo: 'fijo', frecuencia, monto, moneda, cuentaId: 'bi-monetaria', nota })

/** Presupuesto acordado en el documento del proyecto (nov 2026). */
export const CATEGORIAS_INICIALES: Categoria[] = [
  fijo(1, 'Oficina', 'semanal', 200, 'GTQ', '2 idas × Q100; incluye Uber y almuerzo si toca'),
  fijo(2, 'Despensa', 'semanal', 200, 'GTQ', 'Aporte en casa'),
  {
    id: ID_HORMIGA,
    orden: 0,
    nombre: 'Gastos hormiga',
    tipo: 'hormiga',
    frecuencia: 'mensual',
    // El presupuesto real se calcula: 1ª quincena − fijos (ver presupuestoHormiga).
    monto: 0,
    moneda: 'GTQ',
    cuentaId: 'bi-monetaria',
    nota: 'Todo lo variable: comida extra, chucherías, antojos',
  },
  fijo(4, 'Pasajes', 'semanal', 50, 'GTQ', 'Transmetro'),
  fijo(5, 'Gym', 'mensual', 210),
  fijo(6, 'Claude + Gemini', 'mensual', 25, 'USD', '$25 en total'),
  fijo(7, 'Plan Claro', 'mensual', 100),
  fijo(8, 'Seguro de vida', 'mensual', 95),
  fijo(9, 'Spotify', 'mensual', 90),
  fijo(10, 'Crunchyroll', 'mensual', 40),
  fijo(11, 'Uber', 'mensual', 25, 'GTQ', 'Suscripción'),
  fijo(12, 'OneDrive', 'mensual', 10),
]
