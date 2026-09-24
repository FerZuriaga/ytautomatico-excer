---
name: scenario-builder

description: >
  Build a functional scenario from a selected application
  functionality. Produces a structured specification ready
  for ProductAgent to create a User Story.

when_to_use: >
  Use after Application Discovery or whenever a functionality
  has already been selected but no Test Case exists.

---

# Scenario Builder

## Objetivo

Transformar una aplicación o un escenario funcional en una especificación estructurada que posteriormente utilizará ProductAgent para crear una Historia de Usuario.

El origen del escenario puede ser:

- un escenario funcional proporcionado por el usuario
- una aplicación web
- una URL
- una documentación funcional
- un catálogo oficial de Test Cases

Este skill debe intentar descubrir el escenario antes de solicitar información adicional.

---

# RESPONSABILIDAD

Este skill es responsable de:

- construir un único escenario funcional
- identificar reglas funcionales
- definir el flujo esperado
- preparar la información para ProductAgent

Este skill nunca:

- crea Historias de Usuario
- crea código
- automatiza pruebas
- genera casos de prueba automatizados

## Cuándo utilizar

Utilizar únicamente cuando el usuario NO proporciona un Test Case existente.

Ejemplos:

* "Automatizar el login."
* "Quiero automatizar el checkout."
* "Necesito automatizar el carrito."
* "Automatizar el registro de usuarios."

Si el usuario proporciona un Test Case completo, este skill no debe utilizarse.

---

# ENTRADA ESPERADA

Este skill espera recibir alguno de los siguientes elementos:

- aplicación
- URL
- funcionalidad previamente seleccionada
- documentación funcional
- catálogo oficial de Test Cases

Si existe más de una funcionalidad disponible, deberá esperar que el usuario seleccione una antes de construir el escenario.

## REGLAS DE DESCUBRIMIENTO

Si la aplicación contiene múltiples funcionalidades:

- No asumir cuál desea automatizar el usuario.
- Mostrar las funcionalidades detectadas.
- Esperar la selección del usuario.

---

Si una funcionalidad contiene múltiples escenarios:

- No asumir cuál corresponde.
- Mostrar los escenarios detectados.
- Esperar la selección del usuario.

---

Construir el escenario únicamente cuando exista una selección explícita.

## REGLA DE CONTINUIDAD

Si el usuario ya seleccionó una funcionalidad previamente, nunca volver a solicitarla.

Continuar utilizando la funcionalidad recibida como contexto de entrada.

Nunca volver a ejecutar Application Discovery.

## CONFIANZA EN EL CONTEXTO PREVIO

Cuando Scenario Builder reciba información proveniente de Application Discovery, deberá considerarla la fuente oficial para esta etapa.

Si una funcionalidad fue clasificada como OBSERVADA, deberá asumir que ese estado ya fue validado.

No volver a indicar que la funcionalidad es inferida.

No solicitar una nueva validación funcional.

No cuestionar la clasificación recibida.

Solo informar una posible inconsistencia cuando, durante el análisis del escenario, encuentre evidencia concreta de que el comportamiento observado difiere del contexto recibido.

En ese caso deberá describir la inconsistencia encontrada sin reiniciar el flujo.

## CONSISTENCIA ENTRE ETAPAS

Cada etapa del flujo deberá utilizar como fuente oficial la salida estructurada de la etapa inmediatamente anterior.

No deberá reinterpretar, degradar ni invalidar información previamente validada.

Si detecta una inconsistencia, deberá reportarla explícitamente y continuar utilizando el contexto recibido hasta que el usuario indique lo contrario.

## INFORMACIÓN REQUERIDA

Intentar obtener, en este orden:

1. Proyecto
2. URL (si existe)
3. Documentación funcional (si existe)
4. Escenario

Si el escenario puede descubrirse automáticamente, no solicitarlo al usuario.

Solicitar únicamente la información que no pueda inferirse.

---

## Objetivo del análisis

Convertir una idea funcional en un escenario estructurado.

Debe identificar:

* objetivo
* precondiciones
* flujo principal
* resultado esperado
* reglas funcionales

---

