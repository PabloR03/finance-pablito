import { useState } from 'react'
import { useDatos } from './hooks'
import { Inicio } from './screens/Inicio'
import { Movimientos } from './screens/Movimientos'
import { Observabilidad } from './screens/Observabilidad'
import { Presupuesto } from './screens/Presupuesto'
import { Registrar } from './screens/Registrar'

const TABS = [
  { id: 'inicio', label: 'Inicio', icon: '◎', titulo: 'Finance Pablito' },
  { id: 'movimientos', label: 'Movs', icon: '☰', titulo: 'Movimientos' },
  { id: 'observabilidad', label: 'Gráficas', icon: '▥', titulo: 'Observabilidad' },
  { id: 'registrar', label: 'Anotar', icon: '+', titulo: 'Anotar' },
  { id: 'presupuesto', label: 'Presup.', icon: '▤', titulo: 'Presupuesto' },
] as const

type Tab = (typeof TABS)[number]['id']

export default function App() {
  const datos = useDatos()
  const [tab, setTab] = useState<Tab>('inicio')

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="px-4 pt-6 pb-2">
        <h1 className="text-lg font-bold">{TABS.find((t) => t.id === tab)!.titulo}</h1>
      </header>

      <main className="flex-1 px-4 pb-28">
        {!datos ? (
          <p className="py-10 text-center text-slate-500">Cargando…</p>
        ) : tab === 'inicio' ? (
          <Inicio datos={datos} irA={setTab} />
        ) : tab === 'registrar' ? (
          <Registrar datos={datos} onListo={() => setTab('inicio')} />
        ) : tab === 'movimientos' ? (
          <Movimientos datos={datos} />
        ) : tab === 'observabilidad' ? (
          <Observabilidad datos={datos} />
        ) : (
          <Presupuesto datos={datos} />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setTab(t.id)}
                className={`flex w-full flex-col items-center gap-0.5 py-2 text-[11px] ${tab === t.id ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                <span className={t.id === 'registrar' ? 'flex size-9 items-center justify-center rounded-full bg-emerald-600 text-xl text-white' : 'text-lg leading-9'}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
