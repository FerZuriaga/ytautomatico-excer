// Modulo: Notas - Editar una nota
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-717 (CA-01..CA-04, Test Cycle SCRUM-718)
//
// Cada test registra su propio usuario por API, le crea una sola nota por API
// y entra a "My Notes" con la sesion iniciada.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'

const notes = new NotesPage()

const MATERIALES = { title: 'Comprar materiales', description: 'Pintura, rodillos y cinta de enmascarar', category: 'Home' }
const INFORME = { title: 'Informe mensual', description: 'Enviar el informe de ventas al equipo', category: 'Work' }

const NUEVO_TITULO = 'Comprar pintura blanca'
const NUEVA_DESCRIPCION = 'Dos latas de 4 litros'

// Paso 1 de cada TC: "My Notes" con la nota de la precondicion.
const openWith = note => {
    notes.prepareUser().then(user => {
        notes.seedNotes(user, [note])
        notes.visitNotesWith(user, [note.title])
    })
}

// Pasos 1 y 2 de los TC con la nota pendiente de Home.
const editMateriales = () => {
    openWith(MATERIALES)
    notes.openEditForm(MATERIALES)
}

describe('Notas: editar una nota [SCRUM-717]', () => {

    it('[CA-01][TC-01.1][SCRUM-719] El formulario de edicion debe mostrar los datos actuales de una nota de Work', () => {
        openWith(INFORME)
        notes.openEditForm(INFORME)
    })

    it('[CA-01][TC-01.2][SCRUM-720] El formulario de edicion debe mostrar marcada la casilla Completed de una nota completada', () => {
        openWith({ ...MATERIALES, completed: true })
        notes.verifyCardCompleted(MATERIALES.title, true)
        notes.openEditForm({ ...MATERIALES, completed: true })
    })

    it('[CA-02][TC-02.1][SCRUM-721] Guardar un titulo y una descripcion nuevos debe actualizar la tarjeta', () => {
        editMateriales()
        notes.cardUpdatedAt().then(before => {
            notes.replaceField('title', NUEVO_TITULO)
            notes.replaceField('description', NUEVA_DESCRIPCION)
            notes.clickSave()
            notes.verifySaved().then(saved => {
                notes.verifyCard(saved, { title: NUEVO_TITULO, description: NUEVA_DESCRIPCION })
                notes.cardUpdatedAt().should('not.eq', before)
            })
        })
    })

    it('[CA-02][TC-02.2][SCRUM-722] El titulo editado debe conservarse al recargar la pagina', () => {
        editMateriales()
        notes.replaceField('title', NUEVO_TITULO)
        notes.clickSave()
        notes.verifySaved()
        notes.verifyCardTitle(NUEVO_TITULO)

        notes.reload()
        notes.verifyCardTitle(NUEVO_TITULO)
        notes.verifyCardDescription(MATERIALES.description)
    })

    it('[CA-02][TC-02.3][SCRUM-723] Cambiar la categoria debe mover la nota a la pestaña de la nueva categoria', () => {
        editMateriales()
        notes.fillForm({ category: 'Work' })
        notes.clickSave()
        notes.verifySaved()
        notes.verifyCardTitle(MATERIALES.title)

        notes.clickCategory('Work')
        notes.verifyCardTitles([MATERIALES.title])
        notes.verifyProgress('progressCategory', { done: 0, total: 1, category: 'work' })

        notes.clickCategory('Home')
        notes.verifyNoNotes('Home')
    })

    it('[CA-02][TC-02.4][SCRUM-724] Marcar Completed al editar debe dejar la nota completada', () => {
        openWith(MATERIALES)
        notes.verifyCardCompleted(MATERIALES.title, false)
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
        notes.openEditForm(MATERIALES)

        notes.checkCompleted()
        notes.clickSave()
        notes.verifySaved()
        notes.verifyCardCompleted(MATERIALES.title, true)
        notes.verifyProgress('allCompleted')
    })

    it('[CA-02][TC-02.5][SCRUM-725] Cancelar la edicion no debe modificar la nota', () => {
        editMateriales()
        notes.replaceField('title', 'Titulo descartado')

        notes.clickCancel()
        notes.verifyNoUpdateRequest()
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyCardDescription(MATERIALES.description)
    })

    it('[CA-03][TC-03.1][SCRUM-726] No debe guardar la nota con el titulo vacio', () => {
        editMateriales()
        notes.replaceField('title')

        notes.clickSave()
        notes.verifyRejected(['titleRequired'], 'updateNote')
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyCardDescription(MATERIALES.description)
    })

    it('[CA-03][TC-03.2][SCRUM-727] No debe guardar la nota con un titulo de menos de 4 caracteres', () => {
        editMateriales()
        notes.replaceField('title', 'Pan')

        notes.clickSave()
        notes.verifyRejected(['titleLength'], 'updateNote')
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyCardDescription(MATERIALES.description)
    })

    it('[CA-04][TC-04.1][SCRUM-728] No debe guardar la nota con la descripcion vacia', () => {
        editMateriales()
        notes.replaceField('description')

        notes.clickSave()
        notes.verifyRejected(['descriptionRequired'], 'updateNote')
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyCardDescription(MATERIALES.description)
    })

    it('[CA-04][TC-04.2][SCRUM-729] No debe guardar la nota con una descripcion de menos de 4 caracteres', () => {
        editMateriales()
        notes.replaceField('description', 'Ok')

        notes.clickSave()
        notes.verifyRejected(['descriptionLength'], 'updateNote')
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyCardDescription(MATERIALES.description)
    })
})
