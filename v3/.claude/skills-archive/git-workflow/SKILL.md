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
- ejecutar pruebas automatizadas;
- crear tickets;
- modificar tickets;
- crear Pull Requests.

## ENTRADAS ESPERADAS

Este skill espera recibir:

- Ticket (User Story o Bug).
- Rama activa.
- Resultado exitoso de la ejecución de pruebas.
- Archivos listos para commit.

Si falta alguno de estos elementos, marcar `ESTADO: Bloqueado` en la
salida esperada e informar la limitación. Este skill no decide detener
el flujo, solo informa — la decisión es de QaAutomation1.

## Objetivo

Gestionar el flujo Git de una automatización una vez implementada y validada.

## Antes del commit

Verificar obligatoriamente:

- Las pruebas automatizadas ejecutaron correctamente.
- No existen errores críticos.
- Los archivos modificados pertenecen al ticket.
- No existen archivos temporales.
- No existen cambios accidentales.

Si alguna validación falla, marcar `ESTADO: Bloqueado`, informar el
problema y no generar commit.

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

El mecanismo oficial para crear Pull Requests es:

node scripts/create-pull-request.js

Este skill no necesita conocer con qué credenciales o API se comunica
internamente el script — eso es responsabilidad exclusiva del adapter
(ver mapeo Branch/PR en `domain-model.md`). Si el script informa que
falta una credencial o configuración necesaria, informar el problema y
esperar instrucciones del usuario; no proponer una herramienta
alternativa ni cambiar el mecanismo de integración sin autorización
explícita.

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

Si commit o push fallan, marcar `ESTADO: Bloqueado`, informar el error y
no generar el Pull Request. Este skill no decide detener el flujo, solo
informa.

---
## RESTRICCIONES

Este skill nunca debe:

- modificar archivos;
- ejecutar pruebas automatizadas;
- crear tickets;
- interactuar con ProductAgent;
- aprobar Pull Requests.

Finalizar una vez informado el resultado del flujo Git.

## SALIDA ESPERADA

Informar siempre:

RAMA_UTILIZADA:

COMMIT_GENERADO:

PUSH_REALIZADO:

ESTADO:

✔ Completado | ✘ Bloqueado

OBSERVACIONES:

## Herramientas oficiales

Política mixta: herramienta oficial para lo repetitivo, comando directo para lo puntual.

Usar una herramienta oficial (scripts/) cuando la operación:

- se repite regularmente en el flujo del proyecto (crear Pull Request, crear/actualizar tickets);
- requiere lógica no trivial (ej: evitar duplicados, formateo de descripción).

Usar un comando directo (git, la API REST del proveedor de repositorios, etc.) cuando la operación:

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