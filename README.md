# ZombiLand

Un juego de supervivencia 3D en primera línea contra hordas de zombis. Explora el puesto abandonado, apunta con la cámara, consigue monedas y supera oleadas cada vez más difíciles.

## Ejecutar

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev
```

Abre la dirección local que muestra Vite (normalmente `http://localhost:5173`). Three.js se carga desde jsDelivr, por lo que se necesita conexión a internet.

## Controles

- **W / A / S / D**: moverse.
- **Ratón**: apuntar y controlar la cámara (haz clic en el escenario para capturar el ratón).
- **Clic izquierdo**: disparar.
- **R**: recargar cuando el cargador esté vacío.
- **Esc** o el botón **Ⅱ**: pausar y reanudar.
- Recoge los aros dorados para sumar monedas.

El menú de pausa incluye volumen, sensibilidad de cámara y vibración de cámara. Los efectos de disparo, impactos, daño y monedas se sintetizan en el navegador; el audio se activa con la primera interacción.
