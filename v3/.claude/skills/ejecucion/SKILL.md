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

## Regresión después del lote

Solo de lo afectado, no de toda la app:

```
node v3/scripts/run-and-report.js --affected
```

Calcula los specs afectados por la rama respecto de `main` (commits,
cambios sin commitear y archivos nuevos): los que importan en cadena un
page object modificado, usan un fixture modificado o llaman a un comando
custom de un archivo de soporte modificado. Ante un cambio global
(`cypress.config.js`, `support/e2e.js`, `support/commands.js`,
`package.json`) corre la suite de las apps activas (`APPS.active`), no el
legado (D-33: la suite completa con legado pasaba los 35 minutos).
Registrar una app nueva (su URL en el config, el import de sus comandos,
su script de npm) no cuenta como cambio global. **Tope de 20 specs:** si
la regresión es más grande, el script no corre; consultar al usuario con
la cantidad y el tiempo estimado, y solo con su OK re-ejecutar con
`--max-specs N`. Nunca esperar una corrida larga sin avisar. `--list` muestra los specs y el motivo sin correr
nada. Correrla en segundo plano y, mientras tanto, preparar el cuerpo del
PR, el discovery y la memoria: no esperar sin hacer nada. Caso real: en Checkout la
regresión completa (108 tests) llevó 10,5 min de espera.

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
