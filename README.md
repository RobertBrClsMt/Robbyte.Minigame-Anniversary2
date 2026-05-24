# Ven a buscarme

Mini juego / novela visual privada de segundo aniversario hecho con Vite + TypeScript.

La implementación actual incluye:

- 30 capítulos jugables basados en el documento de diseño.
- Habitación de recuerdos como hub principal.
- Sistema de recuerdos, cartas, galería, palabras desbloqueadas y guardado local.
- Minijuegos simples por click/tap: secuencias, recolección, orden, playlist y constelación.
- Música y efectos procedurales para probar sin archivos externos.
- Assets SVG temporales para fondos, personajes, objetos y fotos.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run build` compila la versión estática para publicar.

## Estructura principal

```text
public/
  content/game.json
  assets/
    backgrounds/
    characters/robert/
    characters/jennifer/
    objects/
    photos/
    ui/
src/
  main.ts
  styles.css
```

## Cambiar imágenes temporales por PNG/JPG

Los SVG están puestos con nombres finales. Para reemplazarlos:

1. Copia tu imagen real en la misma carpeta.
2. Puedes usar el mismo nombre cambiando extensión, por ejemplo:

```text
public/assets/photos/photo_manos.svg
public/assets/photos/photo_manos.jpg
```

3. Actualiza la ruta correspondiente en `public/content/game.json`:

```json
"image": "assets/photos/photo_manos.jpg"
```

Para fondos usa `background`; para sprites usa `sprite`; para objetos del hub usa `image`.

## Contenido editable

La historia vive en `public/content/game.json`:

- `characters`: nombres, colores, sprites, tamaños y offsets de posición de sprite de Robert/Jennifer.
- `memories`: catálogo de los 30 recuerdos.
- `letters`: cartas disponibles en la cajita.
- `gallery`: fotos y placeholders.
- `minigames`: interacciones simples.
- `scenes`: diálogos, fondos, música, desbloqueos y capítulos.

Los nombres visibles ya están configurados como `Robert` y `Jennifer`.

### Animaciones de diálogos

Cada entrada de `dialogues` puede animar al personaje visible con `characterAnimation`:

```json
{
  "character": "robert",
  "characterAnimation": "bounce",
  "text": "Mi amor, preparé este lugar para que recorras nuestra historia a tu ritmo."
}
```

Opciones disponibles: `bounce`, `shake`, `nod`, `wiggle`, `pulse`, `float`.

Los diálogos se escriben progresivamente. Puedes ajustar la velocidad por línea con `typingSpeed` en milisegundos por carácter. Para animar una parte del texto, usa etiquetas seguras dentro de `text`:

```json
{
  "text": "A veces el amor también suena raro. A veces suena como: [anim=wiggle]wiwiwiwi[/anim]."
}
```

Opciones disponibles para texto: `bounce`, `shake`, `pulse`, `wiggle`, `pop`, `glow`.

## Guardado

El progreso se guarda automáticamente en `localStorage` con la clave `ven-a-buscarme-save-v2`.
Al recargar la página o reiniciar el servidor local, el juego intenta restaurar la última partida válida sin pedir nada.

Si cambias mucho el JSON y una partida queda en un estado raro, entra a `Opciones` y usa `Reiniciar progreso`.

## Checklist antes de entregar

- `npm run build` termina sin errores.
- `Empezar`, `Continuar`, `Recuerdos`, `Cartas`, `Galería`, `Opciones` y `Salir` funcionan.
- El flujo llega del capítulo 1 al 30.
- La carta final se abre y luego aparecen créditos.
- Las fotos reales reemplazadas mantienen rutas válidas.
- Prueba en desktop y móvil.
