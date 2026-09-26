---
name: git

description: >
  Flujo Git del PASO 3: rama antes de escribir código y commit, push y
  Pull Request después de una corrida 100% exitosa.

when_to_use: >
  Con `qa-automation1` cargada: antes de modificar archivos (Parte A) y
  después de `ejecucion` + `automation-review` (Parte B).

---

# Git

Reemplaza a `branch-management` y `git-workflow` (archivadas en
`v3/.claude/skills-archive/`). El CLI `gh` no está instalado: los Pull
Requests se crean solo con `v3/scripts/create-pull-request.js`.

## Parte A — Rama (antes del código)

1. **Working directory:** si hay cambios ajenos al trabajo, informarlos y
   preservarlos (stash o commit aparte, con confirmación). Nunca
   descartarlos sin confirmación explícita.
2. **Base actualizada:** `git pull` de `main` antes de crear la rama.
3. **Rama existente:** si ya hay una rama para el ticket, reutilizarla.
   Nunca trabajar sobre `main`.
4. **Dependencias:** si el trabajo necesita código de una rama sin
   mergear, la rama nueva sale de esa (PR apilado) y se informa.
5. **Nombres:**
   - una Historia: `feature/SCRUM-<key>-<descripcion>`;
   - un lote de varias Historias: `feature/SCRUM-<app>-<lote>`;
   - mejoras del pipeline o mantenimiento: `chore/<descripcion>`.

## Parte B — Commit, push y PR (solo tras 100% exitoso)

1. **Revisar archivos** modificados, nuevos y eliminados. Excluir lo ajeno
   al alcance (y pedir confirmación). Nunca archivos temporales en el repo.
   Los selectores (`cypress/fixtures/selectors/`) y el discovery
   (`docs/discovery/`) SÍ se commitean.
2. **Un commit por Historia** en los lotes, con el key en el mensaje:
   `Automatizar <funcionalidad> en <app> (SCRUM-<key>)`. La
   infraestructura común del lote va en el commit de la primera Historia.
   Nunca mensajes ambiguos ("update", "fix", "cambios").
3. **Push** y verificar que la rama existe en `origin`.
4. **Pull Request** con `node v3/scripts/create-pull-request.js --action
   create --head <rama> [--base <rama>] --title "..." --body-file <md>`
   (el body en un archivo del scratchpad). Base: `main`, o la rama de la
   que depende si es un PR apilado (avisarlo en el body). El body cierra
   con la línea de atribución vigente.
5. **Merge a `main`: solo con confirmación explícita del usuario.**

Operaciones puntuales (fetch, estado, merge confirmado) pueden hacerse
con `git` directo. Nunca otro script para crear PRs.

## Salida

```
RAMA:
COMMITS: (hash + key de cada HU)
PUSH: Realizado | Fallido
PULL REQUEST: #N (base: ...)
ESTADO: Completado | Bloqueado (motivo)
```
