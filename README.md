# Peso

App para anotar tu peso de vez en cuando y que te celebre cada avance: kilos, grasa, músculo y salud.

## Qué hace

- **Registro sin presión:** anotas el peso cuando quieras, con una nota opcional. La app calcula una **tendencia suavizada** (media móvil exponencial ajustada por los días entre registros) para que una subida de un día no cuente.
- **Avatar realista:** una persona con proporciones reales (hombre o mujer) en estilo ilustración plana. Su silueta sale de tu % de grasa (del InBody o estimado con tu IMC) y la línea punteada muestra cómo eras el día uno.
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
