# Peso

App para anotar tu peso de vez en cuando y que te celebre cada avance: kilos, grasa, músculo y salud.

## Qué hace

- **Registro sin presión:** anotas el peso cuando quieras, con una nota opcional. La app calcula una **tendencia suavizada** (media móvil exponencial ajustada por los días entre registros) para que una subida de un día no cuente.
- **Anillo de progreso:** un anillo con líquido adentro que se llena hacia tu meta, o hacia el siguiente escalón de 5% si no tienes meta.
- **Gráficas:** peso con tendencia y proyección (toca para ver cada dato), kilos por mes, IMC, de qué estás hecha (dona del InBody), % de grasa, músculo, masa grasa, grasa vs. músculo, grasa visceral y metabolismo basal.
- **Ideales de cuerpo:** en Ajustes pones tu % de grasa y tu músculo ideales. En Gráficas: anillos de "qué tan cerca" (cuánto falta y % del camino) para peso ideal, grasa y músculo, y una gráfica de camino para cada uno con la franja de lo que falta, la línea del ideal y la fecha estimada a tu ritmo.
- **Si subes de peso:** sin festejos ni logros, solo "No pasa nada 💛".
- **Peso al empezar:** si ya venías bajando antes de usar la app, pones tu peso y la fecha en que empezaste (también se puede cambiar en Ajustes) y cuenta todo lo que llevas.
- **Logros en 5 categorías:**
  - **Salud:** saliste de obesidad, peso saludable, 3/5/7/10/15/20% perdido
  - **Cuerpo (InBody):** kg de grasa fuera, músculo ganado, % de grasa, grasa visceral en rango sano, recomposición corporal
  - **Mini-metas:** tu meta dividida en 8 escalones
  - **Lo que ya no cargas:** piña, gato, sandía, llanta, maleta…
  - **Constancia:** meses en esto, número de registros, "el regreso"
- **Coach:** un mensaje después de cada registro (nuevo mínimo, una subida normal, regresar tras semanas…).
- **InBody opcional:** capturas los números de la hoja (peso, % de grasa, masa grasa, músculo, visceral, metabolismo basal) y se comparan contra el primero.
- **Eventos:** agregas una fecha (un viaje, por ejemplo) y te dice cuánto pesarías a tu ritmo actual.
- IMC con medidor, gráfica con tendencia, respaldo y restauración en JSON.

Todo se guarda solo en el teléfono (localStorage). No hay servidor.

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

Stack: Vite + React + TypeScript + Tailwind v4. Es una PWA instalable.

## Instalar en el iPhone

1. Activa GitHub Pages: **Settings → Pages → Source: GitHub Actions**. El workflow `.github/workflows/deploy.yml` publica cada push a `main`.
2. Abre `https://nanifranco.github.io/peso/` en Safari, toca Compartir y luego **Agregar a pantalla de inicio**.

## Estructura

```
src/lib/calc.ts          tendencia, ritmo semanal, IMC, predicciones y mensajes de coach
src/lib/achievements.ts  todos los logros y su progreso
src/lib/store.ts         guardado local y datos de ejemplo
src/components/          Avatar, medidor de IMC, gráfica, formularios, celebraciones
src/Screens.tsx          Inicio, Logros, Historial
src/App.tsx              navegación, hojas y Ajustes
```
