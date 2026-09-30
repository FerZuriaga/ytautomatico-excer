# Discovery — Restful Booker Platform (https://automationintesting.online)

Sitio de un B&B ("Shady Meadows B&B") hecho con Next.js, con un sitio
público y un panel de administración (`/admin`). API REST propia bajo
`/api` (`room`, `booking`, `message`, `auth`, `report`, `branding`). No hay
documentación funcional oficial: fuente = la app explorada con
`explore-page.js` y su API. Datos para explorar: recetas `mensaje` y
`admin` de `v3/data-recipes/restful-booker-platform.json`.

## Datos y sesión — vale para todos los módulos

- **Datos compartidos con todos los que usan la demo** (mensajes,
  habitaciones, reservas de otros aparecen y cambian). Cada test crea sus
  datos con un texto único y los ubica por ese texto; nunca por posición
  ni por la cantidad total.
- **La demo se reinicia sola cada pocos minutos**: los datos creados
  desaparecen y los ids vuelven a empezar (visto el 2026-09-29: el mensaje
  id 3 creado a las 19:05 ya no existía a las 19:30). Tests cortos y
  autosuficientes; no reusar datos entre tests.
- **Sesión de administrador:** `POST /api/auth/login` con `admin` /
  `password` devuelve `{ token }`; el panel lo lee de la cookie `token` y
  lo valida con `POST /api/auth/validate`. Setear la cookie antes de
  cargar el panel deja la sesión iniciada (comando
  `gotoRestfulBookerPlatformUrl(ruta, { token })`).
- **Pocos atributos de test:** solo el formulario de contacto
  (`ContactName`, `ContactEmail`, `ContactPhone`, `ContactSubject`,
  `ContactDescription`), la lista de habitaciones del panel
  (`roomlisting`, `roomName`) y la bandeja (`message<n>`,
  `messageDescription<n>`, detalle `message`). El resto: id (`#username`,
  `#password`, `#doLogin`) o texto.
- Pedir un mensaje que no existe responde 500 (no 404).

## Mensajes: contacto y bandeja (2026-09-29)

Explorado con 14 escenarios en cuatro tandas. Selectores en
`cypress/fixtures/selectors/restful-booker-platform/mensajes.json`.

- **Formulario "Send Us a Message"** (página principal). Las reglas las
  valida **el servidor**: `POST /api/message` responde 400 con la lista de
  avisos (en orden variable) y la pantalla los muestra juntos en una
  alerta. Todos los campos obligatorios (vacío: 8 avisos); email con
  formato válido; teléfono 11–21 caracteres; asunto 5–100; mensaje
  20–2000; el nombre no tiene largo mínimo.
- **Envío aceptado (200):** el formulario se reemplaza por
  `Thanks for getting in touch <nombre>!` + `We'll get back to you about
  <asunto> as soon as possible.`
- **Bandeja** (`/admin/message`, menú "Messages"): filas
  `.row.detail.read-false|read-true` con nombre y asunto. El menú muestra
  en rojo (`.badge`) las no leídas (`GET /api/message/count`).
- **Abrir una consulta** (clic en el asunto): detalle con `From:`,
  `Phone:`, `Email:`, asunto y mensaje; el front llama
  `PUT /api/message/<id>/read` (202) y el contador baja en uno. "Close"
  vuelve a la lista con la fila en `read-true`.
- **Sin sesión**, el panel y la bandeja muestran el login.
- **Defecto SCRUM-694:** `GET /api/message` y `GET /api/message/<id>`
  responden sin sesión (nombre, email y teléfono del huésped). Marcar como
  leído y borrar sí devuelven 403 sin sesión. Captura tomada con
  `--init-script` (Cypress no abre una respuesta JSON con `visit`).
- Una vez, entrar directo a `/admin/report` recargando la página dejó el
  panel en "Loading..." con "Error validating authentication: Failed to
  fetch"; no se repitió en `/admin/message`. Sin reportar.

## Reservas (2026-09-29)

Explorado con 16 escenarios en dos tandas (receta `reserva` para dejar
fechas ocupadas). Selectores en
`cypress/fixtures/selectors/restful-booker-platform/reservas.json`.

- **Pantalla de la habitación:** `/reservation/<id>?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD`
  (a la que lleva "Book now" desde la home con las fechas elegidas). Pide
  la disponibilidad `GET /api/report/room/<id>` ya montada: esperarla antes
  de hacer clic (misma re-hidratación de Next.js que el panel).
- **"Reserve Now"** abre el formulario (`.room-firstname`, `.room-lastname`,
  `.room-email`, `.room-phone`, sin atributos de test); un segundo
  "Reserve Now" hace `POST /api/booking` (201). "Cancel" cierra sin enviar.
- **Resumen de precio:** `£<precio> x <n> nights`, "Cleaning fee" £25,
  "Service fee" £15, "Total" = precio × noches + 40.
- **Confirmación:** "Booking Confirmed" + "Your booking has been confirmed
  for the following dates:" + `<checkin> - <checkout>`.
- **Validaciones del servidor (400, `errors`):** nombre 3–18, apellido 3–30,
  teléfono 11–21, email válido; vacío → "Firstname/Lastname should not be
  blank" y "must not be empty". Los avisos de largo no nombran el campo
  (Bug SCRUM-716).
- **Fechas ocupadas o check-out ≤ check-in → 409** con `error` (no
  `errors`): la pantalla lee `errors.length` y la página se rompe ("This
  page couldn’t load", Bug SCRUM-714). **Fechas pasadas se confirman**
  (Bug SCRUM-715).
- **Datos en los tests:** fechas futuras al azar y distintas por test
  (`randomFutureStay`): una corrida anterior deja ocupadas las mismas
  fechas hasta el próximo reinicio de la demo.
