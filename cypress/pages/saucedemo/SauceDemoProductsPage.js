class SauceDemoProductsPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    getInventoryItem(productName) {
        return cy.contains('.inventory_item', productName)
    }

    get inventoryItems() {
        return cy.get('.inventory_item')
    }

    get productNames() {
        return cy.get('.inventory_item_name')
    }

    get sortDropdown() {
        return cy.get('[data-test="product-sort-container"]')
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

    selectProduct(productName) {
        this.getInventoryItem(productName).find('.inventory_item_name').click()
    }

    verifyProductCount(count) {
        this.inventoryItems.should('have.length', count)
    }

    verifyAllProductsHaveCompleteInfo() {
        this.inventoryItems.each(($item) => {
            cy.wrap($item).find('.inventory_item_name').should('not.be.empty')
            cy.wrap($item).find('.inventory_item_price').should('not.be.empty')
            cy.wrap($item).find('img').should('be.visible')
        })
    }

    getProductPrice(productName) {
        return this.getInventoryItem(productName).find('.inventory_item_price')
    }

    selectSortOption(value) {
        this.sortDropdown.select(value)
    }

    verifySortedAscendingByName() {
        this.productNames.then(($els) => {
            const names = [...$els].map((el) => el.textContent)
            const sortedNames = [...names].sort((a, b) => a.localeCompare(b))
            expect(names).to.deep.equal(sortedNames)
        })
    }
}

export default SauceDemoProductsPage
