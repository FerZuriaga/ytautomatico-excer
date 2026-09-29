// Modulo: Notas - Marcar notas como completadas o pendientes
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-659 (CA-01..CA-04, Test Cycle SCRUM-660)
//
// Cada test registra su propio usuario por API, le crea sus notas por API y
// entra a "My Notes" con la sesion iniciada y la pestaña All activa.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'

const notes = new NotesPage()

const PAGAR = { title: 'Pagar la luz', description: 'Factura de septiembre', category: 'Home' }
const INFORME = { title: 'Informe mensual', description: 'Enviar el informe de ventas al equipo', category: 'Work' }
const TURNO = { title: 'Turno medico', description: 'Llevar estudios y recetas', category: 'Personal' }
const REUNION = { title: 'Reunion de equipo', description: 'Preparar la agenda semanal', category: 'Work' }

// Precondicion comun: tres pendientes creadas en este orden (la mas
// reciente se muestra primero).
const TRES = [PAGAR, INFORME, TURNO]
const ORDEN_TRES = [TURNO.title, INFORME.title, PAGAR.title]

// Paso 1 de cada TC: "My Notes" con las notas de la precondicion.
const openWith = list => {
    notes.prepareUser().then(user => {
        notes.seedNotes(user, list)
        notes.visitNotesWith(user, list.map(n => n.title))
    })
}

const openTres = () => {
    openWith(TRES)
    notes.verifyCardOrder(ORDEN_TRES)
    ORDEN_TRES.forEach(title => notes.verifyCardCompleted(title, false))
    notes.verifyProgress('progressAll', { done: 0, total: 3 })
}

describe('Notas: marcar como completada o pendiente [SCRUM-659]', () => {

    it('[CA-01][TC-01.1][SCRUM-661] El interruptor debe marcar la nota pendiente como completada', () => {
        openWith([PAGAR])
        notes.verifyCardCompleted(PAGAR.title, false)
        notes.verifyProgress('progressAll', { done: 0, total: 1 })

        notes.toggleCompleted(PAGAR.title)
        notes.verifyCardCompleted(PAGAR.title, true)
        notes.verifyProgress('allCompleted')
    })

    it('[CA-01][TC-01.2][SCRUM-662] La nota completada debe seguir completada al recargar', () => {
        openWith([PAGAR])
        notes.verifyCardCompleted(PAGAR.title, false)

        notes.toggleCompleted(PAGAR.title)
        notes.verifyCardCompleted(PAGAR.title, true)

        notes.reload()
        notes.verifyCardCompleted(PAGAR.title, true)
        notes.verifyProgress('allCompleted')
    })

    it('[CA-01][TC-01.3][SCRUM-663] Completar una nota no debe cambiar el estado de las demas', () => {
        openTres()

        notes.toggleCompleted(TURNO.title)
        notes.verifyCardCompleted(TURNO.title, true)
        notes.verifyCardCompleted(INFORME.title, false)
        notes.verifyCardCompleted(PAGAR.title, false)
    })

    it('[CA-02][TC-02.1][SCRUM-664] El interruptor debe volver la nota completada a pendiente', () => {
        openWith([{ ...PAGAR, completed: true }])
        notes.verifyCardCompleted(PAGAR.title, true)
        notes.verifyProgress('allCompleted')

        notes.toggleCompleted(PAGAR.title)
        notes.verifyCardCompleted(PAGAR.title, false)
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
    })

    it('[CA-02][TC-02.2][SCRUM-665] La nota vuelta a pendiente debe seguir pendiente al recargar', () => {
        openWith([{ ...PAGAR, completed: true }])
        notes.verifyCardCompleted(PAGAR.title, true)

        notes.toggleCompleted(PAGAR.title)
        notes.verifyCardCompleted(PAGAR.title, false)

        notes.reload()
        notes.verifyCardCompleted(PAGAR.title, false)
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
    })

    it('[CA-03][TC-03.1][SCRUM-666] El resumen de todas las categorias debe contar la nota completada', () => {
        openTres()

        notes.toggleCompleted(TURNO.title)
        notes.verifyProgress('progressAll', { done: 1, total: 3 })
    })

    it('[CA-03][TC-03.2][SCRUM-667] El resumen de Work debe contar la nota completada de esa categoria', () => {
        openWith([PAGAR, INFORME, REUNION])
        notes.verifyProgress('progressAll', { done: 0, total: 3 })

        notes.clickCategory('Work')
        notes.verifyCardTitles([REUNION.title, INFORME.title])
        notes.verifyProgress('progressCategory', { done: 0, total: 2, category: 'work' })

        notes.toggleCompleted(REUNION.title)
        notes.verifyProgress('progressCategory', { done: 1, total: 2, category: 'work' })
    })

    it('[CA-03][TC-03.3][SCRUM-668] Al completar la ultima pendiente el resumen debe avisar que estan todas completadas', () => {
        openWith([{ ...PAGAR, completed: true }, INFORME])
        notes.verifyProgress('progressAll', { done: 1, total: 2 })

        notes.toggleCompleted(INFORME.title)
        notes.verifyProgress('allCompleted')
    })

    it('[CA-04][TC-04.1][SCRUM-669] La nota completada debe pasar al final de la lista', () => {
        openTres()

        notes.toggleCompleted(TURNO.title)
        notes.verifyCardOrder([INFORME.title, PAGAR.title, TURNO.title])
    })

    it('[CA-04][TC-04.2][SCRUM-670] La nota vuelta a pendiente debe pasar al principio de la lista', () => {
        openWith([{ ...PAGAR, completed: true }, INFORME, TURNO])
        notes.verifyCardOrder(ORDEN_TRES)
        notes.verifyProgress('progressAll', { done: 1, total: 3 })

        notes.toggleCompleted(PAGAR.title)
        notes.verifyCardOrder([PAGAR.title, TURNO.title, INFORME.title])
    })
})
