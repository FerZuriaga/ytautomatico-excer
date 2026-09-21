# Automation Test Store — referencia de discovery consolidada

Consultar este archivo **antes** de salir a hacer `curl` para una HU
nueva de `automationteststore.com`. Sirve para no re-descubrir de cero
un patrón estructural o un dato de prueba ya verificado contra el sitio
real en una sesión anterior. Solo hacer `curl` para lo que **no** esté
documentado acá o para confirmar que un hallazgo viejo sigue vigente si
hay dudas (el sitio es una demo pública, puede cambiar).

No reemplaza el PASO 1 del pipeline (seguir prohibido adivinar
selectores) — reduce cuánto hay que volver a explorar, no elimina la
verificación real cuando el dato es nuevo.

## Motor del sitio

AbanteCart v1.2.15 (demo educativa, "this is not a real store", sin
pedidos ni pagos reales). Todas las páginas usan `index.php?rt=<ruta>`.

## Patrones estructurales que se repiten en varios módulos (no volver a descubrir)

- **Grilla de productos duplicada (grid + list):** cualquier listado de
  productos (categoría, marca/fabricante, búsqueda, ofertas especiales)
  renderiza 2 veces cada producto con la misma clase `.prdocutname`
  (typo real del sitio) — una vista oculta por CSS externo, no
  detectable leyendo el HTML crudo con `curl`. Siempre filtrar por
  `:visible` (`.prdocutname:visible`, `.thumbnails .thumbnail:visible`).
- **`<select id="sort">` y `<select id="limit">`:** disparan `Resort()`
  (JS) en `change` → navegación GET real (`location=url`), no AJAX.
  Presentes en categoría, marca/fabricante y resultados de búsqueda.
  Límite máximo real del backend: **50** (pedir más por URL se clampea
  silenciosamente).
- **Encabezado real de cualquier pantalla:** `h1.heading1 .maintext`.
  Estados de error ("no encontrado") reutilizan el mismo selector con el
  mensaje adentro, HTTP 200 (nunca 404).
- **Mensajes de error, 3 formatos distintos según el formulario** (no
  asumir uno solo): `.alert-danger` (Login/Registro/reseña), texto plano
  sin wrapper dentro de `.contentpanel` (Recuperar contraseña/login
  name, Consultar pedido, Manufacturer not found), `span.help-block`
  dentro de `.form-group` por campo (Consultar pedido, Newsletter).
- **Pestañas de producto (`#myTab`):** solo se renderiza un `<li>` por
  pestaña que realmente existe. Un producto sin tags no trae `#producttag`
  (2 `<li>` en vez de 3) — no asumir que las 3 pestañas siempre están.
- **Captcha de imagen aleatorio por sesión (bloqueante):** ya confirmado
  2 veces (reseña de producto, newsletter) — no hay forma de resolverlo
  sin OCR. Regla ya aplicada sin volver a preguntar: acotar la HU a
  estructura + bloqueo por captcha inválido/vacío, documentar en el
  campo Objetivo que el envío 100% exitoso queda fuera de alcance. Ojo:
  el texto exacto del mensaje de "verificación humana" varía con un typo
  real según el formulario (`"...again."` en reseña vs `"...try agan."`
  en newsletter, sin la primera "i") — no asumir el mismo string en los
  dos.
- **Formularios que SÍ validan campos independientemente del captcha:**
  Newsletter (First Name/Last Name/Email). **Formularios que NO** (el
  captcha tapa cualquier otro error): reseña de producto.

## Catálogo de datos de prueba ya verificados (evita volver a sondear ids)

- **Categoría Makeup:** `path=36`, 6 productos reales.
- **Producto de referencia principal:** `product_id=50` ("Skinsheen
  Bronzer Stick", $29.50) — sin oferta, con 2 tags (`cheeks`, `makeup`).
  Usado como dato de prueba en Cambiar moneda, Detalle de producto,
  Marca/fabricante, Buscar por tag.
- **Producto con oferta activa:** `product_id=65` ("Absolue Eye
  Precious Cells", $105.00 → $89.00).
- **Productos sin tags asociados (para el caso límite "sin pestaña
  Tags"):** `product_id=52` y `65` (probado también con 66/67/68/72/80/118,
  todos sin tags — el único producto conocido CON tags es el 50 y el 116).
- **Marcas/fabricantes válidos:** `manufacturer_id` 11 a 20 (M·A·C,
  Benefit, Calvin Klein, Bvlgari, Lancôme, Sephora, Pantene, Dove,
  Giorgio Armani, Gucci). Sephora (16) es la de menos stock (1 producto
  real) — útil como caso de "pocos resultados". Fuera de ese rango (1-10,
  21-23) no existen: "Manufacturer not found!", HTTP 200.
- **Ofertas especiales:** 8 productos en total ("1 - 8 of 8" en el pie).
- **Búsqueda con >50 resultados reales:** `keyword=a` (una sola letra) —
  útil para ejercitar paginación/límite sin depender de una categoría
  (ninguna categoría real supera 10 productos, máximo real: Fragrance
  con 9).
- **Formato de moneda:** USD/GBP con símbolo prefijo (`$29.50`,
  `£23.40`), EUR con símbolo sufijo (`27.69€`). Persiste 30 días vía
  cookie `currency`.

## Índice de fixtures ya publicados (selectores + hallazgos completos por módulo)

Antes de re-descubrir un módulo ya cubierto, leer directamente su JSON
en `cypress/fixtures/selectors/`: `busqueda-productos.json`,
`ordenar-listado.json`, `paginacion.json`, `detalle-producto.json`,
`escribir-resena.json`, `ofertas-especiales.json`, `carrito.json`,
`cambiar-moneda.json`, `contenido-estatico.json`, `newsletter.json`,
`site-map.json`, `recuperar-login-name.json`, `marca-fabricante.json`,
`busqueda-por-tag.json`. Cada uno trae su propia sección `hallazgos` con
el detalle real verificado — este documento resume solo lo que se repite
*entre* módulos, no duplica ese detalle.

## Cómo actualizar este archivo

Cuando una HU nueva confirme un patrón que se repite en 2+ módulos (no
un detalle exclusivo de esa HU), agregarlo acá además de al JSON de
selectores propio del módulo. Un hallazgo que solo aplica a una
funcionalidad puntual va únicamente en su fixture, no acá.
