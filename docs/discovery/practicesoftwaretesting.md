# Discovery — Practice Software Testing / Toolshop v5 (https://practicesoftwaretesting.com)

Tienda de herramientas de práctica (Testsmith). Angular SPA + API REST
pública con persistencia real: `https://api.practicesoftwaretesting.com`
(Swagger en `/api/documentation`). Fuente funcional oficial: README de
`github.com/testsmith-io/practice-software-testing`.

## Método de discovery usado

- El HTML servido es un shell vacío (SPA). **No hay sourcemap**: la ruta
  `*.js.map` devuelve el shell HTML (fallback de la SPA), no JSON.
- Los chunks minificados (`main-*.js` + `chunk-*.js` lazy) traen las
  plantillas compiladas de Angular con los atributos en arrays:
  `["data-test","search-query"]`. Se extraen con
  `grep -ohE '"data-test","[^"]+"' *.js` (273 valores únicos en v5).
- Las reglas de negocio se leen en los métodos del componente (ej.
  `onSearchSubmit`, `changeSorting`, `filterByBrand`) y los datos de
  prueba se cuentan contra la API pública con los mismos parámetros que
  arma el front.

## Gotchas confirmados en la primera corrida (2026-09-25)

- **El front pide productos con el método HTTP `QUERY`, no GET**
  (`httpClient.request("QUERY", url, {body})`), tanto el listado
  (`/products`) como la búsqueda (`/products/search`). La API también
  acepta GET con query string (así se relevaron los datos con curl).
  **Cypress 14.5.4 no soporta QUERY:** su Node incluido (20.18.1) no
  reconoce el método (`http.METHODS` sin `QUERY`; en Node 22 sí está), el
  proxy no reenvía la request y el catálogo nunca carga (tarjetas skeleton
  para siempre, sin ninguna request `/products` en el log). Solución
  aprobada por el usuario: `cy.gotoPSTUrl` instala un adaptador que envía
  cada XHR `QUERY` como GET con el body pasado a query string; los
  `cy.intercept` usan `method: 'GET'`. El método QUERY en sí queda sin
  cubrir. Si se actualiza Cypress a una versión con Node 22+, revisar si
  el adaptador sigue haciendo falta.
- **Los ids del seed NO son estables:** la demo re-siembra la base
  (se vio el 2026-09-25: desaparecieron las marcas "editado" y cambiaron
  todos los ULID de categorías y marcas). Los filtros se ubican por el
  texto visible exacto de la opción, nunca por `category-{id}` /
  `brand-{id}`.
- **Idioma automático:** la app usa `localStorage.language` y si no
  existe el idioma del navegador (`navigator.language`). En una PC en
  español abre en español (`/assets/i18n/es.json`). Los Test Cases usan
  los textos en inglés: `cy.gotoPSTUrl` fija `language=en` en
  `onBeforeLoad`.

## Cuentas demo oficiales (README)

`admin@practicesoftwaretesting.com` / `customer@…` / `customer2@…` con
`welcome01`; `customer3@…` con `pass123`. **Cuidado:** el admin muestra
`failed_login_attempts` por usuario → login negativo contra una cuenta
demo puede bloquearla. Para negativos usar un email inexistente o un
usuario registrado propio.

## Base de datos compartida

Otros usuarios modifican datos en vivo (se vieron 9 marcas renombradas a
`<número>editado`). En tests usar solo datos semilla estables: las 2
marcas originales (ForgeFlex Tools, MightyCraft Hardware) y las
categorías por nombre visible (los ids cambian en cada re-siembra, ver
`cypress/fixtures/selectors/practicesoftwaretesting/catalogo.json`).

## Convención de selectores

Preferir siempre `data-test`. Patrones dinámicos (ids inestables, no usar en filtros): `category-{id}`,
`brand-{id}`, `product-{id}` (la tarjeta `a.card`). Ojo: `product-name`
y `product-price` también empiezan con `product-`, por eso la tarjeta se
selecciona como `a.card[data-test^="product-"]`. El slider de precio
(ngx-slider) no tiene `data-test`: handles `.ngx-slider-pointer-min/max`
(soportan teclado: flechas, Home/End), valores en
`.ngx-slider-model-value/high`.

