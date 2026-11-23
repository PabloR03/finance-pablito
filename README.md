# finance-pablito

App para llevar control y ver en qué me gasto mi dinero. Es una PWA que se instala en el celular y funciona sin internet.

## La regla

| Quincena | Monto | Para qué |
| --- | --- | --- |
| 1ª | Q3,000 | Gastos fijos (≈ Q2,563) y gastos hormiga (lo que sobra, ≈ Q438) |
| 2ª | Q3,000 | Ahorro completo: 70% BI Ahorro / 30% Banrural hasta juntar Q10,000 de fondo de emergencia; después 30/70 |

- **BI Monetaria:** la única cuenta para gastar.
- **BI Ahorro:** el fondo de emergencia.
- **Banrural:** ahorro intocable.

El aguinaldo y el bono 14 se reparten así: 70% al ahorro, 10% para mí y 20% para mi hermano.

## Qué hace hoy

- **Gastos fijos como checklist:** los mensuales (Gym, suscripciones, Claro, seguro) y los semanales (Oficina, Despensa, Pasajes) se marcan como pagados. Desaparecen hasta el siguiente mes o semana.
- **Gastos hormiga:** todo lo variable va a una sola categoría, con una nota opcional ("café", "shuco"). Su presupuesto es lo que queda de la 1ª quincena después de los fijos, y lo que no se gasta en un mes pasa como saldo al siguiente (si te pasas, se descuenta).
- **Inicio:** saldo hormiga disponible, fijos pendientes, ahorro del mes, saldo de cada cuenta y fondo de emergencia. Tiene botones para registrar la quincena y transferir el ahorro ya repartido.
- **Gráficas (observabilidad):** checklist de fijos del mes, hormiga por día contra lo disponible, en qué se van los hormiga (por nota), fijos vs. hormiga de los últimos 6 meses y saldo hormiga al cierre de cada mes.
- **Movs:** los movimientos del mes, con opción de borrar.
- **Presupuesto:** montos editables de los fijos y su estado; el presupuesto hormiga se recalcula solo.
- **Ahorro:** la proyección de 12 meses y la calculadora de bonos.

Los datos viven en el navegador (IndexedDB con Dexie). La primera vez que se abre, la app carga el presupuesto acordado.

## Correr el proyecto

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pruebas de la lógica del presupuesto
npm run build    # build de producción con service worker
```

Para probarla en el celular: `npm run build && npx vite preview --host` y abre la IP de la PC desde el teléfono, en la misma red. Para instalarla como app hace falta HTTPS, así que el deploy va a Cloudflare Pages o Vercel.

## Estructura

```
src/
  lib/budget.ts      lógica pura: presupuesto, quincenas, reparto de ahorro y bonos (con pruebas)
  lib/types.ts       modelo de datos
  db/                Dexie y datos iniciales
  screens/           Inicio, Anotar, Movimientos, Presupuesto, Ahorro
supabase/migrations  esquema SQL para la sincronización (siguiente fase)
docs/                documento del proyecto y hoja de presupuesto
```

## Siguiente

1. Deploy en Cloudflare Pages para instalarla en el celular.
2. Exportar e importar CSV, compatible con la hoja.
3. Sincronización con Supabase (auth con magic link y el esquema de `supabase/migrations`).
4. Recordatorio el día de pago de la 2ª quincena (web push).
