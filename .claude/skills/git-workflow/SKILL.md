---
name: "git-workflow"
description: "Gestiona el flujo Git una vez validada la automatización."
when:
  - después de una ejecución exitosa
  - antes de finalizar la automatización
---

## RESPONSABILIDADES

Este skill únicamente debe:

- Validar el estado del repositorio.
- Gestionar el commit.
- Gestionar el push.
- Verificar que la rama remota exista.
- Informar el resultado del flujo Git.

Nunca debe:

- modificar código;
- ejecutar Cypress;
- crear tickets Jira;
- modificar tickets Jira;
- crear Pull Requests.

## ENTRADAS ESPERADAS

Este skill espera recibir:

- Ticket Jira.
- Rama activa.
- Resultado exitoso de Cypress.
- Archivos listos para commit.

Si falta alguno de estos elementos:

- informar la limitación;
- detener el flujo.

## Objetivo

Gestionar el flujo Git de una automatización una vez implementada y validada.


## ENTRADAS ESPERADAS

Este skill espera recibir:

- Ticket Jira.
- Rama activa.
- Resultado exitoso de Cypress.
- Archivos listos para commit.

Si falta alguno de estos elementos:

- informar la limitación;
- detener el flujo.
## Antes del commit

Verificar obligatoriamente:

- Cypress ejecutó correctamente.
- No existen errores críticos.
- Los archivos modificados pertenecen al ticket.
- No existen archivos temporales.
- No existen cambios accidentales.

Si alguna validación falla:

- detener el flujo.
- informar el problema.
- no generar commit.

---

## Commit

Revisar los archivos modificados.

Confirmar que todos pertenecen al ticket actual.

Generar un commit descriptivo.

Formato recomendado:

```
[TICKET-ID] Resumen breve
```

Ejemplos:

```
[SCRUM-35] Add TC16 automation
[SCRUM-50] Add TC20 automation
```

Nunca utilizar mensajes ambiguos como:

- update
- fix
- changes
- ajustes

---

## Push

Luego del commit:

- realizar push de la rama correspondiente.
- verificar que el push finalizó correctamente.
- verificar que la rama existe en origin.

Informar siempre:

- Rama utilizada.
- Commit generado.
- Push realizado.

---

## Creación de Pull Requests

El mecanismo oficial del proyecto para crear Pull Requests es la API REST de GitHub utilizando el GITHUB_TOKEN definido en el archivo .env.

Orden de prioridad:

1. Utilizar GITHUB_TOKEN + GitHub REST API.
2. Si el token no existe, informar el problema.
3. No proponer instalar GitHub CLI (gh) salvo que el usuario solicite explícitamente cambiar la arquitectura.


El mecanismo oficial para crear Pull Requests es:

node scripts/create-pull-request.js

Nunca implementar otro script para crear Pull Requests.

Si el script oficial no soporta una funcionalidad necesaria:

- informar la limitación;
- no crear una implementación paralela;
- esperar instrucciones del usuario.

Antes del commit verificar que no existan archivos temporales dentro del repositorio.

Ejemplos:

- _tmp-*
- temp-*
- scratch.*
- test-*
- mock-*

Si existen:

- eliminarlos antes del commit;
- nunca incluirlos en Git.

## Si ocurre un error

Si commit o push fallan:

- detener el flujo.
- informar el error.
- no continuar con Pull Request.

---
## RESTRICCIONES

Este skill nunca debe:

- modificar archivos;
- ejecutar Cypress;
- crear tickets Jira;
- interactuar con ProductAgent;
- aprobar Pull Requests.

Finalizar una vez informado el resultado del flujo Git.

## SALIDA ESPERADA

Informar siempre:

RAMA_UTILIZADA:

COMMIT_GENERADO:

PUSH_REALIZADO:

ESTADO:

OBSERVACIONES:

## Herramientas oficiales

Política mixta: herramienta oficial para lo repetitivo, comando directo para lo puntual.

Usar una herramienta oficial (scripts/) cuando la operación:

- se repite regularmente en el flujo del proyecto (crear Pull Request, crear/actualizar tickets Jira);
- requiere lógica no trivial (ej: evitar duplicados, formateo de descripción).

Usar un comando directo (git, GitHub REST API vía GITHUB_TOKEN, etc.) cuando la operación:

- es puntual o poco frecuente (ej: mergear un Pull Request, consultar un estado, un fetch);
- no justifica el costo de mantener un script dedicado.

En ambos casos:

- nunca generar scripts temporales ni archivos de prueba dentro del repositorio;
- nunca duplicar una herramienta oficial ya existente para una responsabilidad que ya cubre.

Antes de proponer una nueva herramienta oficial, verificar si el proyecto ya dispone de una implementación para esa responsabilidad.

Orden obligatorio para lo repetitivo:

1. scripts/
2. Skills
3. Agentes
4. Herramientas configuradas (.env, APIs, MCP, etc.)

Las herramientas oficiales del proyecto forman parte de la infraestructura compartida. Antes de utilizarlas en tickets funcionales deberán encontrarse integradas en main. No utilizar herramientas experimentales pertenecientes a ramas de desarrollo, salvo autorización explícita del usuario.