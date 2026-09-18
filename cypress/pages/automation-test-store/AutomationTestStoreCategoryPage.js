class AutomationTestStoreCategoryPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get sortSelect() { return cy.get('#sort') }
    // El sitio renderiza 2 grillas de productos (vista grid + vista list,
    // toggle #grid/#list) con la misma clase .prdocutname cada una -- la
    // oculta por CSS externo, no por atributo inline. Se filtra por
    // :visible para tomar solo la vista activa, sin asumir cual es.
    get productNames() { return cy.get('.prdocutname:visible') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visitCategory(pathId) {
        cy.gotoATSUrl(`/index.php?rt=product/category&path=${pathId}&limit=20`)
    }

    sortBy(sortValue) {
        this.sortSelect.select(sortValue)
    }

    verifyProductOrder(expectedNames) {
        this.productNames.should('have.length', expectedNames.length)
        this.productNames.then($els => {
            const actualNames = [...$els].map(el => el.getAttribute('title'))
            expect(actualNames).to.deep.equal(expectedNames)
        })
    }
}

export default AutomationTestStoreCategoryPage
