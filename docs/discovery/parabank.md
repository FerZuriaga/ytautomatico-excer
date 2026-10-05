# Discovery — ParaBank (https://parabank.parasoft.com/parabank/index.htm)

Banco de demo de Parasoft (páginas JSP + formularios con AngularJS) con API
REST documentada en WADL: `https://parabank.parasoft.com/parabank/services/bank?_wadl&_type=xml`
(también SOAP en `services/ParaBank?wsdl`). Primera app incorporada después
de pasar la configuración a `qa.config.json` (prueba de "app nueva desde
cero", 2026-10-04).

## Método de discovery usado (Parte A, 2026-10-04)

- HTML directo con `curl` (las páginas vienen renderizadas del servidor) y
  la WADL para la lista de endpoints.
- Las pantallas con sesión se relevaron registrando un usuario por el
  formulario (`POST register.htm`, cookie `JSESSIONID`).
- Parte B (Login + Registro, 2026-10-05): `explore-page.js --scenarios`
  sin recetas de datos. Cada escenario registra su usuario con acciones
  sobre el formulario (las recetas de `v3/data-recipes/` solo mandan JSON,
  sin formularios ni cookies). Selectores en
  `cypress/fixtures/selectors/parabank/cuenta.json`.

## Funcionalidades (de menor a mayor complejidad)

| # | Módulo | Funcionalidad | Estado | Notas |
|---|---|---|---|---|
| 1 | Cuenta | Login | AUTOMATIZADA (SCRUM-846) | Vacío o inexistente: título "Error!" + mensaje |
| 2 | Cuenta | Registro | AUTOMATIZADA (SCRUM-836, bug SCRUM-857) | 10 campos obligatorios (teléfono opcional), error por campo; al registrarse entra con "Welcome <usuario>" |
| 2b | Cuenta | Cerrar sesión | AUTOMATIZADA (SCRUM-858, bug SCRUM-865) | Vuelve al inicio; sin sesión, las páginas de la cuenta responden 500 con "An internal error has occurred" |
| 3 | Cuenta | Recuperar datos de login (Customer Lookup) | OBSERVADA | Por datos personales + SSN |
| 4 | Cuenta | Actualizar perfil | AUTOMATIZADA (SCRUM-866, bugs SCRUM-874/875) | Error por campo (`firstName-error`, ...) |
| 5 | Banca | Resumen de cuentas | OBSERVADA | `#accountTable` |
| 6 | Banca | Abrir cuenta nueva | OBSERVADA | Tipo + cuenta origen → `#newAccountId` |
| 7 | Banca | Transferir fondos | AUTOMATIZADA (SCRUM-876 y SCRUM-883, bugs SCRUM-894 a 899) | `#amount`, `#fromAccountId`, `#toAccountId` |
| 8 | Banca | Pagar servicios | AUTOMATIZADA (SCRUM-900 y SCRUM-906, bugs SCRUM-919 a 921) | Validaciones de cuenta vacía, inválida y verificación distinta |
| 9 | Banca | Buscar transacciones | AUTOMATIZADA (SCRUM-922, bugs SCRUM-937 a 939) | Por id, fecha, rango y monto |
| 10 | Banca | Pedir préstamo | OBSERVADA | Aprobado / rechazado (`#loanStatus`) |
| 11 | Otros | Contacto (Customer Care) | OBSERVADA | Sin efecto verificable |
| 12 | Otros | Administración | OBSERVADA | Cambia la configuración del banco para todos: fuera de alcance (D-16) |

Recomendado para empezar: Login + Registro (todo lo demás necesita un
usuario; deja la receta "usuario nuevo" para el resto).

## Datos y sesión — vale para todos los módulos

- **Base compartida y borrable por cualquiera:** la API expone `cleanDB`,
  `initializeDB` y `setParameter` sin autenticación. Un usuario propio por
  test, creado al empezar; nunca depender de datos previos.
- **Registro solo por formulario:** no hay endpoint REST de alta de
  cliente. En Cypress, `cy.pbRegisterCustomer()` (`cypress/support/commands/parabank.js`)
  hace `GET register.htm` (cookie) y `POST register.htm` con `form: true`
  y termina con logout: es la receta "cliente nuevo" de todos los módulos.
- **Usuario y contraseña distinguen mayúsculas** (login y usuario repetido).
  Un usuario con un espacio adelante se registra como otro (bug SCRUM-857).
- **Páginas con bloques ocultos:** el resumen de cuentas trae un
  `#showError` con su propio `h1.title` "Error!" oculto. Ubicar los
  títulos dentro del bloque visible (`#showOverview`), nunca `h1.title` suelto.
- **Páginas de la cuenta sin sesión responden HTTP 500** (bug SCRUM-865):
  `cy.visit` corta ante un estado no-2xx; para afirmar que no hay datos del
  cliente se visita con `failOnStatusCode: false`.
- **Caídas del entorno:** el 2026-10-05 desde ~13:00 el servicio que lista
  las cuentas de un cliente devolvía 500 para todos (también `john`), y el
  resumen de cuentas mostraba "An internal error has occurred". Antes de
  tomar una falla del resumen como defecto, consultar
  `services/bank/customers/<id>/accounts` de `john`. "Update Contact Info"
  no depende de ese servicio. Volvió hacia las 15:13 del mismo día.
- **Formularios cargados por AJAX** (Update Profile y probablemente las
  demás pantallas de Banca): los datos llegan después de abrir la pantalla.
  En la exploración, `{ "action": "waitFor", "selector": "...", "filled": true }`
  antes de editar; en Cypress, esperar a que el campo tenga valor.
- **Límite de pedidos (HTTP 429):** la demo bloquea por exceso de pedidos
  con `Retry-After` de ~5 minutos, pero el 2026-10-05 el bloqueo real
  duró de 16:41 a 18:03. Lo disparó una corrida de 14 tests después de una
  tarde de exploraciones. Correr los specs de ParaBank de a uno o dos por
  corrida; ante un 429, esperar a que `index.htm` responda 200 antes de
  volver a correr (no cuenta como falla del código).
- **Clientes con dos cuentas:** `cy.pbOpenSecondAccount(customer)` abre la
  segunda por API (`services/bank/createAccount`); la inicial queda en
  $415.50 y la segunda en $100.00.
- **Transferencias:** la pantalla no valida el monto y el servidor acepta
  casi todo (bugs SCRUM-894 a 898). Un monto con tres decimales deja el
  listado de cuentas del cliente en error para siempre: usarlo solo con
  clientes propios del test, nunca con `john`.
- **Tests que solo leen (búsquedas, consultas):** preparar el cliente y sus
  datos una vez en `before` y entrar en cada test con `cy.pbLogin(customer)`.
  Baja mucho la cantidad de pedidos (límite 429). `cy.pbTransfer` y
  `cy.pbTransactions` preparan y leen movimientos por API; la fecha del
  movimiento es medianoche UTC (`day`, MM-DD-YYYY).
- **La API del banco no pide credenciales:** cualquier cliente o cuenta se
  lee por número (`services/bank/...`), y la pantalla de búsqueda por número
  hereda eso (bug SCRUM-937).
- **Mismas fallas del servidor en Transferir y en Pagar servicios:** los
  dos aceptan montos mayores al saldo y negativos (SCRUM-895/919 y
  SCRUM-896/920). Las pantallas que sí validan en el navegador (Pagar
  servicios) usan `parseFloat`: "10abc" pasa como 10.
- **Saldos:** `ParabankOverviewPage` (resumen de cuentas) es común a
  Transferir y Pagar; los selectores de la tabla están en `cuenta.json`.
- **Validación con espacios:** los obligatorios solo controlan que el campo
  no esté vacío; "   " se acepta (bug SCRUM-874 en el perfil).
- **URL con subruta** (`/parabank`): en `--scenarios`, `baseUrl` +
  `"/index.htm"` conserva la subruta desde 2026-10-05 (antes la perdía).
- **Login por API:** `GET services/bank/login/{username}/{password}`
  devuelve el cliente (sirve para obtener el `customerId`).
- **Selectores:** no hay `data-test`; hay `id` estables en casi todo. En
  Pagar servicios un campo tiene un id aleatorio (UUID): ubicarlo por otro
  atributo, nunca por ese id.
- **Mensajes de validación** del registro observados: "First name is
  required.", "Last name is required.", "Address is required.", "City is
  required.", "State is required.", "Zip Code is required.", "Social
  Security Number is required.", "Passwords did not match."