## Catálogo (Home): búsqueda, orden y filtros — reglas confirmadas por código

- **Búsqueda:** validador `required + minLength(3) + maxLength(40)`. Con
  el término inválido el submit se ignora en silencio (sin request, sin
  mensaje). Al buscar: resetea orden, filtros y rango de precio,
  **vacía el input** y muestra `Searched for: <término>` +
  `N products found for '<término>'` (singular `1 product found…`). Sin
  resultados: `There are no products found.`. El botón X
  (`search-reset`) limpia búsqueda, orden y filtros.
- **Semántica de la búsqueda (endpoint `/products/search`):** coincide
  por **inicio de palabra**, case-insensitive, multi-palabra en cualquier
  orden (AND). `Pli` → 4 Pliers; `ammer` → 0; `pliers long` → Long Nose
  Pliers.
- **Orden:** `name,asc|desc`, `price,asc|desc`, `co2_rating,asc|desc`
  (este último solo si la escala CO2 está habilitada, default sí). El
  orden conserva el término buscado y los filtros activos.
- **Filtros:** categorías (marcar un padre marca sus subcategorías; el
  padre solo no trae productos), marcas, "Show only eco-friendly
  products", rango de precio. Se combinan (AND) y también conservan el
  término buscado.
- **Rango de precio por defecto 1–100** (barra 0–200): el catálogo
  inicial muestra 45 de 50 productos; los 5 de más de $100 quedan ocultos
  hasta mover la barra.
- Paginado de 9 por página.

## Datos de prueba verificados (2026-09-25, rango 1–100)

| Consulta | Resultado |
|---|---|
| búsqueda `pliers` / `Pli` / `PLIERS` | 4 (Combination, Pliers, Long Nose, Slip Joint) |
| búsqueda `thor` | 1 (Thor Hammer) |
| búsqueda `hammer` | 6 (sin Sledgehammer — ver defecto) |
| búsqueda `xyzzy` | 0 |
| subcategoría Pliers | 5 (incluye Bolt Cutters) |
| categoría Power Tools (padre + subs) | 5 |
| marca MightyCraft Hardware | 9 |
| Pliers + ForgeFlex Tools | 2 |
| Pliers + eco-friendly | 0 |
| precio 0–10 | 9 |
| precio asc, primero | Washers $3.55 |
| nombre desc, primero (rango 1–100) | Wood Saw |

## Defectos / limitaciones detectados

- **Búsqueda inconsistente "hammer"/Sledgehammer:** la búsqueda usa
  inicio de palabra (6 resultados, sin Sledgehammer) pero al aplicar un
  filtro u orden sobre el término, el listado usa coincidencia parcial
  (`/products?q=`) y aparece Sledgehammer (7). Reportado como Bug.
- Rango de precio por defecto 1–100 oculta 5 productos del catálogo
  inicial (limitación, sin ticket).

## Lote 2 — navegación, detalle, comparador y alquileres (2026-09-25)

- **Menú Categories:** `nav-categories` aparece 2 veces (el toggle y la
  lista): usar `.first()` para abrirlo. Items: `nav-hand-tools`,
  `nav-power-tools`, `nav-special-tools`, `nav-rentals`.
- **Página de categoría:** título `Category: <Nombre>` (`page-title`), no
  aplica el rango de precio (Hand Tools 25, Power Tools 8, Other 17). Sin
  productos muestra `There are no products found.` en `category-empty`
  (no en `no-results`). Special Tools no existe en la API → Bug SCRUM-458.
- **Paginado:** links `a.page-link[aria-label="Page-N"]`, `li.active` en
  la actual; `pagination-prev/next` con `li.disabled` en los extremos
  (pointer-events none: el clic se fuerza para probar el intento).
- **Ficha de producto:** `unit-price`, badges `[aria-label=category]` y
  `[aria-label=brand]`, especificaciones en `tr[data-test-spec=<slug>]` con
  el valor en `spec-value-text` (`spec-value` incluye la unidad). Cantidad
  1–99: la app corrige en cada evento `input` (borrar deja 1), por eso se
  carga el valor completo y se dispara un solo `input`. Aviso por encima de
  99: `You can order at most 99 of this product.`
