// Test Case D-TC-BUSQUEDA - Busqueda de productos en Disco Online
// Sitio bajo prueba: https://www.disco.com.ar
// Ticket Jira: SCRUM-60
//
// Cubre los 5 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T54 a SCRUM-T58, Test Cycle SCRUM-R9), en 2 criterios de
// aceptacion atomicos:
// - CA-01 (Resultados relacionados ante una busqueda de producto): TC-01.1, TC-01.2, TC-01.3
// - CA-02 (Consistencia de la informacion mostrada en los resultados): TC-02.1, TC-02.2

import DiscoSearchPage from '../../pages/disco/DiscoSearchPage'

const searchPage = new DiscoSearchPage()

describe('D-TC-BUSQUEDA - Busqueda de productos en Disco Online [SCRUM-60]', () => {

    // El sitio arroja un error propio (JSON.parse) no relacionado a la
    // automatizacion; sin este handler Cypress corta la corrida en cada visita.
    Cypress.on('uncaught:exception', () => false)

    // retries: 2 en cada test porque el tiempo de carga de disco.com.ar
    // (sitio real de terceros) varia entre corridas; no es flakiness propia.

    beforeEach(() => {
        cy.gotoDiscoUrl('/')
        // Esperar a que la home hidrate del todo: si se escribe en el buscador
        // mientras el componente todavia esta montando, React lo re-renderiza
        // a mitad de tipeo y Cypress pierde la referencia al input.
        cy.wait(3000)
    })

    it('[CA-01][TC-01.1][SCRUM-T55] Debe mostrar resultados relacionados ante una busqueda con termino generico', { retries: 2 }, () => {
        searchPage.searchFor('leche')

        searchPage.verifyBreadcrumbShowsTerm('leche')
        searchPage.verifyResultsFound()
    })

    it('[CA-01][TC-01.2][SCRUM-T58] Debe mostrar productos ante una busqueda por marca especifica', { retries: 2 }, () => {
        searchPage.searchFor('Cuisine & Co')

        searchPage.verifyResultsFound()
    })

    it('[CA-01][TC-01.3][SCRUM-T57] Debe informar que no hay resultados ante un termino inexistente', { retries: 2 }, () => {
        searchPage.searchFor('asdfghjklqwerty123')

        searchPage.verifyNoResultsMessage()
    })

    it('[CA-02][TC-02.1][SCRUM-T56] Debe mostrar nombre, imagen y precio en cada resultado', { retries: 2 }, () => {
        searchPage.searchFor('leche')

        searchPage.verifyResultsFound()
        searchPage.verifyAllResultsHaveEssentialInfo()
    })

    it('[CA-02][TC-02.2][SCRUM-T54] Debe mostrar unicamente productos relacionados con el termino buscado', { retries: 2 }, () => {
        searchPage.searchFor('leche')

        searchPage.verifyResultsFound()
        searchPage.verifyAllResultsRelateToTerm('leche')
    })
})