## ENFOQUE DEL ANÁLISIS FUNCIONAL

Antes de generar escenarios, analizar la funcionalidad desde una perspectiva funcional completa.

No asumir que una funcionalidad produce un único escenario.

Una misma funcionalidad puede involucrar múltiples comportamientos independientes que deban validarse por separado.

Identificar, cuando corresponda:

- navegación entre pantallas;
- transferencia o persistencia de datos;
- consistencia de la información mostrada;
- disponibilidad de acciones del usuario;
- continuidad del flujo;
- navegación hacia atrás y repetición del proceso;
- comportamiento frente a múltiples elementos;
- integridad de la información durante el flujo.

Cada comportamiento funcional identificado podrá originar uno o más escenarios.

Proponer únicamente escenarios que puedan inferirse del comportamiento observable de la aplicación o de su documentación.

No generar escenarios artificiales.
No inventar comportamientos inexistentes.

No asumir que el primer escenario identificado representa toda la funcionalidad.

Continuar explorando la funcionalidad hasta identificar la mayor cantidad posible de comportamientos funcionales independientes antes de finalizar el análisis.

## PROCESO

1. Analizar el contexto recibido.

2. Identificar la funcionalidad.

3. Descubrir los escenarios funcionales disponibles.

4. Si existe un único escenario, construirlo automáticamente.

5. Si existen múltiples escenarios, mostrarlos numerados y esperar la selección del usuario.

6. Generar una única especificación funcional.

## COBERTURA FUNCIONAL

El Scenario Builder debe intentar identificar TODOS los escenarios funcionales relevantes de la funcionalidad analizada, a tres niveles:

**A nivel de funcionalidad** — intentar identificar, cuando correspondan:

- flujo principal
- escenarios positivos
- escenarios negativos
- escenarios alternativos
- validaciones funcionales
- reglas de negocio
- casos límite (Boundary Value)
- entradas inválidas
- errores del usuario
- restricciones del sistema
- escenarios excepcionales
- escenarios previamente automatizados (si existen)

Si una categoría no aplica, simplemente omitirla. No limitar la salida a 3 o 4 ejemplos: detectar la mayor cantidad posible de escenarios funcionales reales, incluyendo variaciones de comportamiento del sistema y escenarios negativos siempre que existan.

No inventar escenarios ni asumir comportamientos que no puedan inferirse de la aplicación o de su documentación. Cuando la aplicación no disponga de documentación funcional, utilizar las convenciones habituales del dominio de negocio (por ejemplo: ecommerce, login, reserva de vuelos, banca, etc.) para ampliar la cobertura funcional, sin inventar comportamientos inexistentes.

**A nivel de caso de prueba** — los casos deben existir únicamente cuando aporten una validación distinta. No generar casos únicamente para cumplir una cantidad mínima, ni limitarlos artificialmente. Cada caso deberá validar un comportamiento funcional diferente: si un criterio requiere cinco validaciones distintas, generar cinco casos; si únicamente requiere uno, generar uno.

La prioridad es siempre la cobertura funcional, nunca la cantidad. El objetivo es lograr la cobertura funcional más completa posible antes de solicitar la selección del usuario.

## PREPARACIÓN PARA LA HISTORIA DE USUARIO

La especificación generada debe servir como entrada directa para ProductAgent.

Por ello, además del escenario funcional, deberá identificar:

- los principales criterios de aceptación verificables;
- los casos de prueba funcionales derivados de cada criterio;
- la trazabilidad entre criterios y casos de prueba.

No debe crear la Historia de Usuario.

Debe dejar toda la información preparada para que ProductAgent únicamente la transforme en una Historia.

## CRITERIOS DE ACEPTACIÓN

Cada escenario deberá identificar los criterios de aceptación necesarios para validar completamente la funcionalidad.

Los criterios deben ser:

- independientes;
- verificables;
- orientados al comportamiento esperado del sistema;
- redactados desde una perspectiva funcional.

No generar criterios redundantes.

