---
name: implementation-plan

description: >
  Build a technical implementation strategy before development.
  Define what should be reused, extended or created without modifying
  the project.

when_to_use: >
  Use after framework-analysis and before any implementation.

---

## Objetivo

Generar un plan técnico de implementación antes de comenzar cualquier desarrollo.

Este skill nunca debe escribir código, modificar archivos ni ejecutar herramientas.

Su única responsabilidad es definir cómo debería implementarse una automatización utilizando la información obtenida durante el análisis del framework.

--- 

# RESPONSABILIDAD

Este skill es responsable de:

- definir la estrategia técnica de implementación
- identificar componentes a reutilizar
- identificar componentes a extender
- recomendar nuevos componentes cuando sea necesario
- minimizar el impacto sobre el framework

Este skill nunca:

- escribe código
- modifica archivos
- ejecuta pruebas
- crea ramas
- realiza commits

# ENTRADA ESPERADA

Este skill espera recibir:

- resultado de ticket-analysis;
- resultado de framework-analysis;
- arquitectura del proyecto;
- Historia.

La Historia deberá incluir:

- criterios de aceptación;
- casos de prueba asociados;
- matriz de trazabilidad.

Esta información se utilizará únicamente para garantizar que el plan técnico cubra completamente el alcance funcional.

No deberá modificarse.


---

## Cuándo utilizar este skill

Utilizar este skill cuando:

- Ya se analizó el ticket.
- Ya se ejecutó el análisis del framework.
- Ya se identificaron los componentes reutilizables.
- Antes de comenzar cualquier implementación.

No utilizar este skill para:

- Automatizar casos de prueba.
- Crear código.
- Ejecutar pruebas.
- Crear ramas.
- Gestionar Git.
- Reportar bugs.

---

## ALCANCE DEL PLAN

Construir un plan claro que permita implementar la automatización con el menor impacto posible sobre el framework existente.

El análisis debe responder:

- ¿Qué archivos deben modificarse?
- ¿Qué componentes pueden reutilizarse?
- ¿Qué métodos nuevos son realmente necesarios?
- ¿Qué archivos NO deben tocarse?
- ¿Cuál es el orden recomendado de implementación?
- ¿Qué riesgos existen?

Nunca asumir que deben crearse archivos nuevos sin una justificación técnica.

---

## VALIDACIÓN DE COBERTURA FUNCIONAL

Antes de definir el plan de implementación, verificar que el alcance técnico cubra toda la documentación funcional recibida.

Confirmar que exista una estrategia de implementación para todos los:

- criterios de aceptación;
- casos de prueba asociados.

Si algún criterio de aceptación no puede implementarse con la arquitectura actual, informarlo explícitamente en el plan.

Nunca asumir que un criterio puede omitirse durante la implementación.



## PRINCIPIOS DE IMPLEMENTACIÓN

Siempre priorizar:

1. Reutilizar.
2. Extender.
3. Crear.

Nunca invertir este orden.

Toda recomendación debe minimizar el impacto sobre la arquitectura existente.

## Reglas obligatorias

Antes de recomendar crear un nuevo componente evaluar obligatoriamente:

Para cada componente relacionado indicar:

- Puede reutilizarse.
- Puede extenderse.
- No corresponde utilizarlo.

Siempre justificar técnicamente la decisión.

Solo recomendar crear un nuevo componente cuando:

- no exista un Page Object adecuado,
- extender uno existente rompa su responsabilidad,
- o la reutilización genere una solución poco mantenible.

Nunca recomendar crear archivos nuevos sin haber descartado explícitamente todas las alternativas existentes.

Solo recomendar crear nuevos componentes cuando exista una justificación técnica clara.

Siempre explicar el motivo.

Si una lógica nueva se repetirá dentro del mismo caso o es candidata a reutilización futura (mismo patrón ya usado en otros specs o Page Objects, mismo dominio funcional), es obligatorio extraerla a un componente compartido (Command custom, método de Page Object o helper) en lugar de duplicarla inline en el spec. Explicar esta decisión en JUSTIFICACIÓN.

## Evaluación de reutilización

El análisis debe incluir obligatoriamente una sección con el siguiente formato:



EVALUACIÓN DE REUTILIZACIÓN

Para cada componente relacionado indicar:

COMPONENTE: (Page Object, Command custom o helper)

DECISIÓN:

✔ Reutilizar

✔ Extender

✘ No corresponde

JUSTIFICACIÓN:

## Orden sugerido

Definir un orden lógico de implementación.

Ejemplo:

1. Actualizar Page Objects necesarios
2. Crear nuevos métodos (si fueran necesarios)
3. Crear el spec
4. Ejecutar pruebas
5. Validar resultados
6. Commit
7. Push
8. Pull Request

No ejecutar ninguna acción.

Solo planificar.

---

## VALIDACIÓN DE CASOS NEGATIVOS Y DE BORDE

Cuando el caso de prueba a planificar sea negativo, de borde, o valide una restricción/regla de negocio (datos inválidos, campos obligatorios vacíos, formatos incorrectos, límites de longitud, etc.), el plan nunca puede limitarse a "ingresar el dato y continuar".