- **Regla de negocio: un solo Thor Hammer por carrito.** La API rechaza
  cantidad 2 con 400 `You can only have one Thor Hammer in the cart.`
  (no usar Thor Hammer para probar cantidades > 1 en el carrito).
- **Contador del carrito** (`cart-quantity`): suma de cantidades
  (sessionStorage `cart_quantity`), no cantidad de líneas.
- **Avisos:** ngx-toastr, `#toast-container .toast-message`.
- **Comparador:** máximo 4 (sessionStorage `compare_ids`); el quinto se
  ignora sin ningún aviso (confirmado en la corrida). Productos por POST
  `/graphql`. Las filas de especificación ocultas por "Show differences
  only" se quitan del DOM; la tabla tiene scroll propio, así que se
  verifica presencia y no visibilidad.
- **Alquileres:** 3 equipos (Excavator, Bulldozer, Crane), sin stock de
  venta pero alquilables. La ficha muestra `per hour` y
  `Duration (N hour(s))` con un ngx-slider de 1 a 10 (teclado), sin campo
  Quantity. La búsqueda del Home sí devuelve alquileres (ej. "excavator").

## Lote 3 — Carrito (2026-09-26, primer lote con explore-page.js)

- **Estado:** el carrito vive en el servidor (`POST /carts` → id) y el
  navegador guarda `cart_id` y `cart_quantity` en **sessionStorage**
  (Cypress lo limpia entre tests). Pantalla: `/checkout`, paso 1 "Cart".
  Para preparar un carrito sin pasar por la UI: `POST /carts`,
  `POST /carts/{id}` con `{product_id, quantity}` (header
  `Accept: application/json`, si no Laravel redirige) y cargar
  `cart_id`/`cart_quantity` en sessionStorage antes de visitar.
- **Reglas (código `app-cart` + API):** total = suma de cantidad × precio;
  cantidad 1–99 al cambiar el campo (evento `change`: menor a 1 → 1, mayor
  a 99 → 99 con `You can order at most 99 of this product.`); éxito
  `Product quantity updated.`; eliminar → `Product deleted.`; vacío →
  `The cart is empty. Nothing to display.`
- **Descuento ecológico 5%:** si MÁS del 50% de las unidades tienen CO₂ A
  o B (hoy solo hay B: Wood Saw, Safety Goggles, etc.). Exactamente 50%
  no aplica. Wood Saw solo: Subtotal $12.18, Eco `- $0.61`, Total $11.57.
  Las filas Subtotal/Descuento/Eco solo aparecen si hay algún descuento.
- **Un solo Thor Hammer por carrito:** la API rechaza cantidad 2 (PUT) y
  volver a agregarlo (POST) con `You can only have one Thor Hammer in the
  cart.`; el front lo muestra como aviso de error.
- **Ofertas por ubicación:** el listado muestra precio de oferta
  (`is_location_offer`), pero el carrito devuelve `discount_percentage`
  null y guarda `lat`/`lng`: el descuento depende de la ubicación. Fuera
  de alcance del lote.
- **Selectores:** fila `table tbody tr` con `product-title`,
  `product-quantity`, `product-price`, `line-price`; el botón eliminar
  (X roja) NO tiene data-test: `.btn-danger` dentro de la fila.
- **Hallazgo de explore-page:** ~250 errores de consola `Cannot read
  properties of undefined (reading 'cart_items')` mientras carga el
  carrito (el template lee `cart` antes de la respuesta). No es visible
  para el usuario.

## Sesión (Login/Logout) — vale para todo módulo con usuario logueado (2026-09-26)

- **Token en `localStorage["auth-token"]`** (JWT de `POST /users/login`).
  Logout (`nav-menu` → `nav-sign-out`) solo borra esa clave y recarga la
  página; queda en la misma URL.
- **El login redirige con recarga completa** (`window.location.href`):
  usuario → `/account` (título `My account`), admin → `/admin/dashboard`.
  Con sesión, `nav-sign-in` desaparece y `nav-menu` muestra
  "<nombre> <apellido>".
