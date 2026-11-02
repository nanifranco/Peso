# Peso

App para anotar tu peso de vez en cuando y que te celebre cada avance: kilos, grasa, músculo y salud.

## Qué hace

- **Registro sin presión:** anotas el peso cuando quieras, con una nota opcional. La app calcula una **tendencia suavizada** (media móvil exponencial ajustada por los días entre registros) para que una subida de un día no cuente.
- **Modo arcade:** estilo de maquinita de los 80 con pixeles, neón y pantalla tipo TV vieja.
  - **Tu personaje** es un sprite de pixel art generado por código según tu **% de grasa estimado**. Con InBody se calcula con tu masa magra; si no, con la fórmula de Deurenberg a partir del IMC. Cambia de versión cuando cruzas un rango.
  - **Score** = kg perdidos. **Hi-score** = tu peso más bajo. **Nivel** = sube cada 3 logros y te da power-ups (banda, muñequeras, tenis dorados, capa y corona al llegar a la meta).
  - **Fantasma del día uno:** un contorno azul de cómo empezaste.
  - **Replay:** un slider para ver tu personaje en cualquier registro.
  - **Inventario:** las equivalencias de lo que ya no cargas. **Stats:** InBody como RPG (grasa, fuerza y defensa).
  - Sonidos chiptune opcionales (apagados por defecto).
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

Stack: Vite + React + TypeScript + Tailwind v4, con fuentes Press Start 2P y VT323 incluidas en el proyecto (funcionan sin internet). Es una PWA instalable.

## Instalar en el iPhone

1. Activa GitHub Pages: **Settings → Pages → Source: GitHub Actions**. El workflow `.github/workflows/deploy.yml` publica cada push a `main`.
2. Abre `https://nanifranco.github.io/peso/` en Safari, toca Compartir y luego **Agregar a pantalla de inicio**.

## Estructura

```
src/lib/calc.ts          tendencia, ritmo semanal, IMC, predicciones y mensajes de coach
src/lib/achievements.ts  todos los logros y su progreso
src/lib/store.ts         guardado local y datos de ejemplo
src/components/          Sprite, PixelEmoji, medidor de IMC, gráfica, formularios, celebraciones
src/lib/sound.ts         chiptune con Web Audio
src/Screens.tsx          Inicio, Logros, Historial
src/App.tsx              navegación, hojas y Ajustes
```
