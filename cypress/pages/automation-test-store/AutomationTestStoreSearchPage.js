class AutomationTestStoreSearchPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get quickKeywordInput() { return cy.get('#filter_keyword') }
    get quickSearchButton() { return cy.get('.button-in-search') }

    get refineKeywordInput() { return cy.get('#keyword') }
    get refineCategorySelect() { return cy.get('#category_id') }
    get refineSearchButton() { return cy.get('#search_button') }

    // El tema del sitio duplica cada producto en 2 grillas (vista grid +
    // vista list, mismo patron ya confirmado en AutomationTestStoreCategoryPage
    // con .prdocutname) -- se filtra por :visible para tomar solo la vista
    // activa. No afecta los conteos ya validados de SCRUM-203 (la vista
    // oculta se descarta igual).
    get resultItems() { return cy.get('.thumbnails .thumbnail:visible') }
    get noResultsMessage() { return cy.contains('h4', 'Products meeting the search criteria').next() }

    get limitSelect() { return cy.get('#limit') }
    get pagination() { return cy.get('.pagination') }
    pageLink(pageNumber) { return cy.get(`.pagination a[href*="page=${pageNumber}"]`) }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visitHome() {
        cy.gotoATSUrl('/')
    }

    visitSearchResults(keyword, { limit, page } = {}) {
        let url = `/index.php?rt=product/search&keyword=${encodeURIComponent(keyword)}&category_id=0`
        if (limit) url += `&limit=${limit}`
        if (page) url += `&page=${page}`
        cy.gotoATSUrl(url)
    }

    selectItemsPerPage(value) {
        this.limitSelect.select(value)
    }

    goToPage(pageNumber) {
        this.pageLink(pageNumber).first().click()
    }

    searchByKeyword(keyword) {
        this.quickKeywordInput.clear()
        if (keyword) this.quickKeywordInput.type(keyword)
        this.quickSearchButton.click()
    }

    // categoryValue es el "path" real del <option> (ej. "0,36" para Makeup),
    // no el id simple -- el select del refine form usa ese formato, distinto
    // del category_id simple que usa el buscador rapido de la home (ver
    // hallazgo "formatoCategoriaDistintoPorEntrada" en el JSON de selectores).
    filterResultsByCategory(categoryValue) {
        this.refineCategorySelect.select(categoryValue)
        this.refineSearchButton.click()
    }

    verifyResultCount(expectedCount) {
        this.resultItems.should('have.length', expectedCount)
    }

    verifyNoResultsMessage(expectedMessage) {
        this.noResultsMessage.should('contain.text', expectedMessage)
    }
}

export default AutomationTestStoreSearchPage
