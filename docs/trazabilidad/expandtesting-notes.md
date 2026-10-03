# Trazabilidad · Notes App

Generado el 2026-10-03 leyendo Jira/Xray y los specs del repo con:

```
node v3/scripts/check-traceability.js --spec cypress/e2e/expandtesting-notes --report docs/trazabilidad/expandtesting-notes.md
```

Jira/Xray es privado: este archivo es la copia pública de lo publicado allá. Cada Historia muestra sus criterios de aceptación, los Test Cases de cada criterio con sus pasos tal como están en Xray, el `it()` que los automatiza y el último resultado reportado en su Test Cycle.

## Resumen

| Historia | Estado | CA | Test Cases | Automatizados | Último resultado | Bugs vinculados |
|---|---|---|---|---|---|---|
| [SCRUM-621 · Crear una nota](#scrum-621--crear-una-nota) | Finalizada | 5 | 16 | 16 | 16 ✅ | — |
| [SCRUM-635 · Filtrar notas por categoría](#scrum-635--filtrar-notas-por-categoría) | Finalizada | 3 | 9 | 9 | 9 ✅ | — |
| [SCRUM-646 · Buscar notas](#scrum-646--buscar-notas) | Finalizada | 3 | 10 | 10 | 9 ✅ · 1 ⊘ | SCRUM-658 |
| [SCRUM-659 · Marcar notas como completadas o pendientes](#scrum-659--marcar-notas-como-completadas-o-pendientes) | Finalizada | 4 | 10 | 10 | 10 ✅ | — |
| [SCRUM-717 · Editar una nota](#scrum-717--editar-una-nota) | Finalizada | 4 | 13 | 13 | 13 ✅ | — |
| [SCRUM-730 · Borrar una nota](#scrum-730--borrar-una-nota) | Finalizada | 2 | 7 | 7 | 7 ✅ | — |
| [SCRUM-745 · Iniciar sesión](#scrum-745--iniciar-sesión) | Finalizada | 4 | 13 | 13 | 13 ✅ | — |
| [SCRUM-760 · Cerrar sesión](#scrum-760--cerrar-sesión) | Finalizada | 2 | 4 | 4 | 4 ✅ | — |
| [SCRUM-766 · Registrarse](#scrum-766--registrarse) | Finalizada | 6 | 18 | 18 | 18 ✅ | — |
| [SCRUM-786 · Actualizar mi perfil](#scrum-786--actualizar-mi-perfil) | Finalizada | 4 | 16 | 16 | 16 ✅ | — |
| [SCRUM-804 · Cambiar mi contraseña](#scrum-804--cambiar-mi-contraseña) | Finalizada | 6 | 17 | 17 | 17 ✅ | SCRUM-833 |
| [SCRUM-821 · Borrar mi cuenta](#scrum-821--borrar-mi-cuenta) | Finalizada | 5 | 10 | 10 | 10 ✅ | — |
| **Total** | | **48** | **143** | **143** | **142 ✅ · 1 ⊘** | **2** |

✅ pasó en la última ejecución reportada · ⊘ automatizado pero salteado (`it.skip`) por un bug conocido, que figura vinculado a la Historia.

## SCRUM-621 · Crear una nota

**Como** persona que organiza sus tareas en Notes App, **quiero** crear notas con título, descripción y categoría, **para** registrar mis pendientes en un solo lugar y encontrarlos ordenados por tipo de tarea.

**Objetivo:** Que cada nota creada quede guardada con sus datos completos, en la categoría elegida y con el estado indicado, y que no se guarden notas con datos incompletos.

Estado: Finalizada · Spec: [`notes_tc_crear_nota.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js) · Test Cycle: SCRUM-622

### CA-01: Una nota creada con título, descripción y categoría queda guardada en la lista de notas del usuario.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-623 | Crear una nota con título, descripción y categoría | positivo | 3 | [L24](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L24) | ✅ PASSED |
| TC-01.2 · SCRUM-624 | La nota creada sigue guardada al recargar la página | positivo | 4 | [L32](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L32) | ✅ PASSED |
| TC-01.3 · SCRUM-625 | Cancelar el formulario no crea la nota | negativo | 3 | [L44](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L44) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-623 · Crear una nota con título, descripción y categoría**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Category: Personal / Title: Comprar materiales / Description: Pintura, rodillos y cinta de enmascarar | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | El formulario se cierra y la lista muestra una tarjeta con el título "Comprar materiales", la descripción "Pintura, rodillos y cinta de enmascarar" y la fecha de hoy; el resumen dice "You have 0/1 notes completed in the all categories". |

**SCRUM-624 · La nota creada sigue guardada al recargar la página**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Category: Personal / Title: Comprar materiales / Description: Pintura, rodillos y cinta de enmascarar | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | La lista muestra la tarjeta "Comprar materiales". |
| 4 | Recargar la página | - | La lista sigue mostrando la tarjeta con el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |

**SCRUM-625 · Cancelar el formulario no crea la nota**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Category: Personal / Title: Comprar materiales / Description: Pintura, rodillos y cinta de enmascarar | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Cancel" | - | El formulario se cierra y la lista sigue sin notas: "You don't have any notes in all categories". |

</details>

### CA-02: La nota necesita un título de 4 a 100 caracteres.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-626 | No se puede crear una nota sin título ni descripción | negativo | 2 | [L52](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L52) | ✅ PASSED |
| TC-02.2 · SCRUM-627 | No se puede crear una nota con un título de 3 caracteres | negativo | 3 | [L58](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L58) | ✅ PASSED |
| TC-02.3 · SCRUM-628 | No se puede crear una nota con un título de 101 caracteres | negativo | 3 | [L65](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L65) | ✅ PASSED |
| TC-02.5 · SCRUM-630 | Un título de exactamente 4 caracteres se acepta | positivo | 3 | [L73](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L73) | ✅ PASSED |
| TC-02.6 · SCRUM-741 | Un título de exactamente 100 caracteres se acepta | positivo | 3 | [L81](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L81) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-626 · No se puede crear una nota sin título ni descripción**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Hacer clic en "Create" | - | Se muestran "Title is required" y "Description is required". El formulario sigue abierto y la nota no se crea. |

**SCRUM-627 · No se puede crear una nota con un título de 3 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: Pan (3 caracteres) / Description: Pintura, rodillos y cinta de enmascarar | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | Se muestra "Title should be between 4 and 100 characters". El formulario sigue abierto y la nota no se crea. |

**SCRUM-628 · No se puede crear una nota con un título de 101 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: texto de 101 caracteres / Description: Pintura, rodillos y cinta de enmascarar | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | Se muestra "Title should be between 4 and 100 characters". El formulario sigue abierto y la nota no se crea. |

**SCRUM-630 · Un título de exactamente 4 caracteres se acepta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: Plan (4 caracteres) / Description: Pintura, rodillos y cinta de enmascarar | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | El formulario se cierra y la lista muestra una tarjeta con el título "Plan". |

**SCRUM-741 · Un título de exactamente 100 caracteres se acepta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: texto de 100 caracteres / Description: Pintura, rodillos y cinta de enmascarar | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | El formulario se cierra y la lista muestra una tarjeta con el título de 100 caracteres. |

</details>

### CA-03: La nota queda clasificada en la categoría elegida, que es Home si no se elige otra.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-631 | La nota de Work aparece solo en la categoría Work | positivo | 5 | [L89](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L89) | ✅ PASSED |
| TC-03.2 · SCRUM-632 | Sin elegir categoría la nota queda en Home | positivo | 5 | [L104](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L104) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-631 · La nota de Work aparece solo en la categoría Work**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Category: Work / Title: Informe mensual / Description: Enviar el informe de ventas al equipo | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | La lista muestra la tarjeta "Informe mensual". |
| 4 | Hacer clic en la pestaña "Work" | - | Se muestra la tarjeta "Informe mensual" y el resumen "You have 0/1 notes completed in the work category". |
| 5 | Hacer clic en la pestaña "Home" | - | No se muestra ninguna tarjeta: "You don't have any notes in the home category". |

**SCRUM-632 · Sin elegir categoría la nota queda en Home**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: Comprar materiales / Description: Pintura, rodillos y cinta de enmascarar (sin cambiar Category) | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | La lista muestra la tarjeta "Comprar materiales". |
| 4 | Hacer clic en la pestaña "Home" | - | Se muestra la tarjeta "Comprar materiales" y el resumen "You have 0/1 notes completed in the home category". |
| 5 | Hacer clic en la pestaña "Work" | - | No se muestra ninguna tarjeta: "You don't have any notes in the work category". |

</details>

### CA-04: Una nota se puede crear ya marcada como completada.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-04.1 · SCRUM-633 | Crear una nota ya completada | positivo | 4 | [L119](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L119) | ✅ PASSED |
| TC-04.2 · SCRUM-634 | Una nota creada sin marcar Completed queda pendiente | positivo | 3 | [L130](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L130) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-04</summary>

**SCRUM-633 · Crear una nota ya completada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: Informe mensual / Description: Enviar el informe de ventas al equipo | Los campos muestran los datos ingresados. |
| 3 | Marcar la casilla "Completed" | - | La casilla Completed queda marcada. |
| 4 | Hacer clic en "Create" | - | La tarjeta "Informe mensual" muestra su interruptor de completada encendido y el resumen dice "You have completed all notes". |

**SCRUM-634 · Una nota creada sin marcar Completed queda pendiente**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: Informe mensual / Description: Enviar el informe de ventas al equipo | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | La tarjeta "Informe mensual" muestra su interruptor de completada apagado y el resumen dice "You have 0/1 notes completed in the all categories". |

</details>

### CA-05: La nota necesita una descripción de 4 a 1000 caracteres.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-05.1 · SCRUM-629 | No se puede crear una nota con una descripción de 3 caracteres | negativo | 3 | [L140](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L140) | ✅ PASSED |
| TC-05.2 · SCRUM-742 | No se puede crear una nota con una descripción de 1001 caracteres | negativo | 3 | [L147](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L147) | ✅ PASSED |
| TC-05.3 · SCRUM-743 | Una descripción de exactamente 4 caracteres se acepta | positivo | 3 | [L154](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L154) | ✅ PASSED |
| TC-05.4 · SCRUM-744 | Una descripción de exactamente 1000 caracteres se acepta | positivo | 3 | [L163](../../cypress/e2e/expandtesting-notes/notes_tc_crear_nota.cy.js#L163) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-05</summary>

**SCRUM-629 · No se puede crear una nota con una descripción de 3 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: Comprar materiales / Description: Sal (3 caracteres) | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | Se muestra "Description should be between 4 and 1000 characters". El formulario sigue abierto y la nota no se crea. |

**SCRUM-742 · No se puede crear una nota con una descripción de 1001 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: Comprar materiales / Description: texto de 1001 caracteres | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | Se muestra "Description should be between 4 and 1000 characters". El formulario sigue abierto y la nota no se crea. |

**SCRUM-743 · Una descripción de exactamente 4 caracteres se acepta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: Comprar materiales / Description: Pan! (4 caracteres) | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | El formulario se cierra y la lista muestra una tarjeta con el título "Comprar materiales" y la descripción "Pan!". |

**SCRUM-744 · Una descripción de exactamente 1000 caracteres se acepta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "+ Add Note" | - | Se abre "Add new note" con Category en Home, la casilla Completed sin marcar, Title y Description vacíos y los botones Create y Cancel. |
| 2 | Completar el formulario | Title: Comprar materiales / Description: texto de 1000 caracteres | Los campos muestran los datos ingresados. |
| 3 | Hacer clic en "Create" | - | El formulario se cierra y la lista muestra una tarjeta con el título "Comprar materiales" y la descripción de 1000 caracteres. |

</details>

**Criterios sin caso negativo (justificados):**

- CA-03: El formulario solo ofrece las categorías válidas (Home, Work y Personal), así que no hay una categoría inválida que se pueda elegir desde la pantalla.
- CA-04: Marcar o no la casilla Completed son dos estados válidos: no hay un dato inválido que rechazar.

**Fuera de alcance:**

- Editar, completar desde la tarjeta, buscar, filtrar y borrar notas (Historias propias).

## SCRUM-635 · Filtrar notas por categoría

**Como** persona que organiza sus tareas en Notes App, **quiero** ver solo las notas de una categoría (Home, Work o Personal), **para** concentrarme en los pendientes de un área de mi vida sin mezclarlos con los demás.

**Objetivo:** Que al elegir una categoría el usuario vea únicamente las notas de esa categoría y el avance de sus tareas en ella, y que la elección se mantenga al volver a la página.

Estado: Finalizada · Spec: [`notes_tc_filtrar_categoria.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js) · Test Cycle: SCRUM-636

### CA-01: La lista muestra solo las notas de la categoría elegida, y la pestaña All muestra todas.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-637 | La pestaña Work muestra solo las notas de Work | positivo | 2 | [L30](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js#L30) | ✅ PASSED |
| TC-01.2 · SCRUM-638 | La pestaña Home no muestra las notas de otras categorías | negativo | 2 | [L39](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js#L39) | ✅ PASSED |
| TC-01.3 · SCRUM-645 | Volver a All muestra todas las notas | positivo | 3 | [L47](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js#L47) | ✅ PASSED |
| TC-01.4 · SCRUM-639 | Una categoría sin notas no muestra tarjetas | negativo | 2 | [L59](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js#L59) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-637 · La pestaña Work muestra solo las notas de Work**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Ingresar a la pantalla My Notes | - | Se muestra la pestaña "All" seleccionada con las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual" y el resumen "You have 1/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Work" | - | La pestaña "Work" queda resaltada con su color. La lista muestra solo las tarjetas "Reunion de equipo" e "Informe mensual". |

**SCRUM-638 · La pestaña Home no muestra las notas de otras categorías**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Ingresar a la pantalla My Notes | - | Se muestra la pestaña "All" seleccionada con las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual" y el resumen "You have 1/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Home" | - | La pestaña "Home" queda resaltada con su color. La lista muestra solo la tarjeta "Pagar la luz"; no aparecen "Reunion de equipo" ni "Informe mensual". |

**SCRUM-645 · Volver a All muestra todas las notas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Ingresar a la pantalla My Notes | - | Se muestra la pestaña "All" seleccionada con las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual" y el resumen "You have 1/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Work" | - | La pestaña "Work" queda resaltada con su color. La lista muestra solo las tarjetas "Reunion de equipo" e "Informe mensual". |
| 3 | Hacer clic en la pestaña "All" | - | La pestaña "All" queda resaltada con su color. La lista vuelve a mostrar las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual". |

**SCRUM-639 · Una categoría sin notas no muestra tarjetas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Ingresar a la pantalla My Notes | - | Se muestra la pestaña "All" seleccionada con las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual" y el resumen "You have 1/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Personal" | - | La pestaña "Personal" queda resaltada con su color. No se muestra ninguna tarjeta ni el resumen, solo el aviso "You don't have any notes in the personal category". |

</details>

### CA-02: El resumen de notas completadas cuenta solo las notas de la categoría elegida.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-640 | El resumen de Work cuenta sus notas completadas | positivo | 2 | [L68](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js#L68) | ✅ PASSED |
| TC-02.2 · SCRUM-641 | El resumen avisa cuando todas las notas de la categoría están completadas | positivo | 2 | [L76](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js#L76) | ✅ PASSED |
| TC-02.3 · SCRUM-642 | Las notas completadas de otra categoría no cuentan en el resumen | negativo | 2 | [L87](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js#L87) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-640 · El resumen de Work cuenta sus notas completadas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Ingresar a la pantalla My Notes | - | Se muestra la pestaña "All" seleccionada con las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual" y el resumen "You have 1/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Work" | - | La pestaña "Work" queda resaltada con su color. El resumen dice "You have 1/2 notes completed in the work category". |

**SCRUM-641 · El resumen avisa cuando todas las notas de la categoría están completadas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Ingresar a la pantalla My Notes | - | Se muestra la pestaña "All" seleccionada con las tarjetas "Reunion de equipo" y "Pagar la luz" y el resumen "You have 1/2 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Home" | - | La pestaña "Home" queda resaltada con su color. La lista muestra la tarjeta "Pagar la luz" y el resumen dice "You have completed all notes in the home category". |

**SCRUM-642 · Las notas completadas de otra categoría no cuentan en el resumen**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Ingresar a la pantalla My Notes | - | Se muestra la pestaña "All" seleccionada con las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual" y el resumen "You have 1/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Home" | - | La pestaña "Home" queda resaltada con su color. El resumen dice "You have 0/1 notes completed in the home category". |

</details>

### CA-03: La categoría elegida se conserva al recargar la página.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-643 | La categoría elegida sigue activa al recargar la página | positivo | 3 | [L95](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js#L95) | ✅ PASSED |
| TC-03.2 · SCRUM-644 | Después de recargar, All vuelve a mostrar todas las notas | positivo | 4 | [L108](../../cypress/e2e/expandtesting-notes/notes_tc_filtrar_categoria.cy.js#L108) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-643 · La categoría elegida sigue activa al recargar la página**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Ingresar a la pantalla My Notes | - | Se muestra la pestaña "All" seleccionada con las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual" y el resumen "You have 1/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Work" | - | La pestaña "Work" queda resaltada con su color. La lista muestra solo las tarjetas "Reunion de equipo" e "Informe mensual". |
| 3 | Recargar la página | - | La pestaña "Work" sigue resaltada, la lista muestra solo las tarjetas "Reunion de equipo" e "Informe mensual" y el resumen dice "You have 1/2 notes completed in the work category". |

**SCRUM-644 · Después de recargar, All vuelve a mostrar todas las notas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Ingresar a la pantalla My Notes | - | Se muestra la pestaña "All" seleccionada con las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual" y el resumen "You have 1/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Work" | - | La pestaña "Work" queda resaltada con su color. La lista muestra solo las tarjetas "Reunion de equipo" e "Informe mensual". |
| 3 | Recargar la página | - | La lista sigue filtrada por Work. |
| 4 | Hacer clic en la pestaña "All" | - | La pestaña "All" queda resaltada con su color. La lista muestra las tarjetas "Reunion de equipo", "Pagar la luz" e "Informe mensual" y el resumen dice "You have 1/3 notes completed in the all categories". |

</details>

**Criterios sin caso negativo (justificados):**

- CA-03: Elegir una pestaña es elegir entre opciones válidas: no hay un dato inválido que rechazar, y el caso de volver a mostrar todas se cubre con la pestaña All.

**Fuera de alcance:**

- El orden de la lista (pendientes primero y completadas al final): regla de la lista, cubierta en la Historia SCRUM-659.
- Combinar el filtro con la búsqueda de notas (Historia propia).

## SCRUM-646 · Buscar notas

**Como** persona que organiza sus tareas en Notes App, **quiero** buscar mis notas por una palabra de su título o de su descripción, **para** encontrar rápido un pendiente sin recorrer toda la lista.

**Objetivo:** Que la persona encuentre las notas que necesita escribiendo una parte de su título o descripción, también dentro de una categoría, y pueda volver a ver todas sus notas.

Estado: Finalizada · Spec: [`notes_tc_buscar_notas.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js) · Test Cycle: SCRUM-647

### CA-01: Al confirmar la búsqueda se muestran solo las notas cuyo título o descripción contienen el texto buscado, sin distinguir mayúsculas de minúsculas.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-648 | Buscar una nota por su título | positivo | 3 | [L30](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L30) | ✅ PASSED |
| TC-01.2 · SCRUM-649 | Buscar por una palabra de la descripción escrita en mayúsculas | positivo | 3 | [L41](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L41) | ✅ PASSED |
| TC-01.3 · SCRUM-650 | Una búsqueda sin coincidencias no muestra notas | negativo | 3 | [L51](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L51) | ✅ PASSED |
| TC-01.4 · SCRUM-651 | Escribir sin confirmar la búsqueda no filtra la lista | negativo | 2 | [L59](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L59) | ✅ PASSED |
| TC-01.5 · SCRUM-652 | Buscar un texto que contiene el carácter & | positivo | 3 | [L68](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L68) | ⊘ salteado (bug conocido SCRUM-658) |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-648 · Buscar una nota por su título**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas en la pestaña "All", el campo "Search notes..." vacío y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Escribir en el campo "Search notes..." | reunion | El campo muestra el texto escrito. |
| 3 | Hacer clic en "Search" | - | Se muestra "Search Results for "reunion":", una sola tarjeta "Reunion de equipo" y el resumen "You have 0/1 notes completed in the all categories". |

**SCRUM-649 · Buscar por una palabra de la descripción escrita en mayúsculas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas en la pestaña "All", el campo "Search notes..." vacío y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Escribir en el campo "Search notes..." | PINTURA | El campo muestra el texto escrito. |
| 3 | Presionar Enter | - | Se muestra "Search Results for "PINTURA":" con las tarjetas "Reunion de equipo" y "Comprar materiales" (sin "Turno medico") y el resumen "You have 0/2 notes completed in the all categories". |

**SCRUM-650 · Una búsqueda sin coincidencias no muestra notas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas en la pestaña "All", el campo "Search notes..." vacío y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Escribir en el campo "Search notes..." | zzzz | El campo muestra el texto escrito. |
| 3 | Hacer clic en "Search" | - | No se muestra ninguna tarjeta y aparece "Couldn't find any notes in all categories". |

**SCRUM-651 · Escribir sin confirmar la búsqueda no filtra la lista**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas en la pestaña "All", el campo "Search notes..." vacío y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Escribir en el campo "Search notes..." sin hacer clic en "Search" ni presionar Enter | zzzz | La lista sigue mostrando las tres notas y el resumen "You have 0/3 notes completed in the all categories". |

**SCRUM-652 · Buscar un texto que contiene el carácter &**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las notas "Pan dulce" y "Pan & queso" y el resumen "You have 0/2 notes completed in the all categories". |
| 2 | Escribir en el campo "Search notes..." | Pan & queso | El campo muestra el texto escrito. |
| 3 | Hacer clic en "Search" | - | Se muestra una sola tarjeta, "Pan & queso", y el resumen "You have 0/1 notes completed in the all categories". |

</details>

### CA-02: La búsqueda muestra solo las coincidencias de la categoría elegida.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-653 | Buscar dentro de la categoría Work | positivo | 4 | [L80](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L80) | ✅ PASSED |
| TC-02.2 · SCRUM-654 | Buscar en una categoría sin coincidencias | negativo | 4 | [L94](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L94) | ✅ PASSED |
| TC-02.3 · SCRUM-655 | Cambiar de categoría después de buscar sigue filtrando los resultados | positivo | 4 | [L106](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L106) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-653 · Buscar dentro de la categoría Work**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas en la pestaña "All", el campo "Search notes..." vacío y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Work" | - | Se muestra solo la tarjeta "Reunion de equipo". |
| 3 | Escribir en el campo "Search notes..." | pintura | El campo muestra el texto escrito. |
| 4 | Hacer clic en "Search" | - | Se muestra "Search Results for "pintura":", solo la tarjeta "Reunion de equipo" (no "Comprar materiales", que es de Home) y el resumen "You have 0/1 notes completed in the work category". |

**SCRUM-654 · Buscar en una categoría sin coincidencias**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas en la pestaña "All", el campo "Search notes..." vacío y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Personal" | - | Se muestra solo la tarjeta "Turno medico". |
| 3 | Escribir en el campo "Search notes..." | pintura | El campo muestra el texto escrito. |
| 4 | Hacer clic en "Search" | - | No se muestra ninguna tarjeta y aparece "Couldn't find any notes in the personal category". |

**SCRUM-655 · Cambiar de categoría después de buscar sigue filtrando los resultados**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas en la pestaña "All", el campo "Search notes..." vacío y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Escribir en el campo "Search notes..." | pintura | El campo muestra el texto escrito. |
| 3 | Hacer clic en "Search" | - | Se muestran las tarjetas "Reunion de equipo" y "Comprar materiales". |
| 4 | Hacer clic en la pestaña "Home" | - | Sigue el encabezado "Search Results for "pintura":" y se muestra solo la tarjeta "Comprar materiales" con el resumen "You have 0/1 notes completed in the home category". |

</details>

### CA-03: Confirmar la búsqueda con el campo vacío vuelve a mostrar todas las notas.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-656 | Buscar con el campo vacío vuelve a mostrar todas las notas | positivo | 5 | [L120](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L120) | ✅ PASSED |
| TC-03.2 · SCRUM-657 | Volver a todas las notas desde una búsqueda sin resultados | positivo | 5 | [L134](../../cypress/e2e/expandtesting-notes/notes_tc_buscar_notas.cy.js#L134) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-656 · Buscar con el campo vacío vuelve a mostrar todas las notas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas en la pestaña "All", el campo "Search notes..." vacío y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Escribir en el campo "Search notes..." | reunion | El campo muestra el texto escrito. |
| 3 | Hacer clic en "Search" | - | Se muestra solo la tarjeta "Reunion de equipo". |
| 4 | Borrar el texto del campo "Search notes..." | - | El campo queda vacío. |
| 5 | Hacer clic en "Search" | - | Desaparece el encabezado "Search Results for" y se muestran las tres notas con el resumen "You have 0/3 notes completed in the all categories". |

**SCRUM-657 · Volver a todas las notas desde una búsqueda sin resultados**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas en la pestaña "All", el campo "Search notes..." vacío y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Escribir en el campo "Search notes..." | zzzz | El campo muestra el texto escrito. |
| 3 | Hacer clic en "Search" | - | No se muestra ninguna tarjeta y aparece "Couldn't find any notes in all categories". |
| 4 | Borrar el texto del campo "Search notes..." | - | El campo queda vacío. |
| 5 | Presionar Enter | - | Desaparece el encabezado "Search Results for" y se muestran las tres notas con el resumen "You have 0/3 notes completed in the all categories". |

</details>

**Bugs vinculados:**

- SCRUM-658 · Notes App: la búsqueda de un texto con & muestra notas que no lo contienen (Tareas por hacer)

**Criterios sin caso negativo (justificados):**

- CA-03: Buscar con el campo vacío es la forma de volver a la lista completa: no hay un dato inválido que rechazar.

**Fuera de alcance:**

- Conservar los resultados de la búsqueda al recargar la página (no priorizado en este lote).

## SCRUM-659 · Marcar notas como completadas o pendientes

**Como** persona que organiza sus tareas en Notes App, **quiero** marcar mis notas como completadas o volverlas a pendientes desde su tarjeta, **para** saber de un vistazo qué me falta hacer y cuánto avancé.

**Objetivo:** Que la persona lleve el avance de sus tareas cambiando el estado de cada nota con un clic, con el resumen y el orden de la lista siempre al día.

Estado: Finalizada · Spec: [`notes_tc_completar_nota.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js) · Test Cycle: SCRUM-660

### CA-01: Una nota pendiente se marca como completada desde su tarjeta y queda guardada así.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-661 | Marcar una nota pendiente como completada | positivo | 2 | [L39](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L39) | ✅ PASSED |
| TC-01.2 · SCRUM-662 | La nota completada sigue completada al recargar la página | positivo | 3 | [L49](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L49) | ✅ PASSED |
| TC-01.3 · SCRUM-663 | Completar una nota no cambia el estado de las demás | negativo | 2 | [L61](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L61) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-661 · Marcar una nota pendiente como completada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestra la tarjeta "Pagar la luz" con el interruptor de completada apagado y el resumen "You have 0/1 notes completed in the all categories". |
| 2 | Hacer clic en el interruptor de completada de la tarjeta "Pagar la luz" | - | El interruptor de la tarjeta queda encendido y el resumen dice "You have completed all notes". |

**SCRUM-662 · La nota completada sigue completada al recargar la página**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestra la tarjeta "Pagar la luz" con el interruptor de completada apagado. |
| 2 | Hacer clic en el interruptor de completada de la tarjeta "Pagar la luz" | - | El interruptor de la tarjeta queda encendido. |
| 3 | Recargar la página | - | La tarjeta "Pagar la luz" sigue con el interruptor encendido y el resumen dice "You have completed all notes". |

**SCRUM-663 · Completar una nota no cambia el estado de las demás**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tarjetas "Turno medico", "Informe mensual" y "Pagar la luz", en ese orden, con el interruptor de completada apagado y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Hacer clic en el interruptor de completada de la tarjeta "Turno medico" | - | Solo la tarjeta "Turno medico" queda con el interruptor encendido; "Informe mensual" y "Pagar la luz" siguen con el interruptor apagado. |

</details>

### CA-02: Una nota completada vuelve a pendiente desde su tarjeta y queda guardada así.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-664 | Volver una nota completada a pendiente | positivo | 2 | [L70](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L70) | ✅ PASSED |
| TC-02.2 · SCRUM-665 | La nota vuelta a pendiente sigue pendiente al recargar la página | positivo | 3 | [L80](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L80) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-664 · Volver una nota completada a pendiente**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestra la tarjeta "Pagar la luz" con el interruptor de completada encendido y el resumen "You have completed all notes". |
| 2 | Hacer clic en el interruptor de completada de la tarjeta "Pagar la luz" | - | El interruptor de la tarjeta queda apagado y el resumen dice "You have 0/1 notes completed in the all categories". |

**SCRUM-665 · La nota vuelta a pendiente sigue pendiente al recargar la página**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestra la tarjeta "Pagar la luz" con el interruptor de completada encendido. |
| 2 | Hacer clic en el interruptor de completada de la tarjeta "Pagar la luz" | - | El interruptor de la tarjeta queda apagado. |
| 3 | Recargar la página | - | La tarjeta "Pagar la luz" sigue con el interruptor apagado y el resumen dice "You have 0/1 notes completed in the all categories". |

</details>

### CA-03: El resumen de notas completadas se actualiza al cambiar el estado de una nota en la categoría elegida.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-666 | El resumen de todas las categorías cuenta la nota completada | positivo | 2 | [L92](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L92) | ✅ PASSED |
| TC-03.2 · SCRUM-667 | El resumen de la categoría Work cuenta la nota completada | positivo | 3 | [L99](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L99) | ✅ PASSED |
| TC-03.3 · SCRUM-668 | Al completar la última nota pendiente el resumen avisa que están todas completadas | positivo | 2 | [L111](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L111) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-666 · El resumen de todas las categorías cuenta la nota completada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tarjetas "Turno medico", "Informe mensual" y "Pagar la luz", en ese orden, con el interruptor de completada apagado y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Hacer clic en el interruptor de completada de la tarjeta "Turno medico" | - | El resumen pasa a "You have 1/3 notes completed in the all categories". |

**SCRUM-667 · El resumen de la categoría Work cuenta la nota completada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tres notas y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Hacer clic en la pestaña "Work" | - | Se muestran las tarjetas "Reunion de equipo" e "Informe mensual" y el resumen "You have 0/2 notes completed in the work category". |
| 3 | Hacer clic en el interruptor de completada de la tarjeta "Reunion de equipo" | - | El resumen pasa a "You have 1/2 notes completed in the work category". |

**SCRUM-668 · Al completar la última nota pendiente el resumen avisa que están todas completadas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las dos notas y el resumen "You have 1/2 notes completed in the all categories". |
| 2 | Hacer clic en el interruptor de completada de la tarjeta "Informe mensual" | - | El resumen pasa a "You have completed all notes". |

</details>

### CA-04: La lista muestra primero las notas pendientes y al final las completadas.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-04.1 · SCRUM-669 | La nota completada pasa al final de la lista | positivo | 2 | [L119](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L119) | ✅ PASSED |
| TC-04.2 · SCRUM-670 | La nota vuelta a pendiente pasa al principio de la lista | positivo | 2 | [L126](../../cypress/e2e/expandtesting-notes/notes_tc_completar_nota.cy.js#L126) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-04</summary>

**SCRUM-669 · La nota completada pasa al final de la lista**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | Se muestran las tarjetas "Turno medico", "Informe mensual" y "Pagar la luz", en ese orden, con el interruptor de completada apagado y el resumen "You have 0/3 notes completed in the all categories". |
| 2 | Hacer clic en el interruptor de completada de la tarjeta "Turno medico" | - | La lista queda en el orden "Informe mensual", "Pagar la luz" y "Turno medico". |

**SCRUM-670 · La nota vuelta a pendiente pasa al principio de la lista**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla "My Notes" | - | La lista muestra "Turno medico", "Informe mensual" y "Pagar la luz", en ese orden, con el resumen "You have 1/3 notes completed in the all categories". |
| 2 | Hacer clic en el interruptor de completada de la tarjeta "Pagar la luz" | - | La lista queda en el orden "Pagar la luz", "Turno medico" e "Informe mensual". |

</details>

**Criterios sin caso negativo (justificados):**

- CA-02: El interruptor solo alterna entre dos estados válidos: no hay un dato que la aplicación pueda rechazar al volver una nota a pendiente.
- CA-03: El resumen solo refleja el estado de las notas: no hay una acción inválida que lo deba dejar sin cambiar.
- CA-04: El orden depende solo del estado de las notas: no hay una acción inválida que se pueda rechazar.

**Fuera de alcance:**

- Marcar como completada desde el formulario de edición (Historia "Editar una nota").

## SCRUM-717 · Editar una nota

**Como** persona que organiza sus tareas en Notes App, **quiero** editar el título, la descripción, la categoría y el estado de una nota ya creada, **para** mantener mis pendientes al día cuando cambian, sin tener que crearlos de nuevo.

**Objetivo:** Que la persona corrija o actualice una nota existente y vea los cambios guardados en su lista, sin que se guarden notas con datos incompletos.

Estado: Finalizada · Spec: [`notes_tc_editar_nota.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js) · Test Cycle: SCRUM-718

### CA-01: El formulario de edición se abre con la categoría, el estado, el título y la descripción actuales de la nota.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-719 | El formulario de edición muestra los datos actuales de una nota de Work | positivo | 2 | [L34](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L34) | ✅ PASSED |
| TC-01.2 · SCRUM-720 | El formulario de edición muestra marcada la casilla Completed de una nota completada | positivo | 2 | [L39](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L39) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-719 · El formulario de edición muestra los datos actuales de una nota de Work**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Informe mensual" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Work, la casilla Completed sin marcar, el título "Informe mensual" y la descripción "Enviar el informe de ventas al equipo". |

**SCRUM-720 · El formulario de edición muestra marcada la casilla Completed de una nota completada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con el interruptor de completada encendido. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed marcada, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |

</details>

### CA-02: Al guardar la edición, la nota queda con los datos editados y los conserva al volver a abrir la lista.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-721 | Guardar un título y una descripción nuevos actualiza la tarjeta de la nota | positivo | 5 | [L45](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L45) | ✅ PASSED |
| TC-02.2 · SCRUM-722 | El título editado se conserva al recargar la página | positivo | 5 | [L58](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L58) | ✅ PASSED |
| TC-02.3 · SCRUM-723 | Cambiar la categoría de la nota la mueve a la pestaña de la nueva categoría | positivo | 6 | [L70](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L70) | ✅ PASSED |
| TC-02.4 · SCRUM-724 | Marcar la casilla Completed al editar deja la nota completada | positivo | 4 | [L85](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L85) | ✅ PASSED |
| TC-02.5 · SCRUM-725 | Cancelar la edición no modifica la nota | negativo | 4 | [L98](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L98) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-721 · Guardar un título y una descripción nuevos actualiza la tarjeta de la nota**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Reemplazar el título de la nota | Comprar pintura blanca | El campo Title muestra el texto ingresado. |
| 4 | Reemplazar la descripción de la nota | Dos latas de 4 litros | El campo Description muestra el texto ingresado. |
| 5 | Hacer clic en "Save" | - | El formulario se cierra y la tarjeta muestra el título "Comprar pintura blanca", la descripción "Dos latas de 4 litros" y como fecha de actualización la del momento del cambio. |

**SCRUM-722 · El título editado se conserva al recargar la página**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Reemplazar el título de la nota | Comprar pintura blanca | El campo Title muestra el texto ingresado. |
| 4 | Hacer clic en "Save" | - | El formulario se cierra y la tarjeta muestra el título "Comprar pintura blanca". |
| 5 | Recargar la página | - | La lista vuelve a cargar y la tarjeta sigue mostrando el título "Comprar pintura blanca" con la descripción "Pintura, rodillos y cinta de enmascarar". |

**SCRUM-723 · Cambiar la categoría de la nota la mueve a la pestaña de la nueva categoría**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Elegir otra categoría en la lista "Category" | Work | La lista "Category" muestra Work. |
| 4 | Hacer clic en "Save" | - | El formulario se cierra y la tarjeta de la nota "Comprar materiales" sigue en la lista. |
| 5 | Hacer clic en la pestaña "Work" | - | Se ve la nota "Comprar materiales" y el resumen dice "You have 0/1 notes completed in the work category". |
| 6 | Hacer clic en la pestaña "Home" | - | No se ve ninguna nota y se muestra "You don't have any notes in the home category". |

**SCRUM-724 · Marcar la casilla Completed al editar deja la nota completada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con el interruptor de completada apagado y el resumen dice "You have 0/1 notes completed in the all categories". |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Marcar la casilla "Completed" | - | La casilla Completed queda marcada. |
| 4 | Hacer clic en "Save" | - | El formulario se cierra, la tarjeta de la nota "Comprar materiales" muestra el interruptor de completada encendido y el resumen dice "You have completed all notes". |

**SCRUM-725 · Cancelar la edición no modifica la nota**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Reemplazar el título de la nota | Titulo descartado | El campo Title muestra el texto ingresado. |
| 4 | Hacer clic en "Cancel" | - | El formulario se cierra y la tarjeta conserva el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |

</details>

### CA-03: Al editar una nota, el título es obligatorio y debe tener de 4 a 100 caracteres.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-726 | No se puede guardar la nota con el título vacío | negativo | 4 | [L108](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L108) | ✅ PASSED |
| TC-03.2 · SCRUM-727 | No se puede guardar la nota con un título de menos de 4 caracteres | negativo | 4 | [L118](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L118) | ✅ PASSED |
| TC-03.3 · SCRUM-739 | No se puede guardar la nota con un título de más de 100 caracteres | negativo | 4 | [L128](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L128) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-726 · No se puede guardar la nota con el título vacío**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Borrar el título de la nota | - | El campo Title queda vacío. |
| 4 | Hacer clic en "Save" | - | Se muestra "Title is required" bajo el título. El formulario sigue abierto y la tarjeta conserva el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |

**SCRUM-727 · No se puede guardar la nota con un título de menos de 4 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Reemplazar el título de la nota | Pan | El campo Title muestra el texto ingresado. |
| 4 | Hacer clic en "Save" | - | Se muestra "Title should be between 4 and 100 characters" bajo el título. El formulario sigue abierto y la tarjeta conserva el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |

**SCRUM-739 · No se puede guardar la nota con un título de más de 100 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Reemplazar el título de la nota | Un título de 101 caracteres | El campo Title muestra el texto ingresado. |
| 4 | Hacer clic en "Save" | - | Se muestra "Title should be between 4 and 100 characters" bajo el título. El formulario sigue abierto y la tarjeta conserva el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |

</details>

### CA-04: Al editar una nota, la descripción es obligatoria y debe tener de 4 a 1000 caracteres.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-04.1 · SCRUM-728 | No se puede guardar la nota con la descripción vacía | negativo | 4 | [L138](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L138) | ✅ PASSED |
| TC-04.2 · SCRUM-729 | No se puede guardar la nota con una descripción de menos de 4 caracteres | negativo | 4 | [L148](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L148) | ✅ PASSED |
| TC-04.3 · SCRUM-740 | No se puede guardar la nota con una descripción de más de 1000 caracteres | negativo | 4 | [L158](../../cypress/e2e/expandtesting-notes/notes_tc_editar_nota.cy.js#L158) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-04</summary>

**SCRUM-728 · No se puede guardar la nota con la descripción vacía**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Borrar la descripción de la nota | - | El campo Description queda vacío. |
| 4 | Hacer clic en "Save" | - | Se muestra "Description is required" bajo la descripción. El formulario sigue abierto y la tarjeta conserva el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |

**SCRUM-729 · No se puede guardar la nota con una descripción de menos de 4 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Reemplazar la descripción de la nota | Ok | El campo Description muestra el texto ingresado. |
| 4 | Hacer clic en "Save" | - | Se muestra "Description should be between 4 and 1000 characters" bajo la descripción. El formulario sigue abierto y la tarjeta conserva el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |

**SCRUM-740 · No se puede guardar la nota con una descripción de más de 1000 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" con su descripción y la fecha de la última actualización. |
| 2 | Hacer clic en "Edit" en la tarjeta de la nota | - | Se abre el formulario "Edit note" con la categoría Home, la casilla Completed sin marcar, el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |
| 3 | Reemplazar la descripción de la nota | Una descripción de 1001 caracteres | El campo Description muestra el texto ingresado. |
| 4 | Hacer clic en "Save" | - | Se muestra "Description should be between 4 and 1000 characters" bajo la descripción. El formulario sigue abierto y la tarjeta conserva el título "Comprar materiales" y la descripción "Pintura, rodillos y cinta de enmascarar". |

</details>

**Criterios sin caso negativo (justificados):**

- CA-01: El formulario solo muestra los datos que la nota ya tiene: no hay una acción inválida que la aplicación pueda rechazar al abrirlo.

**Fuera de alcance:**

- Editar la nota desde su vista de detalle ("View"), que abre el mismo formulario.
- Borrar una nota (Historia propia).

## SCRUM-730 · Borrar una nota

**Como** persona que organiza sus tareas en Notes App, **quiero** borrar las notas que ya no necesito, confirmando antes de eliminarlas, **para** mantener mi lista limpia sin perder por error una nota que todavía me sirve.

**Objetivo:** Que la persona elimine solo la nota que eligió, después de confirmarlo, y que la nota eliminada no vuelva a aparecer.

Estado: Finalizada · Spec: [`notes_tc_borrar_nota.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_nota.cy.js) · Test Cycle: SCRUM-731

### CA-01: Antes de borrar una nota, la aplicación pide confirmación mostrando su título.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-732 | Borrar una nota pide confirmación mostrando su título | positivo | 2 | [L33](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_nota.cy.js#L33) | ✅ PASSED |
| TC-01.2 · SCRUM-733 | Cancelar el borrado no elimina la nota | negativo | 3 | [L38](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_nota.cy.js#L38) | ✅ PASSED |
| TC-01.3 · SCRUM-734 | Cerrar el diálogo de confirmación no elimina la nota | negativo | 3 | [L46](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_nota.cy.js#L46) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-732 · Borrar una nota pide confirmación mostrando su título**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" y el resumen dice "You have 0/1 notes completed in the all categories". |
| 2 | Hacer clic en "Delete" en la tarjeta de la nota | - | Se abre el diálogo "Delete note?" con el título "Comprar materiales" y los botones "Delete" y "Cancel". |

**SCRUM-733 · Cancelar el borrado no elimina la nota**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" y el resumen dice "You have 0/1 notes completed in the all categories". |
| 2 | Hacer clic en "Delete" en la tarjeta de la nota | - | Se abre el diálogo "Delete note?" con el título "Comprar materiales" y los botones "Delete" y "Cancel". |
| 3 | Hacer clic en "Cancel" en el diálogo | - | El diálogo se cierra, la tarjeta de la nota "Comprar materiales" sigue en la lista y el resumen dice "You have 0/1 notes completed in the all categories". |

**SCRUM-734 · Cerrar el diálogo de confirmación no elimina la nota**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" y el resumen dice "You have 0/1 notes completed in the all categories". |
| 2 | Hacer clic en "Delete" en la tarjeta de la nota | - | Se abre el diálogo "Delete note?" con el título "Comprar materiales" y los botones "Delete" y "Cancel". |
| 3 | Hacer clic en la X del diálogo | - | El diálogo se cierra, la tarjeta de la nota "Comprar materiales" sigue en la lista y el resumen dice "You have 0/1 notes completed in the all categories". |

</details>

### CA-02: Al confirmar el borrado, se elimina solo esa nota y no vuelve a aparecer al recargar la lista.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-735 | Confirmar el borrado de la única nota deja la lista vacía | positivo | 3 | [L54](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_nota.cy.js#L54) | ✅ PASSED |
| TC-02.2 · SCRUM-736 | Borrar una de dos notas elimina solo la elegida | positivo | 3 | [L61](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_nota.cy.js#L61) | ✅ PASSED |
| TC-02.3 · SCRUM-737 | La nota borrada no vuelve a aparecer al recargar la página | positivo | 4 | [L70](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_nota.cy.js#L70) | ✅ PASSED |
| TC-02.4 · SCRUM-738 | Borrar la nota desde su vista de detalle vuelve a My Notes sin la nota | positivo | 4 | [L79](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_nota.cy.js#L79) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-735 · Confirmar el borrado de la única nota deja la lista vacía**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" y el resumen dice "You have 0/1 notes completed in the all categories". |
| 2 | Hacer clic en "Delete" en la tarjeta de la nota | - | Se abre el diálogo "Delete note?" con el título "Comprar materiales" y los botones "Delete" y "Cancel". |
| 3 | Hacer clic en "Delete" en el diálogo | - | El diálogo se cierra, la tarjeta de la nota "Comprar materiales" ya no está y se muestra "You don't have any notes in all categories". |

**SCRUM-736 · Borrar una de dos notas elimina solo la elegida**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ven las tarjetas de las notas "Informe mensual" y "Pagar la luz" y el resumen dice "You have 0/2 notes completed in the all categories". |
| 2 | Hacer clic en "Delete" en la tarjeta de la nota "Informe mensual" | - | Se abre el diálogo "Delete note?" con el título "Informe mensual" y los botones "Delete" y "Cancel". |
| 3 | Hacer clic en "Delete" en el diálogo | - | El diálogo se cierra, la tarjeta de "Informe mensual" ya no está, la de "Pagar la luz" sigue en la lista y el resumen dice "You have 0/1 notes completed in the all categories". |

**SCRUM-737 · La nota borrada no vuelve a aparecer al recargar la página**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" y el resumen dice "You have 0/1 notes completed in the all categories". |
| 2 | Hacer clic en "Delete" en la tarjeta de la nota | - | Se abre el diálogo "Delete note?" con el título "Comprar materiales" y los botones "Delete" y "Cancel". |
| 3 | Hacer clic en "Delete" en el diálogo | - | El diálogo se cierra y se muestra "You don't have any notes in all categories". |
| 4 | Recargar la página | - | La lista vuelve a cargar, la nota "Comprar materiales" no aparece y se muestra "You don't have any notes in all categories". |

**SCRUM-738 · Borrar la nota desde su vista de detalle vuelve a My Notes sin la nota**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" desde el menú "MyNotes" | - | Se ve la tarjeta de la nota "Comprar materiales" y el resumen dice "You have 0/1 notes completed in the all categories". |
| 2 | Hacer clic en "View" en la tarjeta de la nota | - | Se abre la vista de detalle de la nota "Comprar materiales" con su descripción y los botones "Edit" y "Delete". |
| 3 | Hacer clic en "Delete" en la vista de detalle | - | Se abre el diálogo "Delete note?" con el título "Comprar materiales" y los botones "Delete" y "Cancel". |
| 4 | Hacer clic en "Delete" en el diálogo | - | La aplicación vuelve a "My Notes", la nota "Comprar materiales" ya no está y se muestra "You don't have any notes in all categories". |

</details>

**Criterios sin caso negativo (justificados):**

- CA-02: Una vez confirmado, el único rechazo posible es que el servidor no pueda borrar la nota, y ese error no se puede provocar desde la pantalla; no confirmar el borrado (Cancel o cerrar el diálogo) está cubierto en CA-01.

**Fuera de alcance:**

- El resumen por categoría después de borrar, ya cubierto en las Historias "Filtrar por categoría" y "Marcar notas como completadas o pendientes".
- El aviso cuando el servidor no puede borrar la nota: es un error que no se puede provocar desde la pantalla.

## SCRUM-745 · Iniciar sesión

**Como** persona registrada en Notes App, **quiero** ingresar con mi email y mi contraseña, **para** ver y gestionar mis notas personales.

**Objetivo:** Que solo la dueña o el dueño de una cuenta pueda entrar a sus notas, con avisos claros cuando los datos ingresados no permiten entrar.

Estado: Finalizada · Spec: [`notes_tc_iniciar_sesion.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js) · Test Cycle: SCRUM-746

### CA-01: Solo con el email y la contraseña de una cuenta registrada se entra a "My Notes" con la sesión iniciada, y con cualquier otra combinación se avisa que el email o la contraseña son incorrectos y se sigue en el login.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-747 | Ingresar con el email y la contraseña de una cuenta registrada | positivo | 4 | [L30](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L30) | ✅ PASSED |
| TC-01.2 · SCRUM-748 | La sesión iniciada se mantiene al recargar My Notes | positivo | 5 | [L39](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L39) | ✅ PASSED |
| TC-01.3 · SCRUM-749 | No se ingresa con una contraseña incorrecta | negativo | 4 | [L50](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L50) | ✅ PASSED |
| TC-01.4 · SCRUM-750 | No se ingresa con un email que no está registrado | negativo | 4 | [L59](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L59) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-747 · Ingresar con el email y la contraseña de una cuenta registrada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta registrada | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | Contraseña de la cuenta registrada | El campo muestra la contraseña oculta. |
| 4 | Hacer clic en "Login" | - | Se muestra "My Notes" con las pestañas de categorías, el botón "+ Add Note" y el botón "Logout" en el menú. |

**SCRUM-748 · La sesión iniciada se mantiene al recargar My Notes**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta registrada | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | Contraseña de la cuenta registrada | El campo muestra la contraseña oculta. |
| 4 | Hacer clic en "Login" | - | Se muestra "My Notes" con el botón "Logout" en el menú. |
| 5 | Recargar la página | - | Se sigue viendo "My Notes" con el botón "Logout": la sesión continúa iniciada. |

**SCRUM-749 · No se ingresa con una contraseña incorrecta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta registrada | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | Otra!Clave1 | El campo muestra la contraseña oculta. |
| 4 | Hacer clic en "Login" | - | Se muestra un aviso que indica que el email o la contraseña son incorrectos y se sigue en la pantalla de login, sin sesión iniciada. |

**SCRUM-750 · No se ingresa con un email que no está registrado**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | nadie.registrado.2026@example.com | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | Contraseña de la cuenta registrada | El campo muestra la contraseña oculta. |
| 4 | Hacer clic en "Login" | - | Se muestra el mismo aviso que con una contraseña incorrecta (el email o la contraseña son incorrectos) y se sigue en la pantalla de login. |

</details>

### CA-02: Al iniciar sesión, un email sin formato válido se avisa debajo del campo y el formulario no se envía.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-751 | No se envía el login sin email | negativo | 3 | [L70](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L70) | ✅ PASSED |
| TC-02.2 · SCRUM-752 | No se envía el login con un email sin formato válido | negativo | 4 | [L78](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L78) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-751 · No se envía el login sin email**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir la contraseña en el campo Password | Contraseña de la cuenta registrada | El campo muestra la contraseña oculta. |
| 3 | Hacer clic en "Login" | - | Debajo del campo Email address se muestra "Email address is required" y no se intenta ingresar. |

**SCRUM-752 · No se envía el login con un email sin formato válido**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | usuario.sin.arroba | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | Contraseña de la cuenta registrada | El campo muestra la contraseña oculta. |
| 4 | Hacer clic en "Login" | - | Debajo del campo Email address se muestra "Email address is invalid" y no se intenta ingresar. |

</details>

### CA-03: Al iniciar sesión, una contraseña que no tenga entre 6 y 30 caracteres se avisa debajo del campo y el formulario no se envía.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-753 | No se envía el login sin contraseña | negativo | 3 | [L89](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L89) | ✅ PASSED |
| TC-03.2 · SCRUM-754 | No se envía el login con una contraseña de 5 caracteres | negativo | 4 | [L97](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L97) | ✅ PASSED |
| TC-03.3 · SCRUM-755 | No se envía el login con una contraseña de 31 caracteres | negativo | 4 | [L106](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L106) | ✅ PASSED |
| TC-03.4 · SCRUM-756 | Una contraseña de 6 caracteres se acepta para intentar el ingreso | positivo | 4 | [L115](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L115) | ✅ PASSED |
| TC-03.5 · SCRUM-757 | Una contraseña de 30 caracteres se acepta para intentar el ingreso | positivo | 4 | [L124](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L124) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-753 · No se envía el login sin contraseña**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta registrada | El campo muestra el email ingresado. |
| 3 | Hacer clic en "Login" | - | Debajo del campo Password se muestra "Password is required" y no se intenta ingresar. |

**SCRUM-754 · No se envía el login con una contraseña de 5 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta registrada | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | 12345 | El campo muestra la contraseña oculta. |
| 4 | Hacer clic en "Login" | - | Debajo del campo Password se muestra "Password should be between 6 and 30 characters" y no se intenta ingresar. |

**SCRUM-755 · No se envía el login con una contraseña de 31 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta registrada | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | Abcdefghij1234567890Abcdefghij1 (31 caracteres) | El campo muestra la contraseña oculta. |
| 4 | Hacer clic en "Login" | - | Debajo del campo Password se muestra "Password should be between 6 and 30 characters" y no se intenta ingresar. |

**SCRUM-756 · Una contraseña de 6 caracteres se acepta para intentar el ingreso**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta registrada | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | Abc123 | El campo muestra la contraseña oculta. |
| 4 | Hacer clic en "Login" | - | No aparece ningún aviso debajo del campo Password: se intenta el ingreso y, como no es la contraseña de la cuenta, se avisa que el email o la contraseña son incorrectos. |

**SCRUM-757 · Una contraseña de 30 caracteres se acepta para intentar el ingreso**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de login de Notes App | - | Se muestra el formulario "Login" con los campos Email address y Password y el botón "Login". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta registrada | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | Abcdefghij1234567890Abcdefghij (30 caracteres) | El campo muestra la contraseña oculta. |
| 4 | Hacer clic en "Login" | - | No aparece ningún aviso debajo del campo Password: se intenta el ingreso y, como no es la contraseña de la cuenta, se avisa que el email o la contraseña son incorrectos. |

</details>

### CA-04: Sin una sesión válida, "My Notes" no muestra ninguna nota.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-04.1 · SCRUM-758 | Sin sesión iniciada My Notes muestra la bienvenida | negativo | 2 | [L135](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L135) | ✅ PASSED |
| TC-04.2 · SCRUM-759 | Con una sesión que ya no es válida My Notes pide volver a ingresar | negativo | 2 | [L142](../../cypress/e2e/expandtesting-notes/notes_tc_iniciar_sesion.cy.js#L142) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-04</summary>

**SCRUM-758 · Sin sesión iniciada My Notes muestra la bienvenida**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" escribiendo su dirección en el navegador | - | Se muestra la bienvenida "Welcome to Notes App" con los botones "Login" y "Create an account", sin notas ni botón "Logout". |
| 2 | Recargar la página | - | Se sigue viendo la bienvenida, sin notas ni botón "Logout". |

**SCRUM-759 · Con una sesión que ya no es válida My Notes pide volver a ingresar**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" | - | Se pasa a la pantalla de login con el aviso "Your session has expired. Please login again to continue.", sin notas. |
| 2 | Recargar la página | - | Se sigue en la pantalla de login, sin notas ni botón "Logout". |

</details>

**Fuera de alcance:**

- Ingreso con Google o LinkedIn (servicios externos).
- Recuperar la contraseña y registrarse: van en Historias aparte.
- Email escrito con otras mayúsculas: la app no las distingue, pero no forma parte de esta Historia.

## SCRUM-760 · Cerrar sesión

**Como** persona con la sesión iniciada en Notes App, **quiero** cerrar mi sesión, **para** que nadie más pueda ver mis notas desde ese dispositivo.

**Objetivo:** Que al cerrar sesión las notas dejen de estar accesibles desde ese navegador.

Estado: Finalizada · Spec: [`notes_tc_cerrar_sesion.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_cerrar_sesion.cy.js) · Test Cycle: SCRUM-761

### CA-05: "Logout", desde cualquier pantalla de la app, lleva a la bienvenida.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-05.1 · SCRUM-762 | Cerrar sesión desde My Notes | positivo | 2 | [L28](../../cypress/e2e/expandtesting-notes/notes_tc_cerrar_sesion.cy.js#L28) | ✅ PASSED |
| TC-05.2 · SCRUM-763 | Cerrar sesión desde el Perfil | positivo | 2 | [L34](../../cypress/e2e/expandtesting-notes/notes_tc_cerrar_sesion.cy.js#L34) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-05</summary>

**SCRUM-762 · Cerrar sesión desde My Notes**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" con la sesión iniciada | - | Se muestran "My Notes", la nota de la precondición y el botón "Logout" en el menú. |
| 2 | Hacer clic en "Logout" en el menú | - | Se muestra la bienvenida "Welcome to Notes App" con los botones "Login" y "Create an account"; el menú ya no muestra "Logout". |

**SCRUM-763 · Cerrar sesión desde el Perfil**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra el perfil con el email de la cuenta y el botón "Logout" en el menú. |
| 2 | Hacer clic en "Logout" en el menú | - | Se muestra la bienvenida "Welcome to Notes App" con los botones "Login" y "Create an account"; el menú ya no muestra "Logout". |

</details>

### CA-06: Después de cerrar sesión ya no se pueden ver las notas, ni volviendo a "My Notes" ni reusando la sesión anterior.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-06.1 · SCRUM-764 | Después de cerrar sesión My Notes no muestra las notas | negativo | 3 | [L46](../../cypress/e2e/expandtesting-notes/notes_tc_cerrar_sesion.cy.js#L46) | ✅ PASSED |
| TC-06.2 · SCRUM-765 | La sesión cerrada no se puede volver a usar | negativo | 3 | [L54](../../cypress/e2e/expandtesting-notes/notes_tc_cerrar_sesion.cy.js#L54) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-06</summary>

**SCRUM-764 · Después de cerrar sesión My Notes no muestra las notas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" con la sesión iniciada | - | Se muestran "My Notes", la nota de la precondición y el botón "Logout" en el menú. |
| 2 | Hacer clic en "Logout" en el menú | - | Se muestra la bienvenida "Welcome to Notes App" con los botones "Login" y "Create an account"; el menú ya no muestra "Logout". |
| 3 | Abrir "My Notes" escribiendo su dirección en el navegador | - | Se sigue viendo la bienvenida "Welcome to Notes App", sin la nota ni el botón "Logout". |

**SCRUM-765 · La sesión cerrada no se puede volver a usar**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "My Notes" con la sesión iniciada | - | Se muestran "My Notes", la nota de la precondición y el botón "Logout" en el menú. |
| 2 | Hacer clic en "Logout" en el menú | - | Se muestra la bienvenida "Welcome to Notes App" con los botones "Login" y "Create an account"; el menú ya no muestra "Logout". |
| 3 | Abrir "My Notes" con la sesión anterior | - | Se pasa a la pantalla de login con el aviso "Your session has expired. Please login again to continue.", sin la nota. |

</details>

**Criterios sin caso negativo (justificados):**

- CA-05: Cerrar sesión no rechaza nada: el único camino de error es una falla del servidor al cerrarla, que no se puede provocar desde la pantalla (queda fuera de alcance).

**Fuera de alcance:**

- Una falla del servidor al cerrar la sesión: no se puede provocar desde la pantalla.

## SCRUM-766 · Registrarse

**Como** persona que quiere organizar sus tareas en Notes App, **quiero** crear una cuenta con mi email, mi nombre y una contraseña, **para** guardar mis notas personales y acceder a ellas cada vez que ingrese.

**Objetivo:** Que cualquier persona pueda crear su propia cuenta con datos válidos, sin cuentas repetidas para un mismo email y con avisos claros cuando un dato no cumple las reglas.

Estado: Finalizada · Spec: [`notes_tc_registrarse.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js) · Test Cycle: SCRUM-767

### CA-01: Con datos válidos y un email que no tiene cuenta, al registrarse se crea la cuenta.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-768 | Crear una cuenta con datos válidos | positivo | 6 | [L42](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L42) | ✅ PASSED |
| TC-01.2 · SCRUM-769 | Ingresar con la cuenta recién creada | positivo | 10 | [L47](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L47) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-768 · Crear una cuenta con datos válidos**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Se muestra "User account created successfully" con el enlace "Click here to Log In"; el formulario ya no se muestra; no queda la sesión iniciada (hay que ingresar desde el login). |

**SCRUM-769 · Ingresar con la cuenta recién creada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Se muestra "User account created successfully" con el enlace "Click here to Log In"; el formulario ya no se muestra. |
| 7 | Hacer clic en "Click here to Log In" | - | Se abre el formulario de login. |
| 8 | Escribir el email registrado en el campo Email address | Email usado en el registro | El campo muestra el email ingresado. |
| 9 | Escribir la contraseña registrada en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 10 | Hacer clic en "Login" | - | Se muestra "My Notes" sin notas y con el botón "Logout" en el menú. |

</details>

### CA-02: Al registrarse, un email sin formato válido se avisa debajo del campo y no se crea la cuenta.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-771 | No se envía el registro sin email | negativo | 5 | [L61](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L61) | ✅ PASSED |
| TC-02.2 · SCRUM-772 | No se envía el registro con un email sin formato válido | negativo | 6 | [L65](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L65) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-771 · No se envía el registro sin email**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 3 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 4 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 5 | Hacer clic en "Register" | - | Debajo de Email address se muestra "Email address is required". No se crea la cuenta y el formulario sigue visible. |

**SCRUM-772 · No se envía el registro con un email sin formato válido**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | usuario.sin.arroba | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Debajo de Email address se muestra "Email address is invalid". No se crea la cuenta y el formulario sigue visible. |

</details>

### CA-03: Al registrarse, un nombre que no tenga entre 4 y 30 caracteres se avisa debajo del campo y no se crea la cuenta.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-773 | No se envía el registro sin nombre | negativo | 5 | [L71](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L71) | ✅ PASSED |
| TC-03.2 · SCRUM-774 | No se envía el registro con un nombre de 3 caracteres | negativo | 6 | [L75](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L75) | ✅ PASSED |
| TC-03.3 · SCRUM-775 | No se envía el registro con un nombre de 31 caracteres | negativo | 6 | [L79](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L79) | ✅ PASSED |
| TC-03.4 · SCRUM-776 | Un nombre de 4 caracteres permite crear la cuenta | positivo | 6 | [L83](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L83) | ✅ PASSED |
| TC-03.5 · SCRUM-777 | Un nombre de 30 caracteres permite crear la cuenta | positivo | 6 | [L87](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L87) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-773 · No se envía el registro sin nombre**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 4 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 5 | Hacer clic en "Register" | - | Debajo de Name se muestra "User name is required". No se crea la cuenta y el formulario sigue visible. |

**SCRUM-774 · No se envía el registro con un nombre de 3 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Ana | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Debajo de Name se muestra "User name should be between 4 and 30 characters". No se crea la cuenta y el formulario sigue visible. |

**SCRUM-775 · No se envía el registro con un nombre de 31 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | 31 letras A | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Debajo de Name se muestra "User name should be between 4 and 30 characters". No se crea la cuenta y el formulario sigue visible. |

**SCRUM-776 · Un nombre de 4 caracteres permite crear la cuenta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Anab | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Se muestra "User account created successfully" con el enlace "Click here to Log In"; el formulario ya no se muestra. |

**SCRUM-777 · Un nombre de 30 caracteres permite crear la cuenta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | 30 letras A | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Se muestra "User account created successfully" con el enlace "Click here to Log In"; el formulario ya no se muestra. |

</details>

### CA-04: Al registrarse, una contraseña que no tenga entre 6 y 30 caracteres se avisa debajo del campo y no se crea la cuenta.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-04.1 · SCRUM-778 | No se envía el registro sin contraseña | negativo | 5 | [L93](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L93) | ✅ PASSED |
| TC-04.2 · SCRUM-779 | No se envía el registro con una contraseña de 5 caracteres | negativo | 6 | [L97](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L97) | ✅ PASSED |
| TC-04.3 · SCRUM-780 | No se envía el registro con una contraseña de 31 caracteres | negativo | 6 | [L101](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L101) | ✅ PASSED |
| TC-04.4 · SCRUM-781 | Una contraseña de 6 caracteres permite crear la cuenta | positivo | 6 | [L105](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L105) | ✅ PASSED |
| TC-04.5 · SCRUM-782 | Una contraseña de 30 caracteres permite crear la cuenta | positivo | 6 | [L109](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L109) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-04</summary>

**SCRUM-778 · No se envía el registro sin contraseña**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 5 | Hacer clic en "Register" | - | Debajo de Password se muestra "Password is required". No se crea la cuenta y el formulario sigue visible. |

**SCRUM-779 · No se envía el registro con una contraseña de 5 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Ab123 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Ab123 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Debajo de Password se muestra "Password should be between 6 and 30 characters". No se crea la cuenta y el formulario sigue visible. |

**SCRUM-780 · No se envía el registro con una contraseña de 31 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Abcdefghij1234567890Abcdefghij1 (31 caracteres) | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Abcdefghij1234567890Abcdefghij1 (31 caracteres) | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Debajo de Password se muestra "Password should be between 6 and 30 characters". No se crea la cuenta y el formulario sigue visible. |

**SCRUM-781 · Una contraseña de 6 caracteres permite crear la cuenta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Abc123 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Abc123 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Se muestra "User account created successfully" con el enlace "Click here to Log In"; el formulario ya no se muestra. |

**SCRUM-782 · Una contraseña de 30 caracteres permite crear la cuenta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Abcdefghij1234567890Abcdefghij (30 caracteres) | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Abcdefghij1234567890Abcdefghij (30 caracteres) | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Se muestra "User account created successfully" con el enlace "Click here to Log In"; el formulario ya no se muestra. |

</details>

### CA-05: Al registrarse, una confirmación distinta de la contraseña se avisa debajo del campo y no se crea la cuenta.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-05.1 · SCRUM-783 | No se envía el registro sin confirmar la contraseña | negativo | 5 | [L115](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L115) | ✅ PASSED |
| TC-05.2 · SCRUM-784 | No se envía el registro con una confirmación distinta de la contraseña | negativo | 6 | [L119](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L119) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-05</summary>

**SCRUM-783 · No se envía el registro sin confirmar la contraseña**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Hacer clic en "Register" | - | Debajo de Confirm Password se muestra "Confirm Password is required". No se crea la cuenta y el formulario sigue visible. |

**SCRUM-784 · No se envía el registro con una confirmación distinta de la contraseña**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email nuevo con formato válido | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2027 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Debajo de Confirm Password se muestra "Passwords don't match!". No se crea la cuenta y el formulario sigue visible. |

</details>

### CA-06: Un email que ya tiene cuenta no se puede registrar otra vez, aunque se escriba con otras mayúsculas.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-06.1 · SCRUM-770 | No se crea una cuenta con un email que ya está registrado | negativo | 6 | [L132](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L132) | ✅ PASSED |
| TC-06.2 · SCRUM-785 | No se crea una cuenta con un email registrado escrito con otras mayúsculas | negativo | 6 | [L136](../../cypress/e2e/expandtesting-notes/notes_tc_registrarse.cy.js#L136) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-06</summary>

**SCRUM-770 · No se crea una cuenta con un email que ya está registrado**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta ya registrada | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Se muestra un aviso que indica que ya existe una cuenta con ese email. No se crea la cuenta y el formulario sigue visible. |

**SCRUM-785 · No se crea una cuenta con un email registrado escrito con otras mayúsculas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir la pantalla de registro de Notes App | - | Se muestra el formulario "Register" con los campos Email address, Name, Password y Confirm Password vacíos y el botón "Register". |
| 2 | Escribir el email en el campo Email address | Email de la cuenta ya registrada con otras mayúsculas (ej. QA.Notes...@Example.com) | El campo muestra el email ingresado. |
| 3 | Escribir el nombre en el campo Name | Qa Registro | El campo muestra el nombre ingresado. |
| 4 | Escribir la contraseña en el campo Password | Qa!Notes2026 | El campo muestra la contraseña oculta. |
| 5 | Escribir la contraseña en el campo Confirm Password | Qa!Notes2026 | El campo muestra la confirmación oculta. |
| 6 | Hacer clic en "Register" | - | Se muestra el mismo aviso que con el email escrito igual: ya existe una cuenta con ese email. No se crea la cuenta y el formulario sigue visible. |

</details>

**Criterios sin caso negativo (justificados):**

- CA-01: Crear la cuenta no rechaza nada por sí misma: cada rechazo del registro es una regla propia (datos inválidos en CA-02 a CA-05, email repetido en CA-06).

**Fuera de alcance:**

- Registro con Google o LinkedIn (servicios externos).

## SCRUM-786 · Actualizar mi perfil

**Como** persona con cuenta en Notes App, **quiero** actualizar mi nombre, mi teléfono y mi empresa, **para** que los datos de mi cuenta estén al día.

**Objetivo:** Que cada persona pueda mantener sus datos personales correctos, con avisos claros cuando un dato no cumple las reglas.

Estado: Finalizada · Spec: [`notes_tc_actualizar_perfil.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js) · Test Cycle: SCRUM-787

### CA-01: Al guardar datos válidos, los cambios del perfil quedan guardados.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-788 | Guardar nombre, teléfono y empresa válidos | positivo | 5 | [L42](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L42) | ✅ PASSED |
| TC-01.2 · SCRUM-789 | Los cambios del perfil siguen al volver a abrirlo | positivo | 6 | [L49](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L49) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-788 · Guardar nombre, teléfono y empresa válidos**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Reemplazar el contenido del campo Full Name | Ana Perfil | El campo muestra el nombre ingresado. |
| 3 | Escribir el teléfono en el campo Phone Number | 1155554444 | El campo muestra el teléfono ingresado. |
| 4 | Escribir la empresa en el campo Company Name | Acme Notas | El campo muestra la empresa ingresada. |
| 5 | Hacer clic en "Update profile" | - | Se muestra un aviso que confirma que el perfil se actualizó. |

**SCRUM-789 · Los cambios del perfil siguen al volver a abrirlo**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Reemplazar el contenido del campo Full Name | Ana Perfil | El campo muestra el nombre ingresado. |
| 3 | Escribir el teléfono en el campo Phone Number | 1155554444 | El campo muestra el teléfono ingresado. |
| 4 | Escribir la empresa en el campo Company Name | Acme Notas | El campo muestra la empresa ingresada. |
| 5 | Hacer clic en "Update profile" | - | Se muestra un aviso que confirma que el perfil se actualizó. |
| 6 | Recargar la página | - | El perfil muestra Ana Perfil, 1155554444 y Acme Notas. |

</details>

### CA-02: Al guardar el perfil, un nombre que no tenga entre 4 y 30 caracteres se avisa debajo del campo y el perfil no se actualiza.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-790 | No se guarda el perfil sin nombre | negativo | 3 | [L60](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L60) | ✅ PASSED |
| TC-02.2 · SCRUM-791 | No se guarda el perfil con un nombre de 3 caracteres | negativo | 3 | [L64](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L64) | ✅ PASSED |
| TC-02.3 · SCRUM-792 | No se guarda el perfil con un nombre de 31 caracteres | negativo | 3 | [L68](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L68) | ✅ PASSED |
| TC-02.4 · SCRUM-793 | Un nombre de 4 caracteres se guarda | positivo | 3 | [L72](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L72) | ✅ PASSED |
| TC-02.5 · SCRUM-794 | Un nombre de 30 caracteres se guarda | positivo | 3 | [L76](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L76) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-790 · No se guarda el perfil sin nombre**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Borrar el contenido del campo Full Name | - | El campo queda vacío. |
| 3 | Hacer clic en "Update profile" | - | Debajo de Full Name se muestra "User name is required". El perfil no se actualiza y no aparece el aviso de actualización. |

**SCRUM-791 · No se guarda el perfil con un nombre de 3 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Reemplazar el contenido del campo Full Name | Ana | El campo muestra el nombre ingresado. |
| 3 | Hacer clic en "Update profile" | - | Debajo de Full Name se muestra "User name should be between 4 and 30 characters". El perfil no se actualiza y no aparece el aviso de actualización. |

**SCRUM-792 · No se guarda el perfil con un nombre de 31 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Reemplazar el contenido del campo Full Name | 31 letras A | El campo muestra el nombre ingresado. |
| 3 | Hacer clic en "Update profile" | - | Debajo de Full Name se muestra "User name should be between 4 and 30 characters". El perfil no se actualiza y no aparece el aviso de actualización. |

**SCRUM-793 · Un nombre de 4 caracteres se guarda**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Reemplazar el contenido del campo Full Name | Anab | El campo muestra el nombre ingresado. |
| 3 | Hacer clic en "Update profile" | - | Se muestra un aviso que confirma que el perfil se actualizó. |

**SCRUM-794 · Un nombre de 30 caracteres se guarda**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Reemplazar el contenido del campo Full Name | 30 letras A | El campo muestra el nombre ingresado. |
| 3 | Hacer clic en "Update profile" | - | Se muestra un aviso que confirma que el perfil se actualizó. |

</details>

### CA-03: Al guardar el perfil, un teléfono completado que no tenga entre 8 y 20 dígitos se avisa debajo del campo y el perfil no se actualiza.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-795 | No se guarda el perfil con un teléfono de 7 dígitos | negativo | 3 | [L82](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L82) | ✅ PASSED |
| TC-03.2 · SCRUM-796 | No se guarda el perfil con un teléfono de 21 dígitos | negativo | 3 | [L86](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L86) | ✅ PASSED |
| TC-03.3 · SCRUM-797 | No se guarda el perfil con un teléfono con guiones | negativo | 3 | [L90](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L90) | ✅ PASSED |
| TC-03.4 · SCRUM-798 | Un teléfono de 8 dígitos se guarda | positivo | 3 | [L94](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L94) | ✅ PASSED |
| TC-03.5 · SCRUM-799 | Un teléfono de 20 dígitos se guarda | positivo | 3 | [L98](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L98) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-795 · No se guarda el perfil con un teléfono de 7 dígitos**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Escribir el teléfono en el campo Phone Number | 1234567 | El campo muestra el teléfono ingresado. |
| 3 | Hacer clic en "Update profile" | - | Debajo de Phone Number se muestra "Phone number should be between 8 and 20 digits". El perfil no se actualiza y no aparece el aviso de actualización. |

**SCRUM-796 · No se guarda el perfil con un teléfono de 21 dígitos**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Escribir el teléfono en el campo Phone Number | 21 dígitos (111111111111111111111) | El campo muestra el teléfono ingresado. |
| 3 | Hacer clic en "Update profile" | - | Debajo de Phone Number se muestra "Phone number should be between 8 and 20 digits". El perfil no se actualiza y no aparece el aviso de actualización. |

**SCRUM-797 · No se guarda el perfil con un teléfono con guiones**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Escribir el teléfono en el campo Phone Number | 11-5555-4444 | El campo muestra el teléfono ingresado. |
| 3 | Hacer clic en "Update profile" | - | Debajo de Phone Number se muestra "Phone number should be between 8 and 20 digits". El perfil no se actualiza y no aparece el aviso de actualización. |

**SCRUM-798 · Un teléfono de 8 dígitos se guarda**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Escribir el teléfono en el campo Phone Number | 12345678 | El campo muestra el teléfono ingresado. |
| 3 | Hacer clic en "Update profile" | - | Se muestra un aviso que confirma que el perfil se actualizó. |

**SCRUM-799 · Un teléfono de 20 dígitos se guarda**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Escribir el teléfono en el campo Phone Number | 20 dígitos (11111111111111111111) | El campo muestra el teléfono ingresado. |
| 3 | Hacer clic en "Update profile" | - | Se muestra un aviso que confirma que el perfil se actualizó. |

</details>

### CA-04: Al guardar el perfil, una empresa completada que no tenga entre 4 y 30 caracteres se avisa debajo del campo y el perfil no se actualiza.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-04.1 · SCRUM-800 | No se guarda el perfil con una empresa de 3 caracteres | negativo | 3 | [L104](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L104) | ✅ PASSED |
| TC-04.2 · SCRUM-801 | No se guarda el perfil con una empresa de 31 caracteres | negativo | 3 | [L108](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L108) | ✅ PASSED |
| TC-04.3 · SCRUM-802 | Una empresa de 4 caracteres se guarda | positivo | 3 | [L112](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L112) | ✅ PASSED |
| TC-04.4 · SCRUM-803 | Una empresa de 30 caracteres se guarda | positivo | 3 | [L116](../../cypress/e2e/expandtesting-notes/notes_tc_actualizar_perfil.cy.js#L116) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-04</summary>

**SCRUM-800 · No se guarda el perfil con una empresa de 3 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Escribir la empresa en el campo Company Name | Acm | El campo muestra la empresa ingresada. |
| 3 | Hacer clic en "Update profile" | - | Debajo de Company Name se muestra "company name should be between 4 and 30 characters". El perfil no se actualiza y no aparece el aviso de actualización. |

**SCRUM-801 · No se guarda el perfil con una empresa de 31 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Escribir la empresa en el campo Company Name | 31 letras C | El campo muestra la empresa ingresada. |
| 3 | Hacer clic en "Update profile" | - | Debajo de Company Name se muestra "company name should be between 4 and 30 characters". El perfil no se actualiza y no aparece el aviso de actualización. |

**SCRUM-802 · Una empresa de 4 caracteres se guarda**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Escribir la empresa en el campo Company Name | Acme | El campo muestra la empresa ingresada. |
| 3 | Hacer clic en "Update profile" | - | Se muestra un aviso que confirma que el perfil se actualizó. |

**SCRUM-803 · Una empresa de 30 caracteres se guarda**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú | - | Se muestra "Profile settings" con el email de la cuenta, el nombre Qa Notes en Full Name y el botón "Update profile". |
| 2 | Escribir la empresa en el campo Company Name | 30 letras C | El campo muestra la empresa ingresada. |
| 3 | Hacer clic en "Update profile" | - | Se muestra un aviso que confirma que el perfil se actualizó. |

</details>

**Criterios sin caso negativo (justificados):**

- CA-01: Guardar datos válidos no rechaza nada por sí mismo: cada rechazo del perfil es una regla propia (nombre en CA-02, teléfono en CA-03, empresa en CA-04).

**Fuera de alcance:**

- Cambiar la contraseña y borrar la cuenta: van en Historias aparte.
- Editar el email o el ID de la cuenta: la pantalla no lo permite.
- Dejar vacíos el teléfono o la empresa, y el teléfono con "+" inicial: la app los acepta, pero no forman parte de esta Historia.

## SCRUM-804 · Cambiar mi contraseña

**Como** usuario registrado de Notes App, **quiero** cambiar mi contraseña desde mi perfil, **para** proteger mi cuenta si sospecho que otra persona conoce mi contraseña.

**Objetivo:** Que solo quien conoce la contraseña vigente pueda reemplazarla por una nueva válida, y que desde ese momento se ingrese únicamente con la nueva.

Estado: Finalizada · Spec: [`notes_tc_cambiar_contrasena.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js) · Test Cycle: SCRUM-805

### CA-01: Al cambiar la contraseña con la actual correcta y una nueva válida, desde ese momento se ingresa con la nueva y la anterior deja de servir.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-806 | Cambiar la contraseña con la actual correcta y una nueva válida | positivo | 5 | [L53](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L53) | ✅ PASSED |
| TC-01.2 · SCRUM-807 | Después del cambio se ingresa con la contraseña nueva | positivo | 10 | [L60](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L60) | ✅ PASSED |
| TC-01.3 · SCRUM-808 | Después del cambio la contraseña anterior ya no sirve para ingresar | negativo | 10 | [L69](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L69) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-806 · Cambiar la contraseña con la actual correcta y una nueva válida**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Se muestra el aviso "The password was successfully updated" y los tres campos quedan vacíos. |

**SCRUM-807 · Después del cambio se ingresa con la contraseña nueva**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Se muestra el aviso "The password was successfully updated" y los tres campos quedan vacíos. |
| 6 | Hacer clic en "Logout" | - | Se muestra la bienvenida de Notes App con "Login" y "Create an account". |
| 7 | Hacer clic en "Login" en la bienvenida | - | Se muestran los campos "Email address" y "Password" y el botón "Login". |
| 8 | Escribir el email de la cuenta en "Email address" | Email de la cuenta | El campo muestra el email. |
| 9 | Escribir la contraseña en "Password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 10 | Hacer clic en "Login" | - | Se ingresa a "My Notes" con la sesión iniciada. |

**SCRUM-808 · Después del cambio la contraseña anterior ya no sirve para ingresar**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Se muestra el aviso "The password was successfully updated" y los tres campos quedan vacíos. |
| 6 | Hacer clic en "Logout" | - | Se muestra la bienvenida de Notes App con "Login" y "Create an account". |
| 7 | Hacer clic en "Login" en la bienvenida | - | Se muestran los campos "Email address" y "Password" y el botón "Login". |
| 8 | Escribir el email de la cuenta en "Email address" | Email de la cuenta | El campo muestra el email. |
| 9 | Escribir la contraseña en "Password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 10 | Hacer clic en "Login" | - | Se muestra el aviso de email o contraseña incorrectos y se sigue en "Login" sin sesión. |

</details>

### CA-02: Al cambiar la contraseña, una contraseña actual que no sea la vigente se rechaza con el aviso de que la contraseña actual es incorrecta y la contraseña no cambia.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-810 | No se cambia la contraseña con una contraseña actual incorrecta | negativo | 5 | [L80](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L80) | ✅ PASSED |
| TC-02.2 · SCRUM-834 | No se cambia la contraseña con la contraseña actual escrita con otras mayúsculas | negativo | 5 | [L86](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L86) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-810 · No se cambia la contraseña con una contraseña actual incorrecta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Otra!Clave1 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Se muestra el aviso de que la contraseña actual es incorrecta y la contraseña no cambia. |

**SCRUM-834 · No se cambia la contraseña con la contraseña actual escrita con otras mayúsculas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | QA!NOTES2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Se muestra el aviso de que la contraseña actual es incorrecta y la contraseña no cambia. |

</details>

### CA-03: Al cambiar la contraseña, una contraseña nueva que no tenga entre 6 y 30 caracteres se avisa debajo del campo y la contraseña no cambia.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-813 | No se cambia la contraseña sin una contraseña nueva | negativo | 3 | [L95](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L95) | ✅ PASSED |
| TC-03.2 · SCRUM-814 | No se cambia la contraseña con una contraseña nueva de 5 caracteres | negativo | 5 | [L102](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L102) | ✅ PASSED |
| TC-03.3 · SCRUM-815 | Una contraseña nueva de 6 caracteres se acepta | positivo | 5 | [L109](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L109) | ✅ PASSED |
| TC-03.4 · SCRUM-816 | Una contraseña nueva de 30 caracteres se acepta | positivo | 5 | [L116](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L116) | ✅ PASSED |
| TC-03.5 · SCRUM-817 | No se cambia la contraseña con una contraseña nueva de 31 caracteres | negativo | 5 | [L123](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L123) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-813 · No se cambia la contraseña sin una contraseña nueva**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Hacer clic en "Update password" | - | Debajo de "New password" se muestra "New password is required" y la contraseña no cambia. |

**SCRUM-814 · No se cambia la contraseña con una contraseña nueva de 5 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Ab!12 | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Ab!12 | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Debajo de "New password" se muestra "New password should be between 6 and 30 characters" y la contraseña no cambia. |

**SCRUM-815 · Una contraseña nueva de 6 caracteres se acepta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Ab!123 | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Ab!123 | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Se muestra el aviso "The password was successfully updated" y los tres campos quedan vacíos. |

**SCRUM-816 · Una contraseña nueva de 30 caracteres se acepta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | AAAAAAAAAAAAAAAAAAAAAAAAAAAAA! (29 letras A y un signo !) | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | AAAAAAAAAAAAAAAAAAAAAAAAAAAAA! (29 letras A y un signo !) | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Se muestra el aviso "The password was successfully updated" y los tres campos quedan vacíos. |

**SCRUM-817 · No se cambia la contraseña con una contraseña nueva de 31 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA! (30 letras A y un signo !) | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA! (30 letras A y un signo !) | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Debajo de "New password" se muestra "New password should be between 6 and 30 characters" y la contraseña no cambia. |

</details>

### CA-04: Al cambiar la contraseña, una confirmación que no coincida con la contraseña nueva se avisa debajo del campo y la contraseña no cambia.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-04.1 · SCRUM-818 | No se cambia la contraseña con una confirmación distinta | negativo | 5 | [L132](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L132) | ✅ PASSED |
| TC-04.2 · SCRUM-819 | No se cambia la contraseña sin la confirmación | negativo | 4 | [L139](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L139) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-04</summary>

**SCRUM-818 · No se cambia la contraseña con una confirmación distinta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Nueva!2026y | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Debajo de "Confirm password" se muestra "Passwords don't match!" y la contraseña no cambia. |

**SCRUM-819 · No se cambia la contraseña sin la confirmación**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Hacer clic en "Update password" | - | Debajo de "Confirm password" se muestra "Confirm password is required" y la contraseña no cambia. |

</details>

### CA-05: Al cambiar la contraseña, una contraseña nueva igual a la actual se rechaza con el aviso de que la nueva tiene que ser distinta de la actual y la contraseña no cambia.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-05.1 · SCRUM-809 | No se acepta una contraseña nueva igual a la actual | negativo | 5 | [L148](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L148) | ✅ PASSED |
| TC-05.2 · SCRUM-820 | Una contraseña nueva que solo cambia mayúsculas se acepta | positivo | 5 | [L155](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L155) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-05</summary>

**SCRUM-809 · No se acepta una contraseña nueva igual a la actual**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Se muestra el aviso de que la contraseña nueva tiene que ser distinta de la actual y la contraseña no cambia. |

**SCRUM-820 · Una contraseña nueva que solo cambia mayúsculas se acepta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | QA!NOTES2026 | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | QA!NOTES2026 | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Se muestra el aviso "The password was successfully updated" y los tres campos quedan vacíos. |

</details>

### CA-06: Al cambiar la contraseña, una contraseña actual que no tenga entre 6 y 30 caracteres se avisa debajo del campo y la contraseña no cambia.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-06.1 · SCRUM-811 | No se cambia la contraseña sin la contraseña actual | negativo | 4 | [L164](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L164) | ✅ PASSED |
| TC-06.2 · SCRUM-812 | No se cambia la contraseña con una contraseña actual de 5 caracteres | negativo | 5 | [L170](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L170) | ✅ PASSED |
| TC-06.3 · SCRUM-835 | No se cambia la contraseña con una contraseña actual de 31 caracteres | negativo | 5 | [L176](../../cypress/e2e/expandtesting-notes/notes_tc_cambiar_contrasena.cy.js#L176) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-06</summary>

**SCRUM-811 · No se cambia la contraseña sin la contraseña actual**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la confirmación en "Confirm password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Hacer clic en "Update password" | - | Debajo de "Current password" se muestra "Current password is required" y la contraseña no cambia. |

**SCRUM-812 · No se cambia la contraseña con una contraseña actual de 5 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | Qa!No | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Debajo de "Current password" se muestra "Current password should be between 6 and 30 characters" y la contraseña no cambia. |

**SCRUM-835 · No se cambia la contraseña con una contraseña actual de 31 caracteres**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en la pestaña "Change password" de "Profile" | - | Se muestran los campos "Current password", "New password" y "Confirm password" vacíos y el botón "Update password". |
| 2 | Escribir la contraseña actual en "Current password" | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA! (31 caracteres) | El campo queda completado con los caracteres ocultos. |
| 3 | Escribir la contraseña nueva en "New password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 4 | Escribir la confirmación en "Confirm password" | Nueva!2026x | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Update password" | - | Debajo de "Current password" se muestra "Current password should be between 6 and 30 characters" y la contraseña no cambia. |

</details>

**Bugs vinculados:**

- SCRUM-833 · Notes App: cambiar la contraseña no cierra las sesiones ya abiertas de la cuenta (Tareas por hacer)

**Fuera de alcance:**

- Recuperar la contraseña olvidada por email (el correo no se puede verificar).

## SCRUM-821 · Borrar mi cuenta

**Como** usuario registrado de Notes App, **quiero** borrar mi cuenta desde mi perfil, **para** que mis datos dejen de estar en la app cuando ya no la uso.

**Objetivo:** Que la cuenta borrada deje de existir: nadie puede volver a usarla y su email queda disponible para una cuenta nueva.

Estado: Finalizada · Spec: [`notes_tc_borrar_cuenta.cy.js`](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js) · Test Cycle: SCRUM-822

### CA-01: Al confirmar el borrado de la cuenta, se muestra el login con el aviso "Your account has been deleted. You should create a new account to continue." y la sesión queda cerrada.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-01.1 · SCRUM-823 | Borrar una cuenta sin notas | positivo | 2 | [L57](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L57) | ✅ PASSED |
| TC-01.2 · SCRUM-824 | Borrar una cuenta que tiene notas | positivo | 2 | [L61](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L61) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-01</summary>

**SCRUM-823 · Borrar una cuenta sin notas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "Delete Account" | - | Se abre el diálogo "Do you really want to delete your account? Once your account is deleted, all of your data will be permanently removed, and we will be unable to restore it" con los botones "Delete", "Cancel" y la X. |
| 2 | Hacer clic en "Delete" del diálogo | - | Se muestra la pantalla "Login" con el aviso "Your account has been deleted. You should create a new account to continue." y la sesión queda cerrada. |

**SCRUM-824 · Borrar una cuenta que tiene notas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "Delete Account" | - | Se abre el diálogo "Do you really want to delete your account? Once your account is deleted, all of your data will be permanently removed, and we will be unable to restore it" con los botones "Delete", "Cancel" y la X. |
| 2 | Hacer clic en "Delete" del diálogo | - | Se muestra la pantalla "Login" con el aviso "Your account has been deleted. You should create a new account to continue." y la sesión queda cerrada. |

</details>

### CA-02: Después de borrar la cuenta, ingresar con su email y contraseña se rechaza con el aviso de email o contraseña incorrectos.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-02.1 · SCRUM-825 | No se ingresa con el email y la contraseña de una cuenta borrada | negativo | 5 | [L74](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L74) | ✅ PASSED |
| TC-02.2 · SCRUM-826 | No se ingresa con el email de una cuenta borrada escrito con otras mayúsculas | negativo | 5 | [L81](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L81) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-02</summary>

**SCRUM-825 · No se ingresa con el email y la contraseña de una cuenta borrada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "Delete Account" | - | Se abre el diálogo "Do you really want to delete your account? Once your account is deleted, all of your data will be permanently removed, and we will be unable to restore it" con los botones "Delete", "Cancel" y la X. |
| 2 | Hacer clic en "Delete" del diálogo | - | Se muestra la pantalla "Login" con el aviso "Your account has been deleted. You should create a new account to continue." y la sesión queda cerrada. |
| 3 | Escribir el email de la cuenta borrada en "Email address" | Email de la cuenta borrada | El campo muestra el email. |
| 4 | Escribir la contraseña de la cuenta borrada en "Password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Login" | - | Se muestra el aviso de email o contraseña incorrectos y se sigue en "Login" sin sesión. |

**SCRUM-826 · No se ingresa con el email de una cuenta borrada escrito con otras mayúsculas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "Delete Account" | - | Se abre el diálogo "Do you really want to delete your account? Once your account is deleted, all of your data will be permanently removed, and we will be unable to restore it" con los botones "Delete", "Cancel" y la X. |
| 2 | Hacer clic en "Delete" del diálogo | - | Se muestra la pantalla "Login" con el aviso "Your account has been deleted. You should create a new account to continue." y la sesión queda cerrada. |
| 3 | Escribir el email de la cuenta borrada en "Email address" | Email de la cuenta borrada con otras mayúsculas (ej. QA.Notes.123@Example.com) | El campo muestra el email. |
| 4 | Escribir la contraseña de la cuenta borrada en "Password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 5 | Hacer clic en "Login" | - | Se muestra el aviso de email o contraseña incorrectos y se sigue en "Login" sin sesión. |

</details>

### CA-03: Después de borrar la cuenta, una sesión que había quedado abierta en otro dispositivo lleva al login con el aviso "Your session has expired. Please login again to continue." al cargar cualquier pantalla.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-03.1 · SCRUM-827 | La sesión abierta de una cuenta borrada no muestra My Notes | negativo | 3 | [L90](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L90) | ✅ PASSED |
| TC-03.2 · SCRUM-828 | La sesión abierta de una cuenta borrada no muestra el perfil | negativo | 3 | [L99](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L99) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-03</summary>

**SCRUM-827 · La sesión abierta de una cuenta borrada no muestra My Notes**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir My Notes en este navegador | - | Se muestra "My Notes" con la sesión iniciada. |
| 2 | Borrar la cuenta desde el otro dispositivo | - | La cuenta queda borrada; este navegador todavía muestra la pantalla anterior. |
| 3 | Recargar My Notes en este navegador | - | Se muestra la pantalla "Login" con el aviso "Your session has expired. Please login again to continue." y sin notas. |

**SCRUM-828 · La sesión abierta de una cuenta borrada no muestra el perfil**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Abrir "Profile" desde el menú en este navegador | - | Se muestran los datos de la cuenta con la sesión iniciada. |
| 2 | Borrar la cuenta desde el otro dispositivo | - | La cuenta queda borrada; este navegador todavía muestra la pantalla anterior. |
| 3 | Recargar "Profile" en este navegador | - | Se muestra la pantalla "Login" con el aviso "Your session has expired. Please login again to continue." sin los datos de la cuenta. |

</details>

### CA-04: Al cancelar o cerrar el diálogo de confirmación, la cuenta no se borra y se sigue en el perfil con la sesión iniciada.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-04.1 · SCRUM-829 | Cancelar el borrado de la cuenta | positivo | 2 | [L110](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L110) | ✅ PASSED |
| TC-04.2 · SCRUM-830 | Cerrar con la X el diálogo de borrado de la cuenta | positivo | 2 | [L117](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L117) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-04</summary>

**SCRUM-829 · Cancelar el borrado de la cuenta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "Delete Account" | - | Se abre el diálogo "Do you really want to delete your account? Once your account is deleted, all of your data will be permanently removed, and we will be unable to restore it" con los botones "Delete", "Cancel" y la X. |
| 2 | Hacer clic en "Cancel" del diálogo | - | El diálogo se cierra, la cuenta no se borra y se sigue en "Profile" con la sesión iniciada. |

**SCRUM-830 · Cerrar con la X el diálogo de borrado de la cuenta**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "Delete Account" | - | Se abre el diálogo "Do you really want to delete your account? Once your account is deleted, all of your data will be permanently removed, and we will be unable to restore it" con los botones "Delete", "Cancel" y la X. |
| 2 | Hacer clic en la X del diálogo | - | El diálogo se cierra, la cuenta no se borra y se sigue en "Profile" con la sesión iniciada. |

</details>

### CA-05: Después de borrar la cuenta, registrarse con su email crea una cuenta nueva.

| TC | Test Case | Tipo | Pasos | Test | Resultado |
|---|---|---|---|---|---|
| TC-05.1 · SCRUM-831 | Registrar una cuenta nueva con el email de una cuenta borrada | positivo | 8 | [L126](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L126) | ✅ PASSED |
| TC-05.2 · SCRUM-832 | Registrar una cuenta nueva con el email de una cuenta borrada escrito con otras mayúsculas | positivo | 8 | [L133](../../cypress/e2e/expandtesting-notes/notes_tc_borrar_cuenta.cy.js#L133) | ✅ PASSED |

<details><summary>Pasos de los Test Cases de CA-05</summary>

**SCRUM-831 · Registrar una cuenta nueva con el email de una cuenta borrada**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "Delete Account" | - | Se abre el diálogo "Do you really want to delete your account? Once your account is deleted, all of your data will be permanently removed, and we will be unable to restore it" con los botones "Delete", "Cancel" y la X. |
| 2 | Hacer clic en "Delete" del diálogo | - | Se muestra la pantalla "Login" con el aviso "Your account has been deleted. You should create a new account to continue." y la sesión queda cerrada. |
| 3 | Abrir la pantalla de registro | - | Se muestra el formulario "Register" con los campos vacíos. |
| 4 | Escribir el email de la cuenta borrada en "Email address" | Email de la cuenta borrada | El campo muestra el email. |
| 5 | Escribir el nombre en "Name" | Qa Notes | El campo muestra el nombre. |
| 6 | Escribir la contraseña en "Password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 7 | Escribir la contraseña en "Confirm Password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 8 | Hacer clic en "Register" | - | Se muestra "User account created successfully" con el enlace "Click here to Log In". |

**SCRUM-832 · Registrar una cuenta nueva con el email de una cuenta borrada escrito con otras mayúsculas**

| # | Acción | Datos | Resultado esperado |
|---|---|---|---|
| 1 | Hacer clic en "Delete Account" | - | Se abre el diálogo "Do you really want to delete your account? Once your account is deleted, all of your data will be permanently removed, and we will be unable to restore it" con los botones "Delete", "Cancel" y la X. |
| 2 | Hacer clic en "Delete" del diálogo | - | Se muestra la pantalla "Login" con el aviso "Your account has been deleted. You should create a new account to continue." y la sesión queda cerrada. |
| 3 | Abrir la pantalla de registro | - | Se muestra el formulario "Register" con los campos vacíos. |
| 4 | Escribir el email de la cuenta borrada en "Email address" | Email de la cuenta borrada con otras mayúsculas (ej. QA.Notes.123@Example.com) | El campo muestra el email. |
| 5 | Escribir el nombre en "Name" | Qa Notes | El campo muestra el nombre. |
| 6 | Escribir la contraseña en "Password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 7 | Escribir la contraseña en "Confirm Password" | Qa!Notes2026 | El campo queda completado con los caracteres ocultos. |
| 8 | Hacer clic en "Register" | - | Se muestra "User account created successfully" con el enlace "Click here to Log In". |

</details>

**Criterios sin caso negativo (justificados):**

- CA-01: El único camino de error es una falla del servidor al borrar, que no se puede provocar desde la pantalla.
- CA-04: El negativo de cancelar es confirmar el borrado, que es CA-01.
- CA-05: El rechazo de un email que pertenece a una cuenta existente es la regla de email único del registro (SCRUM-766).

**Fuera de alcance:**

- Que las notas de la cuenta borrada se eliminen: desde la app no se puede observar, porque una cuenta nueva nunca ve las notas de otra.
- La falla del servidor al borrar la cuenta (no se puede provocar desde la pantalla).
