---
name: branch-management

description: >
  Manage Git branches before implementation.
  Determine whether an existing branch should be reused or a new one
  should be created following the project's conventions.

when_to_use: >
  Use after implementation-plan and before modifying any project files.

---

# RESPONSABILIDAD

Este skill es responsable de:

- analizar la rama actual
- verificar la relación entre ticket y rama
- determinar si debe reutilizarse una rama existente
- recomendar la creación de una nueva rama cuando sea necesario

Este skill nunca:

- modifica archivos
- implementa código
- ejecuta pruebas
- genera commits
- crea Pull Requests

# ENTRADA ESPERADA

Este skill espera recibir:

- Ticket
- nombre del escenario
- convención de ramas del proyecto
- estado actual del repositorio

Debe determinar la estrategia correcta para trabajar sobre Git.

# Branch Management

## Objetivo

Gestionar la creación y reutilización de ramas para cada ticket.

## PRINCIPIOS

Siempre priorizar:

1. Reutilizar una rama existente asociada al ticket.
2. Crear una nueva rama únicamente cuando no exista.
3. Mantener una única rama por ticket.

Nunca trabajar directamente sobre la rama principal del proyecto.

## CONSERVACIÓN DE CAMBIOS

Si existen cambios sin relación con el ticket actual, priorizar siempre alternativas que preserven el trabajo del usuario.

Por ejemplo:

- utilizar stash;
- solicitar revisión manual;
- crear un commit independiente cuando corresponda.

Nunca sugerir descartar cambios sin una confirmación explícita del usuario.

## REGLAS DE GESTIÓN

- Cada ticket debe desarrollarse en una rama independiente.
- Nunca trabajar directamente sobre `main`.
- Antes de comenzar verificar:
  - Ticket actual.
  - Rama actual.
  - Si ya existe una rama para ese ticket.
- Si la rama existe:
  - reutilizarla.
- Si no existe:
  - crearla utilizando la convención del proyecto.
- Confirmar siempre el nombre de la rama antes de comenzar.

### Estado del Working Directory

Antes de recomendar cualquier estrategia de ramas, verificar si existen cambios sin confirmar (working directory sucio).

Si existen cambios:

- informar qué archivos fueron detectados;
- explicar por qué pueden afectar la nueva rama;
- proponer alternativas para resolver la situación antes de continuar.

Nunca asumir que esos cambios pertenecen al ticket actual.

## Convenciones

Formato recomendado:

feature/TICKET-descripcion

Ejemplos:

feature/SCRUM-15-login

feature/SCRUM-28-cart

## Validaciones

Antes de modificar archivos verificar:

- Ticket
- Rama

Si no corresponden, informar el conflicto en `CONFLICTOS_DETECTADOS` de
la salida obligatoria. Este skill no decide detener el proceso, solo lo
señala — la decisión es de QaAutomation1.

## VALIDACIÓN DE LA RAMA BASE

Antes de recomendar la creación de una nueva rama, verificar si la rama base del proyecto (por ejemplo `main`) se encuentra sincronizada con el repositorio remoto.

Si la rama local está desactualizada respecto de `origin/main`, informar la situación al usuario.

Ejemplo:

"La rama local main se encuentra desactualizada respecto del repositorio remoto. Se recomienda actualizarla antes de crear una nueva rama."

Este skill únicamente informa la situación.

Nunca actualizar la rama automáticamente.

## VALIDACIÓN DE TRAZABILIDAD

Verificar obligatoriamente que exista consistencia entre:

- Ticket
- Nombre de la rama
- Escenario funcional

Si alguno de estos elementos no corresponde al mismo trabajo, informar el
conflicto en `CONFLICTOS_DETECTADOS`. Este skill no decide detener el
flujo, solo lo señala — la decisión es de QaAutomation1.

## VERIFICACIÓN DE RAMAS Y TRABAJO RELACIONADO

Nunca asumir que un ticket parte de cero solo por estar en su estado
inicial ("Tareas por hacer"/"To Do"). Antes de crear una rama nueva,
verificar no solo si existe una rama para el ticket exacto (ver REGLAS
DE GESTIÓN), sino también si existen otras ramas (locales o remotas,
mergeadas o no) o Pull Requests cuyo nombre, historial o alcance
sugieran una funcionalidad solapada dentro del mismo módulo.

Esta es una segunda verificación, independiente de la que ya debería
haber hecho `ticket-analysis` (`TRABAJO_RELACIONADO_DETECTADO`) — no
asumir que ya se hizo solo porque el flujo llegó hasta acá.

Si se detecta una rama, Pull Request o funcionalidad ya integrada que
se solapa con el ticket actual, informarlo en `CONFLICTOS_DETECTADOS`,
indicando si el ticket sigue siendo necesario tal cual está definido o
si su alcance debería ajustarse. Este skill no decide el alcance del
ticket ni detiene el flujo — esa decisión es de QaAutomation1/
ProductAgent.

## VALIDACIÓN DE DEPENDENCIAS

Si la nueva rama depende de trabajo que todavía no fue integrado a la rama base (por ejemplo otra rama pendiente de merge), informar el riesgo antes de continuar.

Ejemplo:

"La nueva rama partirá desde main, pero existe trabajo pendiente en otra rama relacionado con esta funcionalidad. Esto puede requerir sincronización o generar conflictos durante el merge."

Este skill únicamente informa el riesgo.

Nunca modificar la estrategia automáticamente.

## RESTRICCIONES

Nunca:

- cambiar de rama automáticamente
- crear ramas sin validación
- modificar archivos
- realizar commits
- ejecutar push
- crear Pull Requests

Este skill únicamente determina la estrategia de gestión de ramas.

Nunca decidir automáticamente qué alternativa elegir cuando existan múltiples formas válidas de resolver un conflicto.

Siempre presentar las opciones disponibles y esperar la decisión del usuario.

## SALIDA OBLIGATORIA

TICKET:

RAMA_ACTUAL:

RAMA_RECOMENDADA:

ACCIÓN:

- Reutilizar rama existente
- Crear nueva rama

JUSTIFICACIÓN:

ESTADO:

• Gestión de ramas completada
• Listo para implementación

STADO_DEL_REPOSITORIO:

- Limpio
- Working directory con cambios
- Rama desactualizada
- Conflicto detectado

CONFLICTOS_DETECTADOS:

(si existen)

ACCIONES_RECOMENDADAS:

(si corresponde)

Si la estrategia elegida utiliza git stash, informar también:

STASH:

stash@{n}

RECUPERAR:

git stash list

git stash apply stash@{n}

o el comando equivalente según la acción realizada.