// Modulo: Notas - Borrar una nota
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-730 (CA-01..CA-02, Test Cycle SCRUM-731)
//
// Cada test registra su propio usuario por API, le crea sus notas por API y
// entra a "My Notes" con la sesion iniciada.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'

const notes = new NotesPage()

const MATERIALES = { title: 'Comprar materiales', description: 'Pintura, rodillos y cinta de enmascarar', category: 'Home' }
const PAGAR = { title: 'Pagar la luz', description: 'Factura de septiembre', category: 'Home' }
const INFORME = { title: 'Informe mensual', description: 'Enviar el informe de ventas al equipo', category: 'Work' }

// Paso 1 de cada TC: "My Notes" con las notas de la precondicion.
const openWith = list => {
    notes.prepareUser().then(user => {
        notes.seedNotes(user, list)
        notes.visitNotesWith(user, list.map(n => n.title))
    })
    notes.verifyProgress('progressAll', { done: 0, total: list.length })
}

// Pasos 1 y 2 de los TC con la nota de Home.
const deleteMateriales = () => {
    openWith([MATERIALES])
    notes.clickDelete(MATERIALES.title)
}

describe('Notas: borrar una nota [SCRUM-730]', () => {

    it('[CA-01][TC-01.1][SCRUM-732] Borrar una nota debe pedir confirmacion mostrando su titulo', () => {
        deleteMateriales()
        notes.verifyCardTitle(MATERIALES.title)
    })

    it('[CA-01][TC-01.2][SCRUM-733] Cancelar el borrado no debe eliminar la nota', () => {
        deleteMateriales()

        notes.dismissDelete('cancel')
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
    })

    it('[CA-01][TC-01.3][SCRUM-734] Cerrar el dialogo de confirmacion no debe eliminar la nota', () => {
        deleteMateriales()

        notes.dismissDelete('close')
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
    })

    it('[CA-02][TC-02.1][SCRUM-735] Confirmar el borrado de la unica nota debe dejar la lista vacia', () => {
        deleteMateriales()

        notes.confirmDelete()
        notes.verifyNoNotes()
    })

    it('[CA-02][TC-02.2][SCRUM-736] Borrar una de dos notas debe eliminar solo la elegida', () => {
        openWith([PAGAR, INFORME])
        notes.clickDelete(INFORME.title)

        notes.confirmDelete()
        notes.verifyCardTitle(PAGAR.title)
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
    })

    it('[CA-02][TC-02.3][SCRUM-737] La nota borrada no debe volver a aparecer al recargar la pagina', () => {
        deleteMateriales()
        notes.confirmDelete()
        notes.verifyNoNotes()

        notes.reload()
        notes.verifyNoNotes()
    })

    it('[CA-02][TC-02.4][SCRUM-738] Borrar la nota desde su vista de detalle debe volver a My Notes sin la nota', () => {
        openWith([MATERIALES])
        notes.openNoteView(MATERIALES)
        notes.clickDelete(MATERIALES.title)

        notes.confirmDelete()
        notes.verifyNoNotes()
    })
})
