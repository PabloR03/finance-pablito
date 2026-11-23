import { q } from '../lib/budget'

const W = 340
const ink = '#94a3b8' // slate-400
const grid = '#1e293b' // slate-800

/** Barras diarias con la línea del acumulado y el tope disponible del mes. */
export function GraficaMes({ dias, tope, hoy }: { dias: number[]; tope: number; hoy?: number }) {
  const H = 170
  const top = 14
  const base = H - 22
  const acumulado: number[] = []
  dias.reduce((s, d, i) => (acumulado[i] = s + d), 0)
  const hasta = hoy ?? dias.length
  const max = Math.max(tope, ...acumulado.slice(0, hasta), 1) * 1.1
  const y = (v: number) => base - (v / max) * (base - top)
  const bw = W / dias.length
  const maxDia = Math.max(...dias, 1)
  const yDia = (v: number) => base - (v / maxDia) * (base - top) * 0.45
  const linea = acumulado
    .slice(0, hasta)
    .map((v, i) => `${i ? 'L' : 'M'}${(i + 0.5) * bw} ${y(v)}`)
    .join(' ')
  const pasado = acumulado[hasta - 1] > tope

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gasto hormiga acumulado del mes contra lo disponible">
      <line x1="0" x2={W} y1={base} y2={base} stroke={grid} />
      {dias.map((d, i) =>
        d > 0 ? (
          <rect key={i} x={i * bw + 1} y={yDia(d)} width={Math.max(bw - 2, 1)} height={base - yDia(d)} rx="1.5" fill="#334155">
            <title>{`Día ${i + 1}: ${q(d)}`}</title>
          </rect>
        ) : null,
      )}
      <line x1="0" x2={W} y1={y(tope)} y2={y(tope)} stroke="#f59e0b" strokeDasharray="4 4" />
      <text x={W - 2} y={y(tope) - 4} textAnchor="end" fontSize="10" fill="#f59e0b">
        disponible {q(tope)}
      </text>
      <path d={linea} fill="none" stroke={pasado ? '#fb7185' : '#34d399'} strokeWidth="2" />
      {[1, 10, 20, dias.length].map((d) => (
        <text key={d} x={(d - 0.5) * bw} y={H - 6} textAnchor="middle" fontSize="10" fill={ink}>
          {d}
        </text>
      ))}
    </svg>
  )
}

/** Barras apiladas por mes: fijos abajo, hormiga arriba. */
export function GraficaMeses({ filas }: { filas: { etiqueta: string; fijos: number; hormiga: number }[] }) {
  const H = 170
  const top = 18
  const base = H - 22
  const max = Math.max(...filas.map((f) => f.fijos + f.hormiga), 1) * 1.1
  const h = (v: number) => (v / max) * (base - top)
  const slot = W / filas.length
  const bw = Math.min(34, slot * 0.6)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gasto por mes, fijos y hormiga">
      <line x1="0" x2={W} y1={base} y2={base} stroke={grid} />
      {filas.map((f, i) => {
        const x = i * slot + (slot - bw) / 2
        const total = f.fijos + f.hormiga
        return (
          <g key={f.etiqueta}>
            <rect x={x} y={base - h(f.fijos)} width={bw} height={h(f.fijos)} fill="#475569">
              <title>{`${f.etiqueta}: fijos ${q(f.fijos)}`}</title>
            </rect>
            <rect x={x} y={base - h(total)} width={bw} height={h(f.hormiga)} fill="#34d399">
              <title>{`${f.etiqueta}: hormiga ${q(f.hormiga)}`}</title>
            </rect>
            {total > 0 && (
              <text x={x + bw / 2} y={base - h(total) - 4} textAnchor="middle" fontSize="9.5" fill={ink}>
                {q(total)}
              </text>
            )}
            <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={ink}>
              {f.etiqueta}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Barras que pueden ser negativas: lo que sobró (verde) o faltó (rojo) cada mes. */
export function GraficaSaldo({ filas }: { filas: { etiqueta: string; valor: number }[] }) {
  const H = 150
  const max = Math.max(...filas.map((f) => Math.abs(f.valor)), 1) * 1.15
  const cero = H / 2 - 4
  const h = (v: number) => (Math.abs(v) / max) * (cero - 14)
  const slot = W / filas.length
  const bw = Math.min(34, slot * 0.6)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Saldo de gastos hormiga al cierre de cada mes">
      <line x1="0" x2={W} y1={cero} y2={cero} stroke="#334155" />
      {filas.map((f, i) => {
        const x = i * slot + (slot - bw) / 2
        const pos = f.valor >= 0
        return (
          <g key={f.etiqueta}>
            <rect x={x} y={pos ? cero - h(f.valor) : cero} width={bw} height={h(f.valor)} rx="2" fill={pos ? '#34d399' : '#fb7185'} fillOpacity="0.8" />
            <text x={x + bw / 2} y={pos ? cero - h(f.valor) - 4 : cero + h(f.valor) + 11} textAnchor="middle" fontSize="9.5" fill={ink}>
              {q(f.valor)}
            </text>
            <text x={x + bw / 2} y={H - 4} textAnchor="middle" fontSize="10" fill={ink}>
              {f.etiqueta}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
