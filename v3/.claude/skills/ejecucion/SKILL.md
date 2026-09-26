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
- **Reporte a Xray cortado** (502, ECONNABORTED): es idempotente;
  reintentar con `create-jira-task.js --report-results <json>
  --test-cycle <ciclos>` y verificar los ciclos por lectura.

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
3. Corregir y volver a correr el **lote completo**.

**Con 3 iteraciones fallidas, frenar y consultar al usuario** con el
diagnóstico.

## Salida

```
SPECS:
RESULTADO: N/M passing (iteración X)
REINTENTOS: (tests que pasaron solo en reintento, o ninguno)
REPORTE_XRAY: Reportado y verificado | No reportado (motivo)
VALIDACIÓN: Aprobada | Rechazada
DIAGNÓSTICO: (solo si hubo fallas: causa y corrección por iteración)
```
