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
