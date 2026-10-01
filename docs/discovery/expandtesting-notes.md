# Discovery — Expand Testing / Notes App (https://practice.expandtesting.com/notes/app)

App de notas personales (React) para practicar testing, con API REST
pública documentada en Swagger: `https://practice.expandtesting.com/notes/api/api-docs/`
(el JSON está en `/notes/api/swagger.json`). Fuente funcional oficial: esa
documentación más la app explorada con `explore-page.js`.

## Método de discovery usado

- La API documenta los parámetros como `formData`, pero **acepta JSON**
  (verificado con curl). Autenticación con el header `x-auth-token`.
- El front es un bundle de React minificado (`/notes-app/static/js/main.*.js`).
  Las reglas de validación se leen en su función de validación (buscar por
  el texto del mensaje, ej. `Title is required`). **Usar Node con
  `indexOf`, no `grep -oE` con comodines:** sobre el bundle de una sola
  línea, grep se cuelga (2026-09-28).
- Datos para explorar: recetas `usuario` y `nota` de
  `v3/data-recipes/expandtesting-notes.json`.

## Datos y sesión — vale para todos los módulos

- **Datos aislados por usuario:** cada usuario ve solo sus notas. Un
  usuario propio por test (receta `usuario`) evita choques con otros
  testers.
- **Sesión:** `POST /users/login` devuelve `data.token`; el front lo guarda
  en `localStorage["token"]`. Inyectarlo antes de cargar la página deja la
  sesión iniciada. También guarda `activeCategory` (la pestaña elegida).
- **Selectores:** todos los elementos relevantes tienen `data-testid`.
- **Publicidad y analítica de Google** en todas las páginas: en el
  navegador de pruebas sus requests quedan sin respuesta (esperado, no son
  de la app). Vigilar que un anuncio no tape un botón.

## Crear una nota (2026-09-28)

Explorado con `explore-page.js --scenarios` (15 escenarios en 2 corridas:
formulario, camino feliz, bordes de largo, vacíos, cancelar, completada,
categorías y recarga). Selectores en
`cypress/fixtures/selectors/expandtesting-notes/notas.json`.

- **"+ Add Note"** abre el formulario "Add new note": Category (select con
  Home, Work y Personal; **Home por defecto**), casilla Completed, Title,
  Description y los botones Create y Cancel.
- **Validaciones del front** (iguales en la API, que responde 400):
  - título obligatorio (`Title is required`), de 4 a 100 caracteres
    (`Title should be between 4 and 100 characters`); 4 y 100 se aceptan;
  - descripción obligatoria (`Description is required`), de 4 a 1000
    caracteres (`Description should be between 4 and 1000 characters`); 4 y 1000 se aceptan (verificado 2026-09-30);
  - categoría obligatoria y válida: desde la UI no se puede elegir otra (la
    API rechaza una inválida con 400).
  - Los errores se muestran bajo cada campo (`.invalid-feedback`) al
    apretar Create, sin request.
- **Al crear:** `POST /notes/` y la lista se recarga (`GET /notes`). La
  tarjeta muestra título, descripción, fecha de actualización
  (`September 28, 2026 at 21:12:08`), el interruptor de completada y
  View/Edit/Delete. El resumen dice `You have 0/1 notes completed in the
  all categories`.
- **Categoría:** la tarjeta no la muestra como texto (solo el color del
  encabezado: Home rojo, Work celeste, Personal verde, gris si está
  completada). Se verifica con las pestañas: la nota aparece en la de su
  categoría y en otra se ve `You don't have any notes in the <categoría>
  category`.
- **Completed al crear:** la nota queda completada (interruptor encendido)
  y el resumen dice `You have completed all notes`.
- **Cancel** cierra el formulario sin crear nada. La nota creada **persiste
  al recargar** la página.

## Filtrar por categoría (2026-09-28)

Explorado con `explore-page.js --scenarios` (10 escenarios: cada pestaña,
volver a All, categoría vacía, recarga con filtro, categoría toda
completada). Datos con las recetas `usuario`, `nota` y `completar`.

- **Pestañas** `category-all`, `category-home`, `category-work`,
  `category-personal`. El filtro es **del lado del cliente**: no dispara
  requests (la lista se pide una sola vez, `GET /notes`).
