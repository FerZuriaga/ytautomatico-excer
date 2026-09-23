const FIXTURE = 'selectors/commitquality/catalogo-productos.json'

class CommitQualityProductListPage {

    // ─── Navegación ───────────────────────────────────────────────────────────

    visit() {
        cy.gotoCQUrl('/')
    }

    // ─── Acciones de filtro ───────────────────────────────────────────────────

    filterByName(text) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.filterInput).clear()
            if (text) cy.get(sel.filterInput).type(text)
            cy.get(sel.filterButton).click()
        })
    }

    clickReset() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.resetButton).click())
    }

    // ─── Acciones de paginación ────────────────────────────────────────────────

    clickShowMore() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.showMoreButton).click())
    }

    // ─── Acciones sobre un producto puntual ────────────────────────────────────

    clickEditForProduct(productId) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productRowPattern.replace('{id}', productId))
                .find(sel.editButton)
                .click()
        })
    }

    // Delete no pide confirmacion: borra al instante (solo en memoria).
    clickDeleteForProduct(productId) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productRowPattern.replace('{id}', productId))
                .find(sel.deleteButton)
                .click()
        })
    }

    clickAddProductLink() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.addProductLink).click())
    }

    // ─── Navegación por el menú (sin full reload de la SPA) ─────────────────────

    goToAddProductFromNavbar() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.navbarAddProductLink).click())
    }

    goToProductsFromNavbar() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.navbarProductsLink).click())
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyRowExists(productId) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productRowPattern.replace('{id}', productId)).should('be.visible')
        })
    }

    verifyRowNotExists(productId) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productRowPattern.replace('{id}', productId)).should('not.exist')
        })
    }

    verifyDeleteActionOnEveryRow(expectedCount) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productTable).find('tbody tr').should('have.length', expectedCount)
            cy.get(sel.productTable).find(sel.deleteButton).should('have.length', expectedCount)
        })
    }

    verifyNoDeleteActions() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productTable).find('tbody tr').should('have.length.greaterThan', 0)
            cy.get(sel.productTable).find('thead th').should('not.contain.text', 'Actions')
            cy.get(sel.deleteButton).should('not.exist')
        })
    }

    verifyRowCount(expectedCount) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productTable).find('tbody tr').should('have.length', expectedCount)
        })
    }

    verifyOnlyProductsNamed(expectedName) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productTable).find('tbody tr').each(row => {
                cy.wrap(row).find('[data-testid="name"]').should('have.text', expectedName)
            })
        })
    }

    verifyNoProductsMessage() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.noProductsMessage).should('be.visible').and('contain.text', 'No products found')
            cy.get(sel.productTable).should('not.exist')
        })
    }

    verifyShowMoreButtonVisible() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.showMoreButton).should('be.visible'))
    }

    verifyShowMoreButtonNotVisible() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.showMoreButton).should('not.exist'))
    }

    verifyProductRow(productId, { name, price, date }) {
        // Ojo: NO reusar un cy.get(...) guardado en una variable para
        // encadenar varios .find() -- el segundo .find() busca DENTRO del
        // elemento que dejo el primero (ej. dentro de la celda "name"),
        // no de nuevo desde la fila. Hay que re-consultar la fila fresca
        // para cada celda.
        cy.fixture(FIXTURE).then(sel => {
            const rowSelector = sel.productRowPattern.replace('{id}', productId)
            if (name !== undefined) cy.get(rowSelector).find('[data-testid="name"]').should('have.text', name)
            if (price !== undefined) cy.get(rowSelector).find('[data-testid="price"]').should('have.text', String(price))
            if (date !== undefined) cy.get(rowSelector).find('[data-testid="dateStocked"]').should('have.text', date)
        })
    }

    verifyProductNotPresent(productName) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productTable).should('not.contain.text', productName)
        })
    }

    verifyFilterInputEmpty() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.filterInput).should('have.value', ''))
    }

    verifyContainsProductNamed(expectedName) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productTable).should('contain.text', expectedName)
        })
    }
}

export default CommitQualityProductListPage
