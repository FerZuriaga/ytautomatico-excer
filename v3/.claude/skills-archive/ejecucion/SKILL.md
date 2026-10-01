---
name: ejecucion

description: >
  Corre los specs del lote con run-and-report.js, interpreta el resultado
  y, si falla, diagnostica con evidencia antes de la siguiente iteración.

when_to_use: >
  Con `qa-automation1` cargada, cuando el código del lote está escrito.

---

# Ejecución y validación

Reemplaza a `test-execution` y `execution-validation` (archivadas en
`v3/.claude/skills-archive/`): `run-and-report.js` ya hace las dos cosas.

## Comando

```
node v3/scripts/run-and-report.js --spec <spec1>,<spec2> --test-cycle <ciclo1>,<ciclo2>
```

Antes de correr verifica la trazabilidad (`check-traceability.js`); si hay
errores no corre nada. Reportar a Xray es del rol `product-agent`: cargarlo
antes de pasar `--test-cycle`, o correr sin ese flag y reportar desde ese
rol.

## Cómo se interpreta

- **Aprobada** solo con 100% passing, 0 pendientes y más de 0 tests. En
  ese caso el script reporta a Xray y verifica los ciclos por lectura.
- **↻ Pasaron solo en reintento:** se reportan PASSED pero se informan
  siempre (posible inestabilidad).
- **Reporte a Xray cortado** (502, ECONNABORTED, socket hang up): es
  idempotente; reintentar SIN volver a correr los specs con
  `run-and-report.js --from-results <json> --test-cycle <ciclos>`, que
  reporta y verifica los ciclos por lectura con el JSON de la corrida.

## Si falla: una iteración a la vez

Nunca volver a correr "a ver si pasa". Antes de cada nueva corrida:

1. **Leer la evidencia:** mensaje de error y captura
   (`cypress/screenshots/`), y si hace falta `explore-page.js` sobre la
   pantalla.
2. **Clasificar la causa:**
   - error de la automatización (selector, aserción, espera) → corregir el
     código;
   - dato de prueba incorrecto en el Test Case → corregir el spec y el
     Test Case publicado (`product-agent`, `--update-steps`);
   - comportamiento de la app distinto de la HU → confirmar que es
     reproducible y pasar a `bug-reporting`; nunca debilitar la aserción
     para que pase;
   - limitación técnica del entorno → evidencia objetiva y decisión del
     usuario.
   `run-and-report.js` imprime una **Pista** por falla según su mensaje:
   "no encontró el elemento" (selector, espera o camino previo) vs. "el
   elemento está pero no cumple lo esperado" → reproducir con
   `explore-page.js` ANTES de tocar el código, porque puede ser un defecto
   de la app. Caso real: en Checkout la iteración 2 cambió el page object
   y la falla era el Bug SCRUM-528 (una corrida perdida).
3. Corregir y volver a correr el **lote completo**.

**Con 3 iteraciones fallidas, frenar y consultar al usuario** con el
diagnóstico.

## Tiempos

Cada corrida imprime cuánto tardó cada fase (trazabilidad, Cypress,
reporte a Xray, verificación) y el número de iteración del lote en la
rama, y lo registra en `.qa-metrics/run-and-report.jsonl` (local, fuera
de Git). Al cerrar el lote, `node v3/scripts/run-and-report.js
--timing-report <rama>` resume corridas, iteraciones fallidas y tiempos:
va al Informe de Cierre y a la memoria del proyecto, para comparar lotes
con datos.

## Regresión después del lote (D-35)

Se decide por **qué tocó la rama fuera de los archivos nuevos del lote**,
no por qué archivos importan lo modificado:

| La rama… | Regresión |
|---|---|
| solo **agrega** (spec nuevo, métodos nuevos de Page Object, textos o selectores nuevos en el fixture, sección del discovery) | **Ninguna**: alcanza con la corrida del lote. |
| **modifica** algo existente (cuerpo o firma de un método, un selector o texto del fixture ya usado, un comando custom) | Solo los specs que **usan eso** (buscarlos con Grep por el nombre del método o la clave), en una corrida: `run-and-report.js --spec <esos>`. |
| hace un **cambio global** (`cypress.config.js`, `support/e2e.js`, `support/commands.js`, `package.json`, salvo registrar una app nueva) | `run-and-report.js --affected` (apps activas, tope de 20 specs; D-33). |

- **No frena el PR:** apenas el lote pasa al 100% se hacen commit, push y
  PR; la regresión (si corresponde) corre en segundo plano y su resultado
  se agrega al PR con `create-pull-request.js --action update`. El merge
  espera a que termine en verde.
- Toda corrida de más de ~5 minutos se avisa antes con cantidad de specs y
  tiempo estimado (D-34).
- Caso real (SCRUM-717, 2026-09-30): la rama solo agregaba métodos y
  cambiaba un parámetro opcional de `verifyRejected` (usado solo por el
  spec de crear nota); `--affected` corrió los 5 specs de Notes (52 tests,
  12,5 min, esperando para abrir el PR) cuando alcanzaba con 1 spec en
  segundo plano.

Los cortes de red contra Jira/Xray (`socket hang up`, 5xx) se reintentan
solos en las lecturas y en el cambio de estado de las ejecuciones
(`lib/http-retry.js`); un test en `it.skip` por bug conocido vuelve su
ejecución a TO DO si tenía un resultado anterior.

## Salida

```
SPECS:
RESULTADO: N/M passing (iteración X)
REINTENTOS: (tests que pasaron solo en reintento, o ninguno)
REPORTE_XRAY: Reportado y verificado | No reportado (motivo)
VALIDACIÓN: Aprobada | Rechazada
DIAGNÓSTICO: (solo si hubo fallas: causa y corrección por iteración)
```
