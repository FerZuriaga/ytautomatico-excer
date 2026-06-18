// Page Object Model - CartPage
// Encapsula selectores y acciones de la pagina del carrito de compras

class CartPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    // Tabla con los productos en el carrito
    get cartInfoTable() {
        return cy.get('#cart_info_table')
    }

    // Filas de productos en el carrito
    get cartRows() {
        return cy.get('#cart_info_table tbody tr')
    }

    // Cantidad del primer producto en el carrito
    get firstProductQuantity() {
        return cy.get('#cart_info_table tbody tr').first().find('.cart_quantity')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Verifica que la pagina del carrito sea visible
    verifyCartPageVisible() {
        this.cartInfoTable.should('exist').and('be.visible')
        cy.url().should('include', '/view_cart')
    }

    // Verifica que el primer producto en el carrito tenga la cantidad esperada
    verifyProductQuantity(expectedQuantity) {
        this.firstProductQuantity
            .should('be.visible')
            .invoke('text')
            .then((text) => {
                expect(text.trim()).to.eq(String(expectedQuantity))
            })
    }

    // Verifica que haya al menos un producto en el carrito
    verifyCartNotEmpty() {
        this.cartRows.should('have.length.gte', 1)
    }
}

export default CartPage
