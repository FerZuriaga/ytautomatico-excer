---
name: application-discovery

description: >
  Discover the functional context of a web application when the user provides
  only an application name, project name or URL. This skill identifies the
  application's main functional modules and returns them to the Manager before
  any QA activity begins.

when_to_use: >
  Use this skill immediately when the user only mentions an application,
  project or URL, for example:
  - "Vamos a trabajar con SauceDemo"
  - "Automation Exercise"
  - "https://www.saucedemo.com"
  - "Quiero automatizar OrangeHRM"

---

# Application Discovery

## Objetivo

Identificar automáticamente el contexto funcional de una aplicación web antes de comenzar cualquier proceso de QA.

Este skill nunca:

- crea tickets Jira
- automatiza
- genera código
- modifica archivos
- crea casos de prueba

Su única responsabilidad es descubrir la aplicación y entregar al Manager un resumen funcional del proyecto.

---

## RESPONSABILIDADES

Este skill únicamente debe:

- descubrir el contexto funcional de una aplicación;
- identificar funcionalidades principales;
- identificar documentación funcional disponible;
- entregar el resultado al Manager.

Nunca debe:

- crear escenarios;
- crear Historias Jira;
- automatizar pruebas;
- escribir código;
- modificar archivos.

## Cuándo utilizar

Utilizar cuando el usuario indique únicamente:

- una aplicación
- una URL
- el nombre de un sistema

Ejemplos:

"Trabajaremos con SauceDemo."

"https://www.saucedemo.com"

"Quiero automatizar OrangeHRM."

"Vamos a usar Demoblaze."

---

## ENTRADA ESPERADA

Este skill espera recibir alguno de los siguientes elementos:

- nombre de una aplicación;
- URL;
- nombre de un proyecto.

Si recibe un Ticket, Historia, Test Case o Rama Git:

- no debe ejecutarse;
- el flujo deberá continuar utilizando esa información existente.

## Objetivo del análisis

Determinar automáticamente:

PROYECTO

URL

Tipo de aplicación

Principales funcionalidades visibles

Posibles escenarios funcionales

---

## DESCUBRIMIENTO FUNCIONAL

Analizar la aplicación para identificar las funcionalidades principales visibles.

Las funcionalidades deben obtenerse a partir de:

- la propia aplicación;
- la documentación funcional disponible;
- el catálogo oficial de Test Cases, si existe.

No asumir funcionalidades que no puedan justificarse mediante alguna de estas fuentes.

Los elementos identificados servirán posteriormente como entrada para Scenario Builder.


Antes de finalizar el análisis, verificar que se haya explorado la aplicación completa dentro de lo posible.

No detener el descubrimiento al encontrar las primeras funcionalidades visibles.

Intentar identificar la mayor cantidad posible de funcionalidades funcionales relevantes.

Si existen múltiples módulos o páginas principales, incluir funcionalidades de cada uno de ellos.

Priorizar siempre la cobertura funcional antes que una respuesta breve.
---

## Priorización

Ordenar las funcionalidades de menor a mayor complejidad.

Ejemplo:

1. Login
2. Logout
3. Navegación
4. Productos
5. Carrito
6. Checkout

Esta lista servirá para construir posteriormente los escenarios funcionales.

---


## FUENTE FUNCIONAL

Intentar identificar, en este orden:

1. documentación oficial de la aplicación;
2. catálogo oficial de Test Cases;
3. guía de usuario;
4. documentación pública mantenida por el proyecto.

Si existen múltiples fuentes:

- priorizar siempre la documentación oficial.
- utilizar las demás únicamente como complemento.

Registrar la fuente utilizada como:

FUENTE_FUNCIONAL:

Si no existe documentación oficial disponible:

indicar:

"No se encontró documentación funcional oficial ni un catálogo oficial de Test Cases."
---

## Restricciones

Nunca inventar funcionalidades.

Nunca asumir módulos inexistentes.

Nunca crear escenarios.

Nunca generar Historias Jira.

Nunca hablar de Cypress.

Nunca hablar de Page Objects.

Nunca hablar de implementación.

---

## PRESENTACIÓN DE FUNCIONALIDADES

Cuando se identifiquen pocas funcionalidades (hasta 10 aproximadamente):

- mostrarlas como una lista numerada simple.

Ejemplo:

1. Login
2. Productos
3. Carrito
4. Checkout

---

Cuando se identifique una aplicación con muchas funcionalidades:

- agruparlas por módulos funcionales.
- mantener la numeración global.
- utilizar nombres de módulos representativos.
- no crear módulos que no existan en la aplicación.

Ejemplo:

AUTENTICACIÓN

1. Login
2. Logout
3. Recuperar contraseña

CATÁLOGO

4. Productos
5. Búsqueda
6. Filtros

COMPRA

7. Carrito
8. Checkout
9. Pago

CUENTA

10. Perfil
11. Historial de compras

El objetivo es facilitar la selección de funcionalidades sin alterar el flujo de trabajo.

## CLASIFICACIÓN DE FUNCIONALIDADES

Cada funcionalidad detectada debe clasificarse como:

- OBSERVADA: visible directamente en la aplicación
- INFERIDA: deducida por comportamiento típico de sistemas similares

Las funcionalidades OBSERVADAS tienen prioridad absoluta.

Las funcionalidades INFERIDAS deben marcarse explícitamente como tales.


## NIVEL DE PROFUNDIDAD

Ajustar el nivel de análisis según la complejidad de la aplicación:

- Aplicaciones demo (BlazeDemo, SauceDemo):
  análisis ligero, sin sobreinterpretación

- Aplicaciones e-commerce:
  análisis medio con validación de flujo completo

- Sistemas empresariales:
  análisis profundo con múltiples módulos y relaciones

No aplicar el mismo nivel de análisis a todas las aplicaciones.

## SELECCIÓN DE LA FUNCIONALIDAD RECOMENDADA

La funcionalidad recomendada debe priorizar:

1. baja complejidad;
2. independencia de otras funcionalidades;
3. facilidad para validar manualmente;
4. bajo número de precondiciones.

No recomendar funcionalidades complejas si existen otras más apropiadas para comenzar.


## Salida obligatoria

PROYECTO:

URL:

TIPO_APLICACION:

FUENTE_FUNCIONAL:

FUNCIONALIDADES_ENCONTRADAS:

1.
2.
3.
...

FUNCIONALIDAD_RECOMENDADA_PARA_COMENZAR:

OBSERVACIONES:

## CONTEXTO DEL PROYECTO

Si durante el descubrimiento se identifica que la aplicación ya posee automatizaciones previas dentro del proyecto, podrá informarlo únicamente como contexto.

Nunca incluir:

- nombres de archivos
- rutas del proyecto
- Page Objects
- Commands
- Helpers
- detalles de implementación

---

## FUNCIONALIDADES_PREVIAMENTE_CUBIERTAS

Si durante el descubrimiento se identifica que el proyecto ya posee funcionalidades automatizadas o implementadas previamente, listarlas únicamente como contexto.

Ejemplo:

FUNCIONALIDADES_PREVIAMENTE_CUBIERTAS

- Login
- Logout
- Alta de empleado
- Búsqueda de empleado

Este apartado es únicamente informativo para ayudar al Manager a elegir una nueva funcionalidad.

Nunca utilizar esta información para omitir el descubrimiento funcional de la aplicación.


---