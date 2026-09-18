import AutomationTestStoreSearchPage from '../../pages/automation-test-store/AutomationTestStoreSearchPage'

const searchPage = new AutomationTestStoreSearchPage()
const KEYWORD = 'a' // keyword de una sola letra: devuelve >50 productos reales del catalogo

describe('Automation Test Store - Paginacion y cantidad de productos por pagina', () => {
    it('[CA-01][TC-01.1][SCRUM-218] navega a la pagina siguiente del listado de resultados', () => {
        searchPage.visitSearchResults(KEYWORD)
        searchPage.verifyResultCount(20)

        searchPage.goToPage(2)
        cy.url().should('include', 'page=2')
        searchPage.verifyResultCount(20)
    })

    it('[CA-01][TC-01.2][SCRUM-219] vuelve a la pagina anterior del listado de resultados', () => {
        searchPage.visitSearchResults(KEYWORD, { limit: 20, page: 2 })
        searchPage.verifyResultCount(20)

        searchPage.goToPage(1)
        cy.url().should('include', 'page=1')
        searchPage.verifyResultCount(20)
    })

    it('[CA-02][TC-02.1][SCRUM-220] reduce la cantidad de productos por pagina a 10', () => {
        searchPage.visitSearchResults(KEYWORD)
        searchPage.verifyResultCount(20)

        searchPage.selectItemsPerPage('10')
        cy.url().should('include', 'limit=10')
        searchPage.verifyResultCount(10)
    })

    it('[CA-02][TC-02.2][SCRUM-221] aumenta la cantidad de productos por pagina a 50', () => {
        searchPage.visitSearchResults(KEYWORD, { limit: 10 })
        searchPage.verifyResultCount(10)

        searchPage.selectItemsPerPage('50')
        cy.url().should('include', 'limit=50')
        searchPage.verifyResultCount(50)
    })
})
