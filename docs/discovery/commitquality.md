# Discovery — CommitQuality (https://commitquality.com/)

Sitio de práctica de test automation (React SPA, create-react-app), no un
e-commerce real pese al nombre de las entidades ("Product"). Sin backend:
todo el estado (productos, sesión) vive en memoria/localStorage del
navegador.

## Método de discovery usado

El HTML servido es un shell vacío (`<div id="root">`, todo se renderiza
por JS) — el HTML estático no sirve. Este sitio expone públicamente el
sourcemap del bundle (`/static/js/main.*.js.map`), que trae el código
fuente original completo (componentes React con JSX legible). Se usó ese
sourcemap para relevar selectores reales (nunca adivinados), igual de
válido que leer HTML real — de hecho más preciso, porque muestra el
código antes de cualquier render condicional. Si en una futura sesión el
sourcemap ya no está disponible, volver al método estándar de HTML
renderizado (curl no sirve acá por ser SPA; evaluar si hace falta un
navegador real).

## Convención de selectores

La app usa `data-testid` en la gran mayoría de los elementos interactivos
— preferir siempre `data-testid` sobre clases CSS cuando exista.
**Excepciones confirmadas sin `data-testid`** (usar clase):
- El input de filtro del catálogo (`.filter-textbox`).
- Los mensajes de error de campo del formulario de producto
  (`.error-message`, repetido para nombre/precio/fecha — no distinguible
  por selector, solo por posición dentro de cada `.form-group`).
- El mensaje de error de login (`.error`, sin testid propio).

## Gotcha real: `data-testid` de celdas de tabla NO es único por fila

En el listado de productos, las celdas de cada fila (`id`, `name`,
`price`, `dateStocked`) repiten el MISMO `data-testid` en todas las
filas — solo la fila completa (`product-row-{id}`) es única. Cualquier
selector de celda debe escoparse dentro de `[data-testid="product-row-
{id}"]`, nunca usarse a nivel de página.

## Formulario de producto compartido entre 2 módulos

`ProductForm` es el mismo componente para **Agregar producto**
(`/add-product`) y **Editar producto** (`/edit-product/:id`) — mismos
`data-testid`, mismas validaciones, mismo botón `submit-form` incluso en
modo edición (el texto cambia a "Update" pero el testid no). Un solo
Page Object (`CommitQualityProductFormPage`) cubre ambas HU — no
duplicar.

## Reglas de negocio confirmadas por código (no adivinadas)

- Login: credenciales fijas `test`/`test` (hardcodeadas, sin backend).
  Sesión en `localStorage.isLoggedIn`, sobrevive a reload.
- **Agregar producto NO requiere sesión iniciada** (ruta y link
  "Add a Product" visibles siempre). **Editar/Eliminar SÍ** (la columna
  "Actions" del listado solo se renderiza si `isLoggedIn`).
- Catálogo: 11 productos seed fijos en memoria, se resetea en cada full
  reload de la app (no hay persistencia real). Paginación incremental de
  a 10 vía "Show More". Filtro por nombre case-insensitive
  (`.toLowerCase().includes(...)`).
- Validaciones de `ProductForm`: nombre mínimo 2 caracteres, precio
  numérico hasta 2 decimales (máx. 10 dígitos), fecha entre 100 años
  atrás y hoy inclusive.

## Rutas reales (confirmadas en `App.js`)

`/` (listado), `/add-product`, `/edit-product/:id`, `/login`,
`/account`, `/practice` + 17 sub-rutas `/practice-*` (retos de UI
aislados: buttons, radio-buttons, checkbox, dropdown, api, iframe, link,
dyanmic-text [sic, typo real del sitio], file-upload, drag-and-drop,
contact-form, accordions, general-components, mock-data-layer,
random-popup, file-download, clock) — no automatizadas en el primer
lote, quedan como backlog.
