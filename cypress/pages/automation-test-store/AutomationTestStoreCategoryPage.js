class AutomationTestStoreCategoryPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get sortSelect() { return cy.get('#sort') }
    // El sitio renderiza 2 grillas de productos (vista grid + vista list,
    // toggle #grid/#list) con la misma clase .prdocutname cada una -- la
    // oculta por CSS externo, no por atributo inline. Se filtra por
    // :visible para tomar solo la vista activa, sin asumir cual es.
    get productNames() { return cy.get('.prdocutname:visible') }
    // Misma plantilla de pantalla que usa la pagina de marca/fabricante
    // (rt=product/manufacturer): encabezado real y mensaje de "no
    // encontrado" cuando el id no corresponde a nada.
    get heading() { return cy.get('h1.heading1 .maintext') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visitCategory(pathId) {
        cy.gotoATSUrl(`/index.php?rt=product/category&path=${pathId}&limit=20`)
    }

    visitManufacturer(manufacturerId) {
        cy.gotoATSUrl(`/index.php?rt=product/manufacturer&manufacturer_id=${manufacturerId}`)
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
