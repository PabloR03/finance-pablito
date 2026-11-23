import type { Categoria, Config, Cuenta } from '../lib/types'

export const CUENTAS: Cuenta[] = [
  { id: 'bi-monetaria', nombre: 'BI Monetaria', rol: 'gastos' },
  { id: 'bi-ahorro', nombre: 'BI Ahorro', rol: 'emergencia' },
  { id: 'banrural', nombre: 'Banrural', rol: 'intocable' },
]

export const CONFIG_INICIAL: Config = {
  id: 'main',
  sueldoNeto: 6000,
  semanasPorMes: 4,
  tipoCambio: 7.7,
  topeFondo: 10000,
  pctBiAntesDelTope: 0.7,
  pctBiDespuesDelTope: 0.3,
  bonoPctAhorro: 0.7,
  bonoPctPersonal: 0.1,
  bonoPctHermano: 0.2,
}

const c = (
  orden: number,
  nombre: string,
  frecuencia: Categoria['frecuencia'],
  monto: number,
  moneda: Categoria['moneda'] = 'GTQ',
  nota?: string,
): Categoria => ({ id: orden, orden, nombre, frecuencia, monto, moneda, cuentaId: 'bi-monetaria', nota })

/** Presupuesto acordado en el documento del proyecto (nov 2026). */
export const CATEGORIAS_INICIALES: Categoria[] = [
  c(1, 'Oficina', 'semanal', 200, 'GTQ', '2 idas × Q100; incluye Uber y almuerzo si toca'),
  c(2, 'Despensa', 'semanal', 200, 'GTQ', 'Aporte en casa'),
  c(3, 'Gustos', 'semanal', 100, 'GTQ', 'Comida extra, chucherías'),
  c(4, 'Pasajes', 'semanal', 50, 'GTQ', 'Transmetro'),
  c(5, 'Gym', 'mensual', 210),
  c(6, 'Claude + Gemini', 'mensual', 25, 'USD', '$25 en total'),
  c(7, 'Plan Claro', 'mensual', 100),
  c(8, 'Seguro de vida', 'mensual', 95),
  c(9, 'Spotify', 'mensual', 90),
  c(10, 'Crunchyroll', 'mensual', 40),
  c(11, 'Uber', 'mensual', 25, 'GTQ', 'Suscripción'),
  c(12, 'OneDrive', 'mensual', 10),
]
