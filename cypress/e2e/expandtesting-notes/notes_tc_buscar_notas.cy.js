// Modulo: Notas - Buscar notas
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-646 (CA-01..CA-03, Test Cycle SCRUM-647)
//
// Cada test registra su propio usuario por API, le crea sus notas por API y
// entra a "My Notes" con la sesion iniciada y la pestaña All activa.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'

const notes = new NotesPage()

const COMPRAR = { title: 'Comprar materiales', description: 'Pintura, rodillos y cinta de enmascarar', category: 'Home' }
const REUNION = { title: 'Reunion de equipo', description: 'Revisar presupuesto de pintura', category: 'Work' }
const TURNO = { title: 'Turno medico', description: 'Llevar estudios y recetas', category: 'Personal' }

const TRES = [COMPRAR, REUNION, TURNO]
const titles = list => list.map(n => n.title)

// Paso 1 de cada TC: "My Notes" con las notas de la precondicion.
const openWith = list => {
    notes.prepareUser().then(user => {
        notes.seedNotes(user, list)
        notes.visitNotesWith(user, titles(list))
        notes.verifySearchValue('')
    })
}

describe('Notas: buscar notas [SCRUM-646]', () => {

    it('[CA-01][TC-01.1][SCRUM-648] Buscar por una palabra del titulo debe mostrar solo esa nota', () => {
        openWith(TRES)
        notes.verifyProgress('progressAll', { done: 0, total: 3 })

        notes.typeSearch('reunion')
        notes.clickSearch()
        notes.verifySearchHeader('reunion')
        notes.verifyCardTitles([REUNION.title])
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
    })

    it('[CA-01][TC-01.2][SCRUM-649] Buscar en mayusculas debe encontrar las notas por su descripcion', () => {
        openWith(TRES)

        notes.typeSearch('PINTURA')
        notes.pressEnterInSearch()
        notes.verifySearchHeader('PINTURA')
        notes.verifyCardTitles([REUNION.title, COMPRAR.title])
        notes.verifyProgress('progressAll', { done: 0, total: 2 })
    })

    it('[CA-01][TC-01.3][SCRUM-650] Una busqueda sin coincidencias no debe mostrar notas', () => {
        openWith(TRES)

        notes.typeSearch('zzzz')
        notes.clickSearch()
        notes.verifyNoResults()
    })

    it('[CA-01][TC-01.4][SCRUM-651] Escribir sin confirmar la busqueda no debe filtrar la lista', () => {
        openWith(TRES)

        notes.typeSearch('zzzz')
        notes.verifyNoSearchRequest()
        notes.verifyCardTitles(titles(TRES))
        notes.verifyProgress('progressAll', { done: 0, total: 3 })
    })

    it.skip('[CA-01][TC-01.5][SCRUM-652] Buscar un texto con & debe mostrar solo las notas que lo contienen (bug conocido: SCRUM-658)', () => {
        const QUESO = { title: 'Pan & queso', description: 'Picada para la noche', category: 'Home' }
        const DULCE = { title: 'Pan dulce', description: 'Receta de la abuela', category: 'Home' }
        openWith([QUESO, DULCE])
        notes.verifyProgress('progressAll', { done: 0, total: 2 })

        notes.typeSearch(QUESO.title)
        notes.clickSearch()
        notes.verifyCardTitles([QUESO.title])
        notes.verifyProgress('progressAll', { done: 0, total: 1 })
    })

    it('[CA-02][TC-02.1][SCRUM-653] Buscar dentro de Work debe mostrar solo las coincidencias de Work', () => {
        openWith(TRES)

        notes.clickCategory('Work')
        notes.verifyCardTitles([REUNION.title])

        notes.typeSearch('pintura')
        notes.clickSearch()
        notes.verifySearchHeader('pintura')
        notes.verifyActiveCategory('Work')
        notes.verifyCardTitles([REUNION.title])
        notes.verifyProgress('progressCategory', { done: 0, total: 1, category: 'work' })
    })

    it('[CA-02][TC-02.2][SCRUM-654] Buscar en una categoria sin coincidencias no debe mostrar notas', () => {
        openWith(TRES)

        notes.clickCategory('Personal')
        notes.verifyCardTitles([TURNO.title])

        notes.typeSearch('pintura')
        notes.clickSearch()
        notes.verifyActiveCategory('Personal')
        notes.verifyNoResults('Personal')
    })

    it('[CA-02][TC-02.3][SCRUM-655] Cambiar de categoria despues de buscar debe seguir filtrando los resultados', () => {
        openWith(TRES)

        notes.typeSearch('pintura')
        notes.clickSearch()
        notes.verifyCardTitles([REUNION.title, COMPRAR.title])

        notes.clickCategory('Home')
        notes.verifyActiveCategory('Home')
        notes.verifySearchHeader('pintura')
        notes.verifyCardTitles([COMPRAR.title])
        notes.verifyProgress('progressCategory', { done: 0, total: 1, category: 'home' })
    })

    it('[CA-03][TC-03.1][SCRUM-656] Buscar con el campo vacio debe volver a mostrar todas las notas', () => {
        openWith(TRES)

        notes.typeSearch('reunion')
        notes.clickSearch()
        notes.verifyCardTitles([REUNION.title])

        notes.clearSearch()
        notes.clickSearch({ empty: true })
        notes.verifyNoSearchHeader()
        notes.verifyCardTitles(titles(TRES))
        notes.verifyProgress('progressAll', { done: 0, total: 3 })
    })

    it('[CA-03][TC-03.2][SCRUM-657] Enter con el campo vacio debe volver a todas las notas desde una busqueda sin resultados', () => {
        openWith(TRES)

        notes.typeSearch('zzzz')
        notes.clickSearch()
        notes.verifyNoResults()

        notes.clearSearch()
        notes.pressEnterInSearch({ empty: true })
        notes.verifyNoSearchHeader()
        notes.verifyCardTitles(titles(TRES))
        notes.verifyProgress('progressAll', { done: 0, total: 3 })
    })
})
