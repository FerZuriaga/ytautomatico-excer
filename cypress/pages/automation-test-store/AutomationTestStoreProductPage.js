class AutomationTestStoreProductPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get productName() { return cy.get('h1').first() }
    get quantityInput() { return cy.get('#product_quantity') }
    get addToCartLink() { return cy.get('#product a.cart') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visit(productId) {
        cy.gotoATSUrl(`/index.php?rt=product/product&product_id=${productId}`)
    }

    setQuantity(quantity) {
        this.quantityInput.clear().type(String(quantity))
    }

    addToCart() {
        this.addToCartLink.click()
    }
}

export default AutomationTestStoreProductPage
