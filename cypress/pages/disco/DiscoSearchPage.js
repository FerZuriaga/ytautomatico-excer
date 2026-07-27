class DiscoSearchPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get searchInput() {
        return cy.get('.vtex-store-components-3-x-searchBarContainer input', { timeout: 20000 })
    }

    get breadcrumb() {
        return cy.get('[data-testid="breadcrumb"]', { timeout: 20000 })
    }

    get galleryItems() {
        return cy.get('.discoargentina-cmedia-integration-cencosud-1-x-galleryItem .vtex-product-summary-2-x-container', { timeout: 20000 })
    }

    getProductName($item) {
        return cy.wrap($item).find('.vtex-product-summary-2-x-productBrand.vtex-product-summary-2-x-brandName')
    }

    getProductPrice($item) {
        return cy.wrap($item).find('#priceContainer')
    }

    getProductImage($item) {
        return cy.wrap($item).find('.vtex-product-summary-2-x-image')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    searchFor(term) {
        // Cada paso vuelve a consultar el input (getter) en vez de encadenar
        // sobre el mismo subject: el buscador re-renderiza al abrir el
        // autocompletado y una cadena unica termina operando sobre un nodo
        // ya desmontado. La espera corta tras el click deja asentar ese
        // primer re-render antes de tipear.
        this.searchInput.should('be.visible').click({ force: true })
        cy.wait(800)
        this.searchInput.type(term, { force: true, delay: 20 })
        this.searchInput.should('have.value', term, { timeout: 10000 })
        this.searchInput.type('{enter}', { force: true })
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyBreadcrumbShowsTerm(term) {
        this.breadcrumb.should('contain.text', term)
    }

    verifyResultsFound() {
        this.galleryItems.should('have.length.greaterThan', 0)
    }

    verifyNoResultsMessage() {
        cy.contains('esta góndola no tiene lo que', { timeout: 30000 }).should('be.visible')
    }

    verifyAllResultsHaveEssentialInfo() {
        this.galleryItems.each(($item) => {
            this.getProductName($item).should('not.be.empty')
            this.getProductPrice($item).should('not.be.empty')
            this.getProductImage($item).should('be.visible')
        })
    }

    verifyAllResultsRelateToTerm(term) {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const termRegex = new RegExp(escapedTerm, 'i')

        this.galleryItems.each(($item) => {
            this.getProductName($item).invoke('text').should('match', termRegex)
        })
    }
}

export default DiscoSearchPage
