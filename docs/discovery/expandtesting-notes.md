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
    caracteres (`Description should be between 4 and 1000 characters`);
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
