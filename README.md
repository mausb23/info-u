# InfoU

Herramientas académicas para estudiantes de la Universidad de Costa Rica.

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://info-u.vercel.app)

## Características

- **🗓️ Creador de Horarios** — Arrastra y agrega cursos a una cuadrícula semanal (lun–dom), detecta conflictos de horario y exporta tu horario como imagen PNG.
- **📊 Control de Notas** — Gestiona cursos y tareas con notas ponderadas. Calcula tu promedio actual con escala Base 10 o Base 100. Incluye un estimador en tiempo real: escribe una nota hipotética y ve al instante si apruebas, quedas en ampliación o reprobabas.
- **📝 Apuntes** — Toma notas organizadas por curso, búscalas y edítalas inline.
- **🚌 Horarios de Bus** — Consulta las rutas internas del campus (Educación ↔ Odontología, Artes Plásticas ↔ Odontología) con temporizador en vivo de próxima salida, y 11 rutas externas interurbanas con tarifas y horarios. Fuente: redes sociales oficiales de la UCR (I Ciclo 2026).
- **🌙 Modo Oscuro** — Toggle manual o respeta la preferencia del sistema.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | [Astro](https://astro.build) 6.x (static site generator) |
| UI interactiva | [React](https://react.dev) 19 + [Zustand](https://github.com/pmndrs/zustand) (Schedule Builder) |
| Estilos | [Tailwind CSS](https://tailwindcss.com) v3 via PostCSS |
| Iconos | [Font Awesome](https://fontawesome.com) 6.4.0 (Free, CDN) |
| Fuente | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |
| Exportación | Canvas 2D API nativa (PNG) |
| Persistencia | `localStorage` |
| Análisis | Vercel Analytics + Speed Insights |
| Despliegue | [Vercel](https://vercel.com) (static, sin SSR) |

## Empezar

```bash
# Clonar
git clone https://github.com/mausb23/info-u.git
cd info-u

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build
npm run preview
```

El servidor de desarrollo corre en `http://localhost:4321`.

## Estructura del proyecto

```
src/
├── layouts/
│   └── BaseLayout.astro      # Shell HTML compartido (fonts, icons, tema oscuro, footer)
├── components/
│   ├── Nav.astro              # Barra de navegación
│   └── schedule/
│       ├── ScheduleBuilder.jsx   # Isla principal (formulario + calendario + compartir)
│       ├── CourseForm.jsx        # Formulario para agregar cursos
│       ├── CalendarGrid.jsx      # Cuadrícula semanal (CSS Grid)
│       └── ShareModal.jsx        # Compartir vía URL o PNG
├── pages/
│   ├── index.astro            # Página de inicio
│   ├── schedule.astro         # Creador de horarios
│   ├── grades.astro           # Control de notas + promedio de cursos
│   ├── apuntes.astro          # Apuntes por curso
│   └── buses.astro            # Rutas de bus (internas + externas)
├── stores/
│   └── scheduleStore.js       # Estado global (Zustand) para horarios
├── utils/
│   ├── conflicts.js           # Detección de choques de horario
│   └── exportCanvas.js        # Exportación del horario a imagen PNG
├── scripts/
│   ├── grades.js              # Lógica completa del control de notas
│   └── apuntes.js             # Lógica completa de apuntes
└── styles/
    └── global.css             # Directivas de Tailwind
public/
├── ui.js                      # Utilidades compartidas (toast, confirm)
├── grades.js                  # Copia servida de src/scripts/grades.js
├── apuntes.js                 # Copia servida de src/scripts/apuntes.js
├── theme.css                  # Reglas de modo oscuro (html.dark)
├── favicon.svg
└── (otros estáticos)
```

## Dark Mode

El modo oscuro se maneja mediante clases CSS custom en `public/theme.css` con el selector `html.dark`, activado por un script inline en `<head>` que lee `localStorage` (key `infoU_theme`). No usa las variantes `dark:` de Tailwind.

## Consideraciones Técnicas

- **Sin SSR** — Sitio 100% estático. Todo el JavaScript se ejecuta en el cliente.
- **`crypto.randomUUID()`** — Requiere contexto seguro (HTTPS o `localhost`). Usado para IDs de cursos y tareas.
- **PostCSS** — Tailwind se integra vía `postcss.config.mjs` en lugar del plugin `@astrojs/tailwind` (incompatible con Astro 6).
- **Temporizador de buses** — Corre 100% en el frontend con `setInterval`. Basado en el reloj local del dispositivo.
- **Redondeo UCR** — Las notas se redondean según el reglamento: a la unidad o media unidad más próxima, con `.25` y `.75` redondeando hacia arriba.
- **Promedio ponderado** — Calificaciones menores a 5.0 (escala 10) se consideran como 5.0 para el cálculo, según el reglamento universitario.

## Licencia

Proyecto personal con fines educativos. No afiliado a la Universidad de Costa Rica.
