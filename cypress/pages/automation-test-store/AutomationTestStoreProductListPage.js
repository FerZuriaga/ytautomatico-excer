class AutomationTestStoreProductListPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    quickAddToCartLink(productId) { return cy.get(`a.productcart[data-id="${productId}"]`) }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visitHome() {
        cy.gotoATSUrl('/')
    }

    quickAddToCart(productId) {
        this.quickAddToCartLink(productId).first().click()
    }
}

export default AutomationTestStoreProductListPage
