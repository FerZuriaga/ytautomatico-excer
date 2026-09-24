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
- El toggle "+"/"-" de "Update Details" en Mi cuenta
  (`.toggle-details-button`).

**Typos reales en `data-testid` (usarlos tal cual, no "corregirlos"):**
`update-detials-container`, `yotuube-channel-textbox` (Mi cuenta).

## Gotcha real: en "My Details" el `data-testid` está en la ETIQUETA

En `/account`, `saved-name-info` y `saved-youtube-name-info` marcan el
`<span>` con el texto "Name:" / "Youtube Name:", NO el valor guardado.
El valor es un nodo de texto hermano dentro del mismo `<li>` — para
leerlo hay que subir al padre (`.parent()`) y comparar el texto completo
del `<li>` (ej. `"Name: Commit Quality"`).

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
- **Eliminar producto:** sin diálogo de confirmación, borra al instante
  (también de la vista filtrada si hay un filtro aplicado). El borrado
  vive solo en memoria: navegar dentro de la SPA lo conserva, un full
  reload restaura los 11 seed.
- **Mi cuenta** (`/account`): datos por defecto "Commit Quality" /
  "CommitQuality". La sección "Update Details" arranca colapsada. Save
  dispara un `alert()` nativo (`Name: X\nYoutube: Y`) y actualiza "My
  Details". Sin validación de campos. Estado local del componente: al
  salir de la pantalla (o recargar) vuelve a los valores por defecto.
- **Hallazgo:** la ruta `/account` NO valida sesión — solo el link del
  navbar se oculta sin login; por URL directa la pantalla se renderiza
  igual. No se automatiza como comportamiento esperado. Reportado como
  Bug **SCRUM-348** (control de acceso roto), vinculado a SCRUM-338.
- Validaciones de `ProductForm`: nombre mínimo 2 caracteres, precio
  numérico hasta 2 decimales (máx. 10 dígitos), fecha entre 100 años
  atrás y hoy inclusive.

## Rutas reales (confirmadas en `App.js`)

`/` (listado), `/add-product`, `/edit-product/:id`, `/login`,
`/account`, `/practice` + 17 sub-rutas `/practice-*` (retos de UI
aislados: buttons, radio-buttons, checkbox, dropdown, api, iframe, link,
dyanmic-text [sic, typo real del sitio], file-upload, drag-and-drop,
contact-form, accordions, general-components, mock-data-layer,
random-popup, file-download, clock). Automatizados solo los 4 retos
que suman técnicas nuevas al repo (iframe, drag-and-drop, file-upload,
file-download); el resto queda fuera de alcance a propósito.

## Módulo Practice — retos automatizados

Todos sin login, cada uno con link "back to practice"
(`[data-testid="back-link"]`) que navega a `/practice`.

- **IFrame** (`/practice-iframe`): `<iframe src="/">` del MISMO origen →
  su `contentDocument` es accesible desde Cypress (no hace falta plugin).
  Adentro corre una instancia propia de la app (catálogo con sus propios
  11 seed) que comparte `localStorage` con la página padre: con sesión
  iniciada el catálogo embebido muestra la columna Actions. La app del
  iframe tarda en montar: esperar a la tabla dentro del body del iframe,
  no solo a que el body exista.
- **Drag and Drop** (`/practice-drag-and-drop`): HTML5 DnD nativo
  (`dataTransfer.setData("text/plain", id)`). `cy.trigger` necesita un
  `DataTransfer` creado en la ventana de la app y compartido entre
  `dragstart` y `drop`. La caja chica tiene clase `dragging` mientras se
  arrastra; la grande pasa a clase `inside` + texto "Success!".
  **Hallazgo:** `dragenter` sobre la caja grande ya pone "Success!" sin
  soltar nada (y cualquier elemento arrastrado dispara el mismo efecto);
  `dragleave` lo revierte. No se automatiza como comportamiento esperado.
- **Subida de archivos** (`/practice-file-upload`): sin archivo → error
  "Please select a file to upload." (clase `.error-message`, sin testid)
  y sin aviso; con archivo → `alert("File successfully uploaded!")` y el
  input se vacía. Acepta cualquier tipo de archivo. El error recién
  desaparece en el siguiente submit exitoso (no al seleccionar archivo).
  Botón Submit sin testid.
- **Descarga de archivos** (`/practice-file-download`): el botón
  "Download File" (sin testid) genera en el navegador un Blob
  `text/plain` y descarga `dummy_file.txt` con el texto exacto "This is a
  dummy text file.", sin navegar. Cypress lo deja en `downloadsFolder`
  (ignorado en git).