- **Pestaña activa:** fondo con el color de su categoría y sin el punto
  "•" que muestran las demás (All nunca muestra el punto). El resto queda
  con fondo transparente.
- **Resultado:** solo las notas de la categoría; en All, todas. Orden:
  pendientes primero y completadas al final; dentro de cada grupo, la más
  reciente arriba.
- **Resumen** (`progress-info`) de la categoría elegida:
  `You have 1/2 notes completed in the work category`; si todas están
  completadas, `You have completed all notes in the home category`. Las
  completadas de otras categorías no cuentan.
- **Categoría sin notas:** solo `You don't have any notes in the personal
  category`, sin resumen visible. Ojo: `progress-info` sigue en el DOM,
  oculto, con el texto `You have completed all notes in the personal
  category` (0 de 0 cuenta como "todas"); en el test se afirma que no se
  ve, no que no existe.
- **La categoría elegida se guarda** en `localStorage["activeCategory"]`:
  al recargar la página sigue filtrada. Un test que empieza limpio arranca
  en All.
- El formulario "Add new note" **no** toma la pestaña activa: propone la
  última categoría usada al crear (`localStorage["latestCategory"]`) o
  Home. Una nota creada con otra categoría no aparece en la pestaña
  filtrada.

## Buscar notas (2026-09-29)

Explorado con `explore-page.js --scenarios` (11 escenarios en una corrida:
título, descripción en mayúsculas con Enter, sin coincidencias, escribir
sin confirmar, campo vacío, dirección directa, con categoría, cambiar de
pestaña después de buscar y texto con `&`).

- **Campo** `search-input` ("Search notes...") y botón `search-btn`
  ("Search"). Escribir no filtra: la búsqueda se confirma con **Search o
  Enter**.
- **Confirmar recarga la página completa** en
  `/notes/app/search?keyword=<texto>` (con el campo vacío, en
  `/notes/app/`). La sesión y la pestaña activa sobreviven porque viven en
  localStorage; en el test, esperar la respuesta de la búsqueda, no el
  clic.
- **La búsqueda es del servidor:** `GET /notes/?search=<texto>` (con barra
  final: no entra en un intercept de `/notes` exacto). Encuentra parte de
  una palabra en el título o la descripción, sin distinguir mayúsculas.
- **Encabezado** `<p>Search Results for <strong>"texto"</strong>:</p>`
  sin atributo de test: ubicarlo por el texto "Search Results for". El
  resumen cuenta solo las notas encontradas.
- **Sin coincidencias:** `Couldn't find any notes in all categories` o
  `Couldn't find any notes in the <categoría> category`, en el mismo
  `no-notes-message` de la lista vacía.
- **Con categoría:** los resultados del servidor se filtran por la pestaña
  activa; cambiar de pestaña después de buscar sigue sobre los resultados
  y el encabezado se mantiene.
- **Defecto SCRUM-658:** el texto viaja sin codificar a la API; con `&`
  el servidor recibe solo lo anterior ("Pan & queso" busca "Pan ").

## Completar / pendiente desde la tarjeta (2026-09-29)

Explorado con 8 escenarios en dos corridas: completar, volver a pendiente,
cada uno con recarga, orden de la lista, dentro de Work y dentro de una
búsqueda. Datos con las recetas `usuario`, `nota` y `completar`.

- **Interruptor** `toggle-note-switch` (checkbox) en cada tarjeta. Un clic
  manda `PATCH /notes/<id>` con `{ completed: <contrario> }`; mientras
  espera, la tarjeta muestra un spinner "Loading..." en lugar del
  interruptor. Sin confirmación ni aviso. En el test, esperar la respuesta
  del PATCH antes de afirmar.
- **Ubicar la tarjeta por su título** (`cy.contains(card.root, título)`):
  la lista se reordena después de cada cambio, así que una posición fija
  apunta a otra nota.
- **Resumen** (`progress-info`) al día: cuenta la categoría activa;
  todas completadas → `You have completed all notes`.
- **Orden:** pendientes primero y completadas al final; dentro de cada
  grupo, el cambio más reciente arriba. Cambiar el estado actualiza la
  fecha de la tarjeta, así que la nota vuelta a pendiente pasa al
  principio y la completada al final de su grupo.
