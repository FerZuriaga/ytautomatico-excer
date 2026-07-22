class SauceDemoCartPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get cartItems() {
        return cy.get('.cart_item')
    }

    get cartBadge() {
        return cy.get('.shopping_cart_badge')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyCartEmpty() {
        this.cartItems.should('not.exist')
        this.cartBadge.should('not.exist')
    }

    verifyProductInCart(productName, price) {
        cy.contains('.cart_item', productName).within(() => {
            cy.get('.inventory_item_name').should('have.text', productName)
            cy.get('.inventory_item_desc').should('be.visible').and('not.be.empty')
            cy.get('.inventory_item_price').should('have.text', price)
        })
    }

    removeProductFromCart(productName) {
        cy.contains('.cart_item', productName).find('button').click()
    }
}

export default SauceDemoCartPage
