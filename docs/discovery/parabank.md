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
  formulario (`POST register.htm`, cookie `JSESSIONID`). Falta la
  exploración con `explore-page.js` de la funcionalidad elegida (Parte B).

## Funcionalidades (de menor a mayor complejidad)

| # | Módulo | Funcionalidad | Estado | Notas |
|---|---|---|---|---|
| 1 | Cuenta | Login | OBSERVADA | Vacío o inexistente: título "Error!" + mensaje |
| 2 | Cuenta | Registro | OBSERVADA | 10 campos obligatorios (teléfono opcional), error por campo; al registrarse entra con "Welcome <nombre> <apellido>" |
| 3 | Cuenta | Recuperar datos de login (Customer Lookup) | OBSERVADA | Por datos personales + SSN |
| 4 | Cuenta | Actualizar perfil | OBSERVADA | Error por campo (`firstName-error`, ...) |
| 5 | Banca | Resumen de cuentas | OBSERVADA | `#accountTable` |
| 6 | Banca | Abrir cuenta nueva | OBSERVADA | Tipo + cuenta origen → `#newAccountId` |
| 7 | Banca | Transferir fondos | OBSERVADA | `#amount`, `#fromAccountId`, `#toAccountId` |
| 8 | Banca | Pagar servicios | OBSERVADA | Validaciones de cuenta vacía, inválida y verificación distinta |
| 9 | Banca | Buscar transacciones | OBSERVADA | Por id, fecha, rango y monto |
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
  cliente. La receta de usuario tiene que hacer `GET register.htm` (cookie)
  y `POST register.htm` con los campos `customer.*` y `repeatedPassword`.
- **Login por API:** `GET services/bank/login/{username}/{password}`
  devuelve el cliente (sirve para obtener el `customerId`).
- **Selectores:** no hay `data-test`; hay `id` estables en casi todo. En
  Pagar servicios un campo tiene un id aleatorio (UUID): ubicarlo por otro
  atributo, nunca por ese id.
- **Mensajes de validación** del registro observados: "First name is
  required.", "Last name is required.", "Address is required.", "City is
  required.", "State is required.", "Zip Code is required.", "Social
  Security Number is required.", "Passwords did not match."
