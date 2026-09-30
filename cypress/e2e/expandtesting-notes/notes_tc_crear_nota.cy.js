// Modulo: Notas - Crear una nota
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-621 (CA-01..CA-05, Test Cycle SCRUM-622)
//
// Cada test registra su propio usuario por API (cada usuario ve solo sus
// notas) y entra a "My Notes" con la sesion iniciada y sin notas.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'

const notes = new NotesPage()

const MATERIALES = { category: 'Personal', title: 'Comprar materiales', description: 'Pintura, rodillos y cinta de enmascarar' }
const INFORME = { title: 'Informe mensual', description: 'Enviar el informe de ventas al equipo' }
const TITLE_100 = 'x'.repeat(100)
const DESCRIPTION_1000 = 'd'.repeat(1000)
const TITLE_101 = 'Lista de tareas pendientes para la reforma de la cocina y el bano principal de la casa de verano ya.s'

describe('Notas: crear una nota [SCRUM-621]', () => {

    beforeEach(() => {
        notes.prepareUser().then(user => notes.visitNotes(user))
    })

    it('[CA-01][TC-01.1][SCRUM-623] Debe crear una nota con titulo, descripcion y categoria', () => {
        notes.openForm()
        notes.fillForm(MATERIALES)
        notes.clickCreate()
        notes.verifyCreated().then(note => notes.verifyCard(note, MATERIALES))
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
    })

    it('[CA-01][TC-01.2][SCRUM-624] La nota creada debe seguir guardada al recargar la pagina', () => {
        notes.openForm()
        notes.fillForm(MATERIALES)
        notes.clickCreate()
        notes.verifyCreated().then(note => {
            notes.verifyCardTitle(MATERIALES.title)

            notes.reload()
            notes.verifyCard(note, MATERIALES)
        })
    })

    it('[CA-01][TC-01.3][SCRUM-625] Cancelar el formulario no debe crear la nota', () => {
        notes.openForm()
        notes.fillForm(MATERIALES)
        notes.clickCancel()
        notes.verifyNoNotes()
        cy.get('@createNote.all').should('have.length', 0)
    })

    it('[CA-02][TC-02.1][SCRUM-626] No debe crear una nota sin titulo ni descripcion', () => {
        notes.openForm()
        notes.clickCreate()
        notes.verifyRejected(['titleRequired', 'descriptionRequired'])
    })

    it('[CA-02][TC-02.2][SCRUM-627] No debe crear una nota con un titulo de 3 caracteres', () => {
        notes.openForm()
        notes.fillForm({ title: 'Pan', description: MATERIALES.description })
        notes.clickCreate()
        notes.verifyRejected(['titleLength'])
    })

    it('[CA-02][TC-02.3][SCRUM-628] No debe crear una nota con un titulo de 101 caracteres', () => {
        expect(TITLE_101).to.have.length(101)
        notes.openForm()
        notes.fillForm({ title: TITLE_101, description: MATERIALES.description })
        notes.clickCreate()
        notes.verifyRejected(['titleLength'])
    })

    it('[CA-02][TC-02.5][SCRUM-630] Debe aceptar un titulo de exactamente 4 caracteres', () => {
        notes.openForm()
        notes.fillForm({ title: 'Plan', description: MATERIALES.description })
        notes.clickCreate()
        notes.verifyCreated()
        notes.verifyCardTitle('Plan')
    })

    it('[CA-02][TC-02.6][SCRUM-741] Debe aceptar un titulo de exactamente 100 caracteres', () => {
        notes.openForm()
        notes.fillForm({ title: TITLE_100, description: MATERIALES.description })
        notes.clickCreate()
        notes.verifyCreated()
        notes.verifyCardTitle(TITLE_100)
    })

    it('[CA-03][TC-03.1][SCRUM-631] La nota de Work debe aparecer solo en la categoria Work', () => {
        notes.openForm()
        notes.fillForm({ category: 'Work', ...INFORME })
        notes.clickCreate()
        notes.verifyCreated()
        notes.verifyCardTitle(INFORME.title)

        notes.clickCategory('Work')
        notes.verifyCardTitle(INFORME.title)
        notes.verifyProgress('progressCategory', { done: 0, total: 1, category: 'work' })

        notes.clickCategory('Home')
        notes.verifyNoNotes('Home')
    })

    it('[CA-03][TC-03.2][SCRUM-632] Sin elegir categoria la nota debe quedar en Home', () => {
        notes.openForm()
        notes.fillForm({ title: MATERIALES.title, description: MATERIALES.description })
        notes.clickCreate()
        notes.verifyCreated()
        notes.verifyCardTitle(MATERIALES.title)

        notes.clickCategory('Home')
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyProgress('progressCategory', { done: 0, total: 1, category: 'home' })

        notes.clickCategory('Work')
        notes.verifyNoNotes('Work')
    })

    it('[CA-04][TC-04.1][SCRUM-633] Debe crear una nota ya completada', () => {
        notes.openForm()
        notes.fillForm(INFORME)
        notes.checkCompleted()
        notes.clickCreate()
        notes.verifyCreated()
        notes.verifyCardTitle(INFORME.title)
        notes.verifyCompletedSwitch(true)
        notes.verifyProgress('allCompleted')
    })

    it('[CA-04][TC-04.2][SCRUM-634] Una nota creada sin marcar Completed debe quedar pendiente', () => {
        notes.openForm()
        notes.fillForm(INFORME)
        notes.clickCreate()
        notes.verifyCreated()
        notes.verifyCardTitle(INFORME.title)
        notes.verifyCompletedSwitch(false)
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
    })

    it('[CA-05][TC-05.1][SCRUM-629] No debe crear una nota con una descripcion de 3 caracteres', () => {
        notes.openForm()
        notes.fillForm({ title: MATERIALES.title, description: 'Sal' })
        notes.clickCreate()
        notes.verifyRejected(['descriptionLength'])
    })

    it('[CA-05][TC-05.2][SCRUM-742] No debe crear una nota con una descripcion de 1001 caracteres', () => {
        notes.openForm()
        notes.fillForm({ title: MATERIALES.title, description: 'd'.repeat(1001) })
        notes.clickCreate()
        notes.verifyRejected(['descriptionLength'])
    })

    it('[CA-05][TC-05.3][SCRUM-743] Debe aceptar una descripcion de exactamente 4 caracteres', () => {
        notes.openForm()
        notes.fillForm({ title: MATERIALES.title, description: 'Pan!' })
        notes.clickCreate()
        notes.verifyCreated()
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyCardDescription('Pan!')
    })

    it('[CA-05][TC-05.4][SCRUM-744] Debe aceptar una descripcion de exactamente 1000 caracteres', () => {
        notes.openForm()
        notes.fillForm({ title: MATERIALES.title, description: DESCRIPTION_1000 })
        notes.clickCreate()
        notes.verifyCreated()
        notes.verifyCardTitle(MATERIALES.title)
        notes.verifyCardDescription(DESCRIPTION_1000)
    })
})
