class SauceDemoProductsPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    getInventoryItem(productName) {
        return cy.contains('.inventory_item', productName)
    }

    get cartBadge() {
        return cy.get('.shopping_cart_badge')
    }

    get cartLink() {
        return cy.get('.shopping_cart_link')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    addProductToCart(productName) {
        this.getInventoryItem(productName).find('button').click()
    }

    removeProductFromCart(productName) {
        this.getInventoryItem(productName).find('button').click()
    }

    verifyCartBadgeCount(count) {
        this.cartBadge.should('be.visible').and('have.text', String(count))
    }

    verifyCartBadgeNotVisible() {
        this.cartBadge.should('not.exist')
    }

    goToCart() {
        this.cartLink.click()
    }
}

export default SauceDemoProductsPage
