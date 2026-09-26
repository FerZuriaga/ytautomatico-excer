---
name: discovery

description: >
  PASO 1 del pipeline. Releva una aplicación (funcionalidades) y, una vez
  elegida la funcionalidad, su pantalla objetivo (reglas de negocio,
  datos de prueba, selectores y comportamiento técnico). Deja los
  hallazgos como artefactos permanentes del repo.

when_to_use: >
  Cuando el usuario da solo una aplicación, URL o proyecto (Parte A), y
  cuando ya eligió una funcionalidad y hay que relevarla antes de escribir
  escenarios y Test Cases (Parte B).

---

# Discovery (PASO 1)

Reemplaza a `application-discovery` y a la parte técnica del PASO 1 que
estaba repartida en el Manager e `implementation-plan` (archivadas en
`v3/.claude/skills-archive/`).

Nunca crea tickets, escenarios, Historias ni código de tests.

## Antes de relevar nada

1. Leer `docs/discovery/<app>.md` si existe y reusar lo ya verificado.
2. Leer la memoria y los specs de apps de la misma familia: precargar sus
   gotchas (datos compartidos, re-siembras, bloqueos de cuentas, idioma).
3. Relevar SOLO lo que falte.

## Parte A — Funcionalidades de la aplicación

Fuentes, en este orden (registrar cuál se usó en `FUENTE_FUNCIONAL`):
documentación oficial → catálogo oficial de Test Cases → guía de usuario
→ la propia aplicación (rutas, menús, código publicado). Si no hay
documentación oficial, decirlo.

- Recorrer la app completa, no quedarse con lo primero visible.
- Clasificar cada funcionalidad como **OBSERVADA** (vista en la app o su
  código) o **INFERIDA** (típica del dominio, marcada como tal). Nunca
  inventar módulos.
- Hasta ~10 funcionalidades: lista numerada. Más: agrupadas por módulo
  real, con numeración global.
- Ordenar de menor a mayor complejidad y recomendar por dónde empezar:
  baja complejidad, independiente, fácil de validar, pocas precondiciones.
- Profundidad según el tipo de app: demo (ligero), e-commerce (medio,
  flujo completo), sistema empresarial (profundo, módulos y relaciones).

Salida:

```
PROYECTO:
URL:
TIPO_APLICACION:
FUENTE_FUNCIONAL:
FUNCIONALIDADES_ENCONTRADAS: (numeradas, agrupadas si hace falta)
FUNCIONALIDAD_RECOMENDADA_PARA_COMENZAR:
OBSERVACIONES: (riesgos del entorno: datos compartidos, cuentas demo, etc.)
FUNCIONALIDADES_PREVIAMENTE_CUBIERTAS: (solo contexto, sin rutas ni archivos)
```

Terminar el turno: el usuario elige.

## Parte B — Relevamiento de la funcionalidad elegida

Combinar dos fuentes, cada una para lo suyo:

| Qué relevar | Cómo |
|---|---|
| Reglas de negocio (validaciones, límites, textos exactos) | Código publicado (sourcemap o bundle), documentación |
| Datos de prueba y conteos | API/HTML directo (`curl`) con los mismos parámetros que usa el front |
| Comportamiento real en navegador | `node v3/scripts/explore-page.js --url <url>` |

`explore-page.js` se corre **una vez por pantalla objetivo** (con
`--actions` para pantallas internas y `--init-script` si la app necesita un
adaptador dentro de Cypress). Del informe, revisar siempre:

- **Método HTTP real** de cada request (no asumir GET porque `curl` GET
  funcione) y requests sin respuesta.
- **Idioma** del documento vs. del navegador (¿la app traduce según el
  navegador?).
- **`data-test` duplicados u ocultos** y campos sin atributo de test.
- **Almacenamiento** (localStorage/sessionStorage) que condicione el estado.
- **Errores de consola** y excepciones.
- **Recargas completas de página** (`window.location.href`, `reload()`,
  redirecciones por 401): todo lo que el test instala en la ventana
  (adaptadores, `onBeforeLoad`, stubs) se pierde en la ventana nueva.
  Buscarlas en el código (`location.href=`, `reload()`) y confirmar qué
  sobrevive. Caso real: el login y el guard de la cuenta de Practice
  Software Testing recargan la página y el catálogo quedó sin el adaptador
  QUERY (SCRUM-500, iteración evitable).

**Explorar el mismo camino que usará el test, no solo el de la UI.** Si el
test prepara el estado por API (sesión inyectada, carrito sembrado) o entra
directo a una pantalla interna, correr `explore-page.js` con ese mismo
estado (`--storage`, `--actions` con `visit`) además del recorrido visual.
Pasó dos veces (Carrito y Login): el camino de la UI andaba y el del test
no.

Verificar además, contra la API:

- **Estabilidad de los ids:** si la base se re-siembra, los ids cambian;
  ubicar por texto visible exacto, nunca por id.
- **Datos compartidos:** usar solo datos semilla que nadie más modifica.
- **Reglas ocultas en el backend** (ej. "un solo Thor Hammer por carrito"):
  probar con la API las acciones que el test va a disparar con los datos
  elegidos.

### Artefactos (se commitean, nunca se borran)

- Selectores en `cypress/fixtures/selectors/<app>/<modulo>.json`.
- Hallazgos que valen para 2+ módulos en `docs/discovery/<app>.md`.
- Nada de specs borrador ni archivos temporales dentro del repo: el
  informe de `explore-page.js` queda fuera (carpeta temporal).

Prohibido adivinar selectores y usar `cy.reconPage` / `cy.reconSubmit`.

Salida de la Parte B: reglas de negocio relevadas (una por línea, con su
fuente), datos de prueba verificados, riesgos técnicos y limitaciones o
posibles defectos detectados. Es la entrada de `especificacion`.
