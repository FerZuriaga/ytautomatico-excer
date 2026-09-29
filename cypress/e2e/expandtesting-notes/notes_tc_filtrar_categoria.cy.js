// Modulo: Notas - Filtrar notas por categoria
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-635 (CA-01..CA-03, Test Cycle SCRUM-636)
//
// Cada test registra su propio usuario por API, le crea sus notas por API y
// entra a "My Notes" con la sesion iniciada y la pestaña All activa.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'

const notes = new NotesPage()

const PAGAR = { title: 'Pagar la luz', description: 'Factura de septiembre', category: 'Home' }
const INFORME = { title: 'Informe mensual', description: 'Enviar el informe de ventas al equipo', category: 'Work', completed: true }
const REUNION = { title: 'Reunion de equipo', description: 'Preparar la agenda semanal', category: 'Work' }

const MIX = [PAGAR, INFORME, REUNION]
const titles = list => list.map(n => n.title)
const WORK = titles([INFORME, REUNION])

// Paso 1 de cada TC: "My Notes" con las notas de la precondicion.
const openWith = list => {
    notes.prepareUser().then(user => {
        notes.seedNotes(user, list)
        notes.visitNotesWith(user, titles(list))
    })
}

describe('Notas: filtrar por categoria [SCRUM-635]', () => {

    it('[CA-01][TC-01.1][SCRUM-637] La pestana Work debe mostrar solo las notas de Work', () => {
        openWith(MIX)
        notes.verifyProgress('progressAll', { done: 1, total: 3 })

        notes.clickCategory('Work')
        notes.verifyActiveCategory('Work')
        notes.verifyCardTitles(WORK)
    })

    it('[CA-01][TC-01.2][SCRUM-638] La pestana Home no debe mostrar las notas de otras categorias', () => {
        openWith(MIX)

        notes.clickCategory('Home')
        notes.verifyActiveCategory('Home')
        notes.verifyCardTitles([PAGAR.title])
    })

    it('[CA-01][TC-01.3][SCRUM-645] Volver a All debe mostrar todas las notas', () => {
        openWith(MIX)

        notes.clickCategory('Work')
        notes.verifyActiveCategory('Work')
        notes.verifyCardTitles(WORK)

        notes.clickCategory('All')
        notes.verifyActiveCategory('All')
        notes.verifyCardTitles(titles(MIX))
    })

    it('[CA-01][TC-01.4][SCRUM-639] Una categoria sin notas no debe mostrar tarjetas', () => {
        openWith(MIX)

        notes.clickCategory('Personal')
        notes.verifyActiveCategory('Personal')
        notes.verifyNoNotes('Personal')
        notes.verifyProgressHidden()
    })

    it('[CA-02][TC-02.1][SCRUM-640] El resumen de Work debe contar sus notas completadas', () => {
        openWith(MIX)

        notes.clickCategory('Work')
        notes.verifyActiveCategory('Work')
        notes.verifyProgress('progressCategory', { done: 1, total: 2, category: 'work' })
    })

    it('[CA-02][TC-02.2][SCRUM-641] El resumen debe avisar cuando todas las notas de la categoria estan completadas', () => {
        const list = [{ ...PAGAR, completed: true }, REUNION]
        openWith(list)
        notes.verifyProgress('progressAll', { done: 1, total: 2 })

        notes.clickCategory('Home')
        notes.verifyActiveCategory('Home')
        notes.verifyCardTitles([PAGAR.title])
        notes.verifyProgress('allCompletedCategory', { category: 'home' })
    })

    it('[CA-02][TC-02.3][SCRUM-642] Las notas completadas de otra categoria no deben contar en el resumen', () => {
        openWith(MIX)

        notes.clickCategory('Home')
        notes.verifyActiveCategory('Home')
        notes.verifyProgress('progressCategory', { done: 0, total: 1, category: 'home' })
    })

    it('[CA-03][TC-03.1][SCRUM-643] La categoria elegida debe seguir activa al recargar la pagina', () => {
        openWith(MIX)

        notes.clickCategory('Work')
        notes.verifyActiveCategory('Work')
        notes.verifyCardTitles(WORK)

        notes.reload()
        notes.verifyActiveCategory('Work')
        notes.verifyCardTitles(WORK)
        notes.verifyProgress('progressCategory', { done: 1, total: 2, category: 'work' })
    })

    it('[CA-03][TC-03.2][SCRUM-644] Despues de recargar, All debe volver a mostrar todas las notas', () => {
        openWith(MIX)

        notes.clickCategory('Work')
        notes.verifyActiveCategory('Work')
        notes.verifyCardTitles(WORK)

        notes.reload()
        notes.verifyActiveCategory('Work')
        notes.verifyCardTitles(WORK)

        notes.clickCategory('All')
        notes.verifyActiveCategory('All')
        notes.verifyCardTitles(titles(MIX))
        notes.verifyProgress('progressAll', { done: 1, total: 3 })
    })
})