- **Persiste** al recargar, en los dos sentidos. Funciona igual dentro de
  una búsqueda y de una pestaña de categoría.

## Editar una nota (2026-09-30)

Explorado con `explore-page.js --scenarios` (11 escenarios en una corrida:
abrir, guardar texto, guardar y recargar, categoría, completada, cancelar,
título y descripción vacíos o cortos, y edición desde la vista de detalle).
Datos con las recetas `usuario` y `nota`.

- **"Edit"** (`note-edit`) en la tarjeta abre el modal **"Edit note"**: el
  mismo formulario que "Add new note" (mismos `data-testid`), con la
  categoría, Completed, el título y la descripción de la nota ya cargados y
  los botones **Save** (`note-submit`) y Cancel. La vista de detalle
  ("View", `/notes/app/notes/<id>`) tiene su propio "Edit" que abre el
  mismo modal.
- **Save** manda `PUT /notes/<id>` con la nota completa (no PATCH) y,
  igual que al crear, **recarga la página completa**
  (`window.location.reload()` en el código): en el test, esperar la
  respuesta del PUT y después el `GET /notes` de la recarga. La fecha de la
  tarjeta pasa a ser la del cambio (se muestra en UTC, no en hora local).
- **Cambiar la categoría** mueve la nota de pestaña; marcar Completed la
  deja completada (resumen `You have completed all notes`).
- **Cancel** cierra el modal sin request y la tarjeta no cambia.
- **Validaciones:** las mismas que al crear, bajo cada campo y sin request
  (`Title is required`, `Title should be between 4 and 100 characters`,
  `Description is required`, `Description should be between 4 and 1000
  characters`).

## Borrar una nota (2026-09-30)

Explorado con `explore-page.js --scenarios` (8 escenarios en una corrida de
60 s: diálogo, confirmar con una y con dos notas, recarga, Cancel, la X,
nota completada dentro de Work y desde la vista de detalle).

- **"Delete"** (`note-delete`) en la tarjeta o en la vista de detalle abre
  el diálogo **"Delete note?"** (`note-delete-dialog`) con el título de la
  nota, **Delete** (`note-delete-confirm`), **Cancel**
  (`note-delete-cancel-2`) y la X (`note-delete-cancel-1`).
- **Confirmar** manda `DELETE /notes/<id>` y la tarjeta se quita de la
  lista **sin recargar la página** (a diferencia de crear y editar); el
  resumen cuenta solo las que quedan. En el test, esperar el DELETE.
- **Cancel y la X** cierran el diálogo sin request.
- **Desde la vista de detalle** (`GET /notes/<id>`), confirmar vuelve a
  "My Notes" (nuevo `GET /notes`).

## Iniciar y cerrar sesión (2026-10-01)

Explorado con 22 escenarios en 4 corridas cortas. Recetas nuevas:
`cuenta` (registrada sin sesión) y `cerrar-sesion` (cierra en el servidor
la sesión de `usuario`). Selectores en
`cypress/fixtures/selectors/expandtesting-notes/sesion.json`.

- **Login** (`/notes/app/login`): `login-email`, `login-password`,
  `login-submit`. El front valida antes de enviar (sin request), con el
  aviso `.invalid-feedback` bajo cada campo: email obligatorio y con
  formato; contraseña obligatoria de 6 a 30 caracteres (6 y 30 se envían).
- **Credenciales incorrectas:** `POST /users/login` 401 y el toast
  `alert-message` muestra el `message` del servidor; es el mismo para una
  contraseña equivocada y un email no registrado. El email no distingue
  mayúsculas (verificado por API).
- **Login correcto:** guarda `localStorage["token"]` y va a `/notes/app`.
- **Logout** (`logout`, en el menú de todas las pantallas):
  `DELETE /users/logout`, borra el token y muestra la bienvenida
  (`open-login-view`) sin recargar. **El servidor anula el token:**
  reusarlo lleva al login con `Your session has expired. Please login
  again to continue.` (lo mismo con cualquier token inválido).
- **Sin token**, `/notes/app` muestra la bienvenida y no pide notas.
- En el test, un alias de `GET /notes` ya tiene la respuesta 200 de la
  carga anterior: la sesión vencida se afirma por pantalla, no con
  `cy.wait`.
