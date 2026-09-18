class AutomationTestStoreSearchPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get quickKeywordInput() { return cy.get('#filter_keyword') }
    get quickSearchButton() { return cy.get('.button-in-search') }

    get refineKeywordInput() { return cy.get('#keyword') }
    get refineCategorySelect() { return cy.get('#category_id') }
    get refineSearchButton() { return cy.get('#search_button') }

    get resultItems() { return cy.get('.thumbnails .thumbnail') }
    get noResultsMessage() { return cy.contains('h4', 'Products meeting the search criteria').next() }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visitHome() {
        cy.gotoATSUrl('/')
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
