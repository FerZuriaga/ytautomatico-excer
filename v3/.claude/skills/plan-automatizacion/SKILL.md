---
name: plan-automatizacion

description: >
  Revisión previa al código del PASO 3: trabajo existente, trazabilidad,
  componentes reutilizables del framework y estrategia de implementación.
  No escribe código.

when_to_use: >
  Al cargar `qa-automation1`, una vez por lote, antes de crear la rama y
  de escribir cualquier archivo.

---

# Plan de automatización

Reemplaza a `ticket-analysis`, `framework-analysis` e
`implementation-plan` (archivadas en `v3/.claude/skills-archive/`). Es
una revisión corta: su objetivo es no duplicar ni romper nada, no
producir un documento largo.

## 1. Trabajo existente

Nunca asumir que un ticket parte de cero por estar en "Tareas por hacer".
Buscar ramas (locales y remotas), Pull Requests y tickets con el mismo
alcance o solapado. Si la base depende de una rama sin mergear, el lote
sale de esa rama (PR apilado) y se informa la dependencia.

## 2. Trazabilidad funcional

Cada HU trae sus CA, cada CA sus Test Cases con key de Xray, y los Test
Cycles existen. Si algo falta, frenar e informar al Manager.

## 3. Framework

Revisar, para la app y en general: Page Objects, comandos custom
(`cypress/support/commands/<app>.js`), fixtures de selectores, helpers,
`cypress.config.js` y convenciones de nombres. Nunca asumir que algo no
existe sin buscarlo.

Orden obligatorio: **reutilizar → extender → crear**. Un archivo nuevo
se justifica (qué alternativa se descartó y por qué). Lógica que se
repite o se va a repetir entre specs se extrae a un método de Page Object
o comando, no queda inline en el spec.

**Arquitectura compartida** (`cypress/support/`, `cypress.config.js`,
`package.json`, fixtures globales): explicar la decisión, justificar el
patrón y **esperar aprobación del usuario** antes de tocarla.

## 4. Estrategia para negativos y bordes

Un caso negativo nunca se limita a "ingresar el dato y seguir": definir
cómo el test comprueba el rechazo (mensaje visible, atributo, estado del
control, request que no sale o que responde error). Para verificar que
algo NO cambió, esperar la respuesta de la acción (`cy.wait('@alias')`)
antes de afirmar, o la aserción pasa con el estado previo.

## 5. Riesgos

Selectores frágiles, datos compartidos o re-sembrados, dependencias entre
tests, esperas implícitas, textos que dependen del idioma, reglas del
backend. Riesgo general: Bajo / Medio / Alto.

## Salida

```
TRABAJO_RELACIONADO: (ramas/PRs/tickets, o Ninguno)
TRAZABILIDAD: Completa | Incompleta
REUTILIZAR: ...
EXTENDER: ...
CREAR: ... (con justificación)
ARQUITECTURA_COMPARTIDA: (cambios que requieren aprobación, o Ninguno)
ESTRATEGIA_NEGATIVOS: ...
RIESGOS: ... (general: Bajo | Medio | Alto)
LISTO_PARA_IMPLEMENTAR: Sí | No
```