- **Guard de `/account/*`:** sin token (o con rol distinto de `user`)
  navega a `/auth/login`.
- **Bloqueo por intentos:** 3 logins fallidos seguidos → el siguiente
  intento (aunque la clave sea correcta) responde 423 `Account locked, too
  many failed attempts. Please contact the administrator.` (el front lo
  muestra tal cual en `login-error`). Un login exitoso reinicia el
  contador. Por eso **nunca probar negativos contra las cuentas demo del
  README**: cada test registra su propio usuario por API
  (`POST /users/register`, 201) con un email único.
- Credencial inexistente → 401 `Unauthorized` → `Invalid email or password`.
- Tras el logout el front llama `GET /users/refresh` y recibe 500 (no
  afecta al usuario; observado con `explore-page.js`).

## Checkout pasos 2-4: Sign in, Billing Address, Payment (2026-09-26)

Explorado con `explore-page.js --session-storage` sobre el mismo estado que
usan los tests (carrito por API + sesión por token), no solo por la UI.

- **Paso 2 (Sign in):** con sesión muestra `Hello <nombre> <apellido>, you
  are already logged in...` y `proceed-2`. Sin sesión: login embebido o
  pestaña "Continue as Guest" (`a[href="#guest-tab"]`): email obligatorio y
  con formato, nombre y apellido obligatorios (mínimo 2 caracteres). Los
  datos del invitado quedan en `sessionStorage.guestCheckout` y se usa
  `proceed-2-guest`.
- **Paso 3 (Billing Address):** precargada del perfil del cliente. Todos
  los campos obligatorios (street ≤70, city/state/country ≤40, postal code
  y house number ≤10); un campo inválido solo se marca con `is-invalid`
  (sin mensaje) y `proceed-3` queda **deshabilitado**.
- **Búsqueda por código postal (servicio simulado de la demo):** con país +
  código + número de casa llama `GET /postcode-lookup` y **pisa** calle,
  ciudad y estado con datos ficticios deterministas por código (AR 5000 →
  "Eduardo Points", "North Gudrun", "Illinois"); formato inválido para el
  país → 422. La factura sale con esa dirección, no con la del perfil
  (posible defecto).
- **Paso 4 (Payment):** `payment-method` obligatorio; `finish` (Confirm)
  deshabilitado hasta que el formulario es válido. Reglas por medio: Bank
  Transfer (nombre del banco solo letras/espacios, titular letras/números/
  `.'-`, cuenta numérica), Gift Card (16 alfanuméricos + código de 4),
  Credit Card (`0000-0000-0000-0000`, vencimiento `MM/YYYY` futuro, CVV 3-4
  dígitos, titular solo letras), Buy Now Pay Later (cuotas obligatorias),
  Cash on Delivery (sin datos). `POST /payment/check` responde 200
  `Payment was successful` para todos.
- **Confirm necesita DOS clics (posible defecto):** el primero valida el
  pago y muestra `Payment was successful` (`payment-success-message`) pero
  **no crea el pedido**; recién el segundo hace `POST /invoices` (201),
  vacía el carrito (`DELETE /carts/{id}`, limpia sessionStorage) y muestra
  `Thanks for your order! Your invoice number is INV-...` en
  `#order-confirmation` (el `id="invoice-number"` del texto lo elimina el
  sanitizador de Angular). La factura queda en la cuenta del cliente
  (`GET /invoices`, estado `AWAITING_FULFILLMENT`).
- **Token de sesión de 5 minutos** (`exp - iat = 300`): pedirlo dentro del
  mismo test que lo usa (`PSTLoginPage.prepareSession`), nunca reutilizarlo.
- **La re-siembra borra los usuarios registrados** (visto 2026-09-26: un
  cliente creado ~20 min antes dejó de existir y el mismo email se pudo
  registrar de nuevo). Cada test registra su propio cliente.
- **Dos búsquedas por código postal al cargar Billing Address:** esperar
  ambas respuestas antes de editar el formulario, o la segunda vuelve a
  completar la calle.
- **Los campos inválidos de la dirección nunca se marcan** (Bug SCRUM-528):
  la condición usa `cusAddress.street.errors` (siempre undefined en un
  FormGroup).