El plan debe definir explícitamente cómo el script comprobará que la aplicación efectivamente rechazó o marcó el dato como inválido, no solo que el campo aceptó el texto ingresado. Para eso debe indicar el mecanismo de verificación, adaptado al framework detectado en `framework-analysis` (Cypress, Playwright, Selenium u otro):

- Aserción sobre la UI: indicador visual de validación, atributo de accesibilidad, mensaje de error visible, o alerta nativa del navegador — el mecanismo concreto depende del framework y del patrón ya usado en el proyecto, no de uno fijo.
- Si el proyecto ya sincroniza con el backend mediante interceptación de red, evaluar si corresponde interceptar la llamada asociada para esperar y validar la respuesta de error del servidor antes de continuar, en lugar de asumir el resultado solo por el estado del formulario.

Si el framework actual no tiene un patrón establecido para leer errores de la UI, el plan debe proponerlo como parte de "MÉTODOS A CREAR", igual que cualquier otro componente técnico nuevo.

Esta estrategia debe quedar reflejada en el plan; nunca dejarla implícita ni delegarla a la etapa de implementación sin definición previa.

## EXPLORACIÓN DE PÁGINAS NUEVAS

Si el plan involucra una página o flujo para el cual el framework no tiene todavía Page Object, Command ni selectores conocidos (no apareció como reutilizable en `framework-analysis`), no asumir ni adivinar selectores.

Antes de definir MÉTODOS A CREAR para esa página, correr `cy.reconPage` (Command genérico en `commands/shared.js`) sobre la URL correspondiente para relevar de forma rápida los selectores reales (forms, campos, botones, links, mensajes) y basar el plan en eso.

Esto no reemplaza la ejecución real del Test Case, solo evita perder tiempo adivinando o iterando selectores durante la implementación.

### Comportamiento dinámico (qué responde un formulario al enviarlo)

`cy.reconPage` solo lee estructura estática (GET). Si el plan necesita saber qué mensaje/estado real devuelve un formulario al enviarlo (éxito, error, campo obligatorio faltante, etc.) — no inventar ni asumir el texto del mensaje — usar el Command complementario `cy.reconSubmit(label, url, fields, submitSelector)` (mismo archivo `commands/shared.js`):

- `fields`: mapa `selector -> valor` (un valor vacío deja el campo vacío a propósito, para casos de campo obligatorio faltante).
- `submitSelector` es **obligatorio y debe ir scopeado al form concreto** (ej. `#miForm button[type="submit"]`), nunca un selector genérico tipo `form button[type="submit"]` — la página puede tener más de un `<form>` (buscador, newsletter, etc.) y un selector sin scope matchea de más y rompe el click.
- Planificar **toda la matriz de escenarios de antemano** (éxito + cada variante negativa/límite) y recorrerla con un `forEach` plano que llame a `cy.reconSubmit` una vez por escenario dentro de un único `it()`, acumulando cada resultado y volcándolos con un solo `cy.writeFile` al final — nunca un spec por escenario ni múltiples corridas de `cypress run`. No envolver las llamadas en `.reduce()`/`.then()` anidados: alcanza con un `forEach` directo seguido de `cy.then()` para el volcado final.
- Igual que con `reconPage`: spec descartable en `cypress/e2e/<app>/_recon.cy.js`, nunca commitear ni el spec ni el fixture de resultados.

## Riesgos

Identificar riesgos técnicos como:

- Selectores frágiles
- Dependencia de texto visible
- Elementos dinámicos
- Esperas implícitas
- Datos de prueba
- Flujos compartidos
- Componentes reutilizados

Clasificar el riesgo general como:

- Bajo
- Medio
- Alto

---

## Formato de salida

Finalizar siempre utilizando exactamente este formato:

PLAN DE IMPLEMENTACIÓN

ARCHIVOS A MODIFICAR

- ...

ARCHIVOS NUEVOS

- ...

PAGE OBJECTS A REUTILIZAR

- ...

PAGE OBJECTS A EXTENDER

- ...

MÉTODOS A REUTILIZAR

- ...

MÉTODOS A CREAR

- ...

ARCHIVOS QUE NO DEBEN MODIFICARSE

- ...

ORDEN RECOMENDADO

1.
2.
3.

RIESGOS IDENTIFICADOS

- ...

ESTRATEGIA DE VALIDACIÓN NEGATIVA/BORDE (solo si el caso incluye escenarios negativos o de borde)

- Mecanismo de verificación de UI: ...
- Interceptación de red (si aplica): ...

RIESGO GENERAL

Bajo | Medio | Alto

LISTO PARA IMPLEMENTAR

Sí | No

JUSTIFICACIÓN

Breve explicación técnica de las decisiones tomadas.

## RESULTADO ESPERADO

Al finalizar este skill deberá existir un plan técnico completo, consistente con la arquitectura del proyecto y listo para comenzar la implementación.

## RESTRICCIONES

Nunca:

- escribir código
- modificar archivos
- crear ramas
- ejecutar pruebas
- ejecutar comandos de control de versiones
- generar commits
- crear Pull Requests

Este skill únicamente genera un plan técnico.