import AutomationTestStoreSearchPage from '../../pages/automation-test-store/AutomationTestStoreSearchPage'

const searchPage = new AutomationTestStoreSearchPage()

describe('Automation Test Store - Buscar productos por palabra clave [SCRUM-203]', () => {
    const noResultsMessage = 'There is no product that matches the search criteria.'

    beforeEach(() => {
        searchPage.visitHome()
    })

    it('[CA-01][TC-01.1][SCRUM-205] busca con una palabra clave que coincide con productos reales', () => {
        searchPage.searchByKeyword('bronzer')
        cy.url().should('include', 'rt=product/search&keyword=bronzer')
        searchPage.verifyResultCount(3)
    })

    it('[CA-01][TC-01.2][SCRUM-206] filtra los resultados por una categoria que si contiene el producto', () => {
        searchPage.searchByKeyword('bronzer')
        searchPage.verifyResultCount(3)

        searchPage.filterResultsByCategory('0,36') // Makeup
        cy.url().should('include', 'category_id=0%2C36')
        searchPage.verifyResultCount(2)
    })

    it('[CA-02][TC-02.1][SCRUM-207] busca con una palabra clave inexistente y no muestra resultados', () => {
        searchPage.searchByKeyword('zzzzzznoexiste999')
        searchPage.verifyResultCount(0)
        searchPage.verifyNoResultsMessage(noResultsMessage)
    })

    it('[CA-02][TC-02.2][SCRUM-208] filtra por una categoria que no contiene el producto buscado', () => {
        searchPage.searchByKeyword('bronzer')
        searchPage.verifyResultCount(3)

        searchPage.filterResultsByCategory('0,65') // Books
        searchPage.verifyResultCount(0)
        searchPage.verifyNoResultsMessage(noResultsMessage)
    })

    it('[CA-02][TC-02.3][SCRUM-209] busca con el campo de palabra clave vacio', () => {
        searchPage.searchByKeyword('')
        searchPage.verifyResultCount(0)
        searchPage.verifyNoResultsMessage(noResultsMessage)
    })
})
