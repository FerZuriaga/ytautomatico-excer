class AutomationTestStoreCartPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get contentPanel() { return cy.get('.contentpanel') }
    get continueShoppingLink() { return this.contentPanel.find('a[title="Continue"]') }
    get productRows() { return cy.get('.cart-info table tbody tr') }
    get headerCartCount() { return cy.get('.topcart .label-orange') }
    get headerCartTotal() { return cy.get('.topcart .cart_total') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visit() {
        cy.gotoATSUrl('/index.php?rt=checkout/cart')
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyEmpty() {
        this.contentPanel.should('contain.text', 'Your shopping cart is empty!')
        this.headerCartCount.should('contain.text', '0')
        this.headerCartTotal.should('contain.text', '$0.00')
    }

    clickContinueShopping() {
        this.continueShoppingLink.click()
    }

    verifyRedirectedToHome() {
        cy.url().should('eq', `${Cypress.env('automationTestStoreUrl')}/`)
    }

    verifyHeaderCount(expectedItems, expectedTotal) {
        this.headerCartCount.should('contain.text', String(expectedItems))
        this.headerCartTotal.should('contain.text', expectedTotal)
    }

    verifyProductInCart(productName, expectedQuantity) {
        this.productRows.contains('td', productName)
            .closest('tr')
            .within(() => {
                cy.get('input[name^="quantity["]').should('have.value', String(expectedQuantity))
            })
    }

    verifyProductRowTotal(productName, expectedTotal) {
        this.productRows.contains('td', productName)
            .closest('tr')
            .find('td.align_right')
            .last()
            .should('contain.text', expectedTotal)
    }

    // ─── Editar cantidad / Quitar producto (consumen cypress/fixtures/selectors/carrito.json) ──

    updateQuantity(productId, quantity) {
        cy.fixture('selectors/carrito.json').then(sel => {
            cy.get(`input[name="quantity[${productId}]"]`).clear().type(String(quantity))
            cy.get(sel.updateButton).click()
        })
    }

    removeProduct(productId) {
        cy.get(`a[href*="remove=${productId}"]`).click()
    }

    verifyProductNotInCart(productName) {
        this.contentPanel.should('not.contain.text', productName)
    }

    verifySubTotal(expectedSubTotal) {
        cy.fixture('selectors/carrito.json').then(sel => {
            cy.contains(`${sel.totalsTable} td`, 'Sub-Total:').next().should('contain.text', expectedSubTotal)
        })
    }
}

export default AutomationTestStoreCartPage