Un criterio contiene **una sola regla**: si su texto junta dos
comportamientos que pueden fallar por separado (ej. "muestra el error sin
archivo" + "el error desaparece con la siguiente subida"), son dos
criterios o dos casos de prueba del mismo criterio, nunca una frase con
"y".

## NECESIDAD DEL USUARIO (antes de los criterios)

La Historia expresa una necesidad, no la descripción de una pantalla. Antes
de escribir los criterios, definir:

- **Usuario:** el rol concreto que obtiene el beneficio (ej. "administrador
  del catálogo", "cliente con una compra en curso"). Nunca "usuario" o
  "usuario de <app>" a secas.
- **Beneficio:** qué logra ese usuario gracias a la funcionalidad, en
  términos de negocio. No puede repetir la acción con otras palabras
  ("subir un archivo… para enviarlo a la aplicación" no dice nada).
- **Objetivo de la Historia:** el resultado de negocio cuando la
  funcionalidad está implementada. Nunca empieza con "Verificar/Validar…":
  eso es el objetivo de un caso de prueba.

Si la funcionalidad es un mecanismo técnico sin usuario real (ej. un reto
de práctica "IFrame"), plantear la capacidad que ese mecanismo le da a un
usuario, o informarlo en RIESGOS O AMBIGÜEDADES.

## COMPORTAMIENTO RELEVADO ≠ REQUISITO

El discovery muestra lo que la aplicación **hace hoy**, no lo que **debe
hacer**. Antes de convertir un comportamiento relevado en criterio de
aceptación, contrastarlo con el beneficio de la Historia:

- si lo sostiene (ej. "rechaza el precio con 3 decimales") → es un
  criterio;
- si lo contradice (ej. la Historia promete "mantener mis datos al día"
  y la app pierde lo guardado al recargar) → **no es un criterio**: es un
  posible defecto (`bug-reporting`) o una limitación conocida, y va en
  LIMITACIONES O POSIBLES DEFECTOS, nunca como "CA: los datos deben
  revertirse". Un criterio así hace que el test pase justamente cuando la
  funcionalidad falla.

Caso real que originó la regla: SCRUM-338 (CommitQuality, Mi cuenta),
CA-04 "los datos guardados deben revertirse al recargar".

## LENGUAJE DE NEGOCIO

La Historia y sus criterios no llevan rutas (`/account`), URLs ni términos
de implementación (iframe, almacenamiento local, backend, alert nativo,
selectores). Ese detalle va en las Precondiciones/Pasos de los casos de
prueba o en `docs/discovery/<app>.md`. Sí se permiten los textos visibles
que el usuario ve (nombre de un botón, mensaje de error exacto).

## IDENTIFICACIÓN DE REQUISITOS FUNCIONALES

Antes de generar los criterios de aceptación, analizar cada comportamiento identificado y clasificarlo como:

- comportamiento funcional;
- comportamiento observado;
- detalle de implementación;
- observación de interfaz;
- restricción técnica.

Solo los comportamientos funcionales deberán convertirse en criterios de aceptación.

No generar criterios para:

- detalles visuales;
- mecanismos de implementación;
- observaciones realizadas durante la exploración;
- ausencia de funcionalidades;
- restricciones técnicas que no representen un comportamiento esperado por el usuario.

## DEFINICIÓN DE CASO DE PRUEBA FUNCIONAL

Un caso de prueba funcional representa un procedimiento ejecutable por un tester para verificar un único comportamiento del sistema.

Cada caso de prueba deberá ser independiente, verificable y mantener trazabilidad con un único criterio de aceptación.

## COBERTURA DEL CRITERIO

Antes de generar los casos de prueba de un criterio, analizarlo e identificar todos los comportamientos funcionales que deban verificarse. Solo después de completar ese análisis generar los casos de prueba correspondientes. No generar casos de prueba de forma automática sin evaluar previamente la cobertura necesaria.

Evaluar si un único caso de prueba alcanza para validar completamente el comportamiento. Si existen comportamientos distintos dentro del mismo criterio deberán generarse múltiples casos de prueba independientes.

Ejemplos:

- búsqueda exitosa
- búsqueda sin resultados
- búsqueda con coincidencia parcial
- búsqueda con espacios
- búsqueda con caracteres especiales

No limitar la salida a un único caso de prueba cuando existan validaciones funcionalmente diferentes.

## CASOS DE PRUEBA DERIVADOS

Para cada criterio de aceptación identificado, generar entre 2 y 5 casos de prueba funcionales que validen dicho criterio desde comportamientos distintos, priorizando siempre la cobertura funcional real por sobre completar una cantidad fija.

Todo criterio de aceptación debe incluir obligatoriamente:

- al menos un caso positivo;
- al menos un caso negativo;
- los casos adicionales necesarios (alternativos, de borde, validaciones) hasta completar el máximo de 5 cuando el criterio lo admita.

**Mínimo estricto: 2 casos de prueba por criterio** (uno positivo y uno negativo). Nunca generar un único caso de prueba para un criterio.

Si un criterio admite razonablemente más de 5 comportamientos distintos, generar los casos necesarios para no perder cobertura funcional real; nunca sacrificar cobertura por respetar el rango.

Si un criterio es funcionalmente simple —por ejemplo, un comportamiento binario como "disponible / no disponible" o "encontrado / no encontrado"— alcanza con el mínimo de 2 casos (uno positivo, uno negativo) sin necesidad de inventar variantes redundantes solo para acercarse a 5. Este es el comportamiento esperado en ese caso, no una excepción a señalar en RIESGOS_O_AMBIGÜEDADES.

Cada caso de prueba deberá indicar explícitamente qué criterio de aceptación valida.

Cada caso de prueba deberá poder ejecutarse de manera independiente como un caso de prueba manual.

La información generada deberá ser suficiente para utilizarse directamente en herramientas de gestión de pruebas como Zephyr, sin necesidad de reinterpretar el caso de prueba.

## CONSOLIDACIÓN DE CRITERIOS

Si un escenario negativo representa únicamente un resultado posible de un comportamiento ya cubierto por otro criterio de aceptación, no generar un criterio independiente.

Documentar ese comportamiento mediante uno o más casos de prueba asociados al criterio correspondiente.

Ejemplo:

Correcto:

CA-01
Buscar empleado

TC-01.1
Búsqueda exitosa

TC-01.2
Sin resultados

Incorrecto:

CA-01
Buscar empleado

CA-02
Sin resultados

## ESTRUCTURA DE LOS CASOS DE PRUEBA

Cada caso de prueba funcional deberá incluir obligatoriamente:

- Título
- Objetivo
- Precondiciones (si aplican)
- Pasos de ejecución
- Resultado esperado
- Criterio de aceptación que valida

Los pasos deberán describir únicamente acciones realizadas por el usuario.

El resultado esperado deberá describir únicamente el comportamiento observable del sistema.

No incluir detalles técnicos, de implementación ni de automatización.

## CALIDAD DEL CASO DE PRUEBA

Cada caso de prueba deberá poder importarse o copiarse directamente a una herramienta de gestión de pruebas como Zephyr.

Antes de finalizar cada caso verificar que:

- tenga un objetivo único;
- valide un único comportamiento;
- sea ejecutable de forma independiente;
- no dependa de otro caso de prueba;
- tenga pasos claros y secuenciales;
- tenga un único resultado esperado verificable.

Si un caso intenta validar más de un comportamiento, dividirlo en múltiples casos.

## ABSTRACCIÓN FUNCIONAL

Los criterios de aceptación deberán describir capacidades funcionales del sistema y no la forma específica en que dichas capacidades fueron implementadas.

Correcto:

- El usuario puede acceder a todos los resultados disponibles.

Incorrecto:

- El sistema carga resultados mediante scroll infinito.

Correcto:

- El sistema permite localizar empleados utilizando filtros.

Incorrecto:

- El filtro utiliza un componente de autocompletado AJAX.

## TRAZABILIDAD Y NUMERACIÓN

Además de generar los criterios de aceptación y sus casos de prueba derivados, presentar una matriz de trazabilidad que relacione cada criterio con los casos de prueba que lo validan. Esta matriz deberá permitir identificar rápidamente la cobertura funcional del escenario y servir como entrada para las siguientes etapas del flujo.

Formato:

| Criterio | Casos de prueba |
|----------|-----------------|
| CA-01 | TC-01.1, TC-01.2, TC-01.3, TC-01.4 |
| CA-02 | TC-02.1, TC-02.2, TC-02.3, TC-02.4, TC-02.5 |

Reglas:

- Todo criterio de aceptación deberá tener al menos un caso de prueba asociado.
- Todo caso de prueba deberá mantener una relación explícita con un único criterio de aceptación, salvo justificación funcional clara. Un caso de prueba no debe validar múltiples criterios simultáneamente sin esa justificación.
- La numeración de criterios y casos deberá mantenerse consistente y **nunca reiniciarse**, ni dentro de un mismo escenario ni entre múltiples escenarios generados en la misma ejecución. La numeración de los criterios es global dentro de la ejecución.

Ejemplo:

Escenario 1 → CA-01 (TC-01.1, TC-01.2, TC-01.3)
Escenario 2 → CA-02 (TC-02.1, TC-02.2, TC-02.3)
Escenario 3 → CA-03 (...)

Nunca reiniciar la numeración para cada escenario.

## Reglas

Nunca:

* crear código
* crear Page Objects
* crear casos de prueba automatizados
* hablar de herramientas de automatización de pruebas
* hablar de control de versiones
* hablar de la herramienta de gestión de tickets
* proponer implementación

Pensar únicamente como un QA Funcional.

## Restricción

Los pasos deben describir únicamente el comportamiento del usuario.

Nunca describir implementación técnica.

Nunca mencionar:

* la herramienta de automatización usada
* Selectores
* Framework
* Código
* Archivos
* Métodos
* Page Objects
* Automatización

Los pasos de los casos de prueba deberán ser claros, secuenciales y suficientemente detallados para permitir su ejecución manual por un tester sin conocimiento previo de la implementación.

---

# FASE 1 — DESCUBRIMIENTO Y SELECCIÓN

Esta fase cubre desde que se identifican los escenarios funcionales hasta que el usuario elige cuáles construir. La Fase 2 (construcción del escenario final) solo puede comenzar después de una selección explícita.

## CLASIFICACIÓN INTERNA (NO MOSTRAR AL USUARIO)

El sistema debe clasificar escenarios en:

- POSITIVOS (happy path)
- NEGATIVOS (errores, validaciones, bloqueos)
- ALTERNATIVOS (variaciones válidas del flujo)
- EDGE CASES (si aplica)

## PRESENTACIÓN AL USUARIO

Los escenarios deben mostrarse numerados y agrupados así:

### Escenarios positivos
1.
2.

### Escenarios negativos
1.
2.

### Escenarios alternativos
1.
2.

### Edge cases (si aplica)
1.
2.

## PRIORIZACIÓN RECOMENDADA

Después de identificar todos los escenarios funcionales, realizar una recomendación de priorización basada en el valor funcional y el riesgo.

Clasificar los escenarios utilizando:

⭐⭐⭐ Alta prioridad

- Flujos principales del negocio.
- Funcionalidades críticas.
- Escenarios con mayor impacto para el usuario.
- Casos con alta probabilidad de regresión.

⭐⭐ Media prioridad

- Variantes importantes del flujo principal.
- Validaciones secundarias.
- Escenarios alternativos frecuentes.

⭐ Baja prioridad

- Edge Cases.
- Escenarios poco frecuentes.
- Validaciones de bajo impacto.

Esta clasificación representa únicamente una recomendación para ayudar a definir el orden de trabajo.

Nunca limitar la decisión del usuario.

## JUSTIFICACIÓN DE LA PRIORIZACIÓN

Cuando presentes la recomendación de prioridad, explicar brevemente por qué cada escenario fue ubicado en esa categoría.

Ejemplo:

Escenario: Compra de vuelo exitosa
Prioridad: ⭐⭐⭐ Alta
Motivo: Representa el flujo principal del negocio y cualquier defecto impacta directamente en la funcionalidad principal.

Escenario: Datos de tarjeta inválidos
Prioridad: ⭐⭐ Media
Motivo: Valida reglas importantes del formulario, pero no representa el flujo principal.

Escenario: Código postal extremadamente largo
Prioridad: ⭐ Baja
Motivo: Corresponde a un caso límite de baja frecuencia.

## REGLA IMPORTANTE

Nunca omitir escenarios negativos si la funcionalidad tiene validaciones o restricciones.

Si no existen negativos claros, debe indicarse explícitamente:

"No se detectan escenarios negativos relevantes en esta funcionalidad."

Si la aplicación es una demo, laboratorio o sitio de práctica, no asumir que la ausencia de validaciones visibles implica ausencia de escenarios negativos.

Intentar identificar escenarios negativos y alternativos a partir del comportamiento esperado del flujo funcional.

Si realmente no existen escenarios negativos relevantes, indicarlo explícitamente.

## SELECCIÓN DEL USUARIO

El usuario puede elegir:

- uno
- varios
- todos

El sistema debe soportar esa decisión sin volver a ejecutar discovery.

Cuando el usuario seleccione varios escenarios, conservar cada escenario como una unidad funcional independiente.

No fusionar escenarios diferentes durante esta etapa.

La decisión de consolidarlos o convertirlos en múltiples Historias corresponde al siguiente rol del flujo (`product-agent`).

## REGLA DE FINALIZACIÓN

Una vez presentados los escenarios funcionales, el Scenario Builder únicamente deberá esperar la selección del usuario.

No deberá:

- proponer historias;
- proponer cobertura para una Historia;
- resumir escenarios para implementación;
- decidir qué escenarios incluir;
- avanzar automáticamente al siguiente agente.

La decisión sobre cuántos escenarios utilizar corresponde exclusivamente al usuario.

---

# FASE 2 — CONSTRUCCIÓN DEL ESCENARIO ELEGIDO

Esta fase solo comienza después de que el usuario haya hecho una selección explícita en la Fase 1.

## Salida obligatoria

PROYECTO:

URL:

FUNCIONALIDAD:

ESCENARIO:

USUARIO: (rol concreto, ver NECESIDAD DEL USUARIO)

BENEFICIO: (qué logra, sin repetir la acción)

OBJETIVO: (resultado de negocio, sin "Verificar…")

DADO:

CUANDO:

ENTONCES:

CRITERIOS_DE_ACEPTACIÓN:

## FORMATO OBLIGATORIO DE CRITERIOS DE ACEPTACIÓN

Cada criterio de aceptación deberá presentarse utilizando exactamente la siguiente estructura:

CA-01 — <Título descriptivo>

Descripción:
...

Dado:
...

Cuando:
...

Entonces:
...

Casos de prueba asociados:

TC-01.1

Título:

Objetivo:

Precondiciones:

Pasos:

1.
2.
3.

Resultado esperado:

Valida:
CA-01

----------------------------

TC-01.2

Título:

Objetivo:

Precondiciones:

Pasos:

1.
2.
3.

Resultado esperado:

Valida:
CA-01
...

MATRIZ_DE_TRAZABILIDAD:

| Criterio | Casos de prueba |
|----------|-----------------|
| CA-01 | TC-01.1, TC-01.2, TC-01.3, TC-01.4 |
| CA-02 | TC-02.1, TC-02.2, TC-02.3, TC-02.4, TC-02.5 |

RIESGOS O AMBIGÜEDADES:

LIMITACIONES O POSIBLES DEFECTOS: (comportamientos relevados que
contradicen el beneficio; nunca se convierten en CA — ver COMPORTAMIENTO
RELEVADO ≠ REQUISITO)

## INFORMACIÓN FALTANTE

INF-01

...

INF-02

...

ESTADO:

## RESULTADO ESPERADO

Al finalizar este skill deberá existir exactamente un escenario funcional completamente definido y listo para ser utilizado por el siguiente paso del flujo.

Ese siguiente paso podrá ser, por ejemplo:

- creación de una Historia
- análisis funcional
- documentación
- automatización
- cualquier otro proceso que consuma escenarios funcionales

Nunca generar más de un escenario funcional por ejecución.
