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

    // Verifica que exactamente N productos esten en el carrito
    verifyCartHasProducts(count) {
        this.cartRows.should('have.length', count)
    }

    // Obtiene el precio de un producto por indice (0-based) desde la columna unit price
    getProductUnitPrice(index) {
        return cy.get('#cart_info_table tbody tr').eq(index).find('.cart_price p')
    }

    // Obtiene la cantidad de un producto por indice (0-based)
    getProductQuantity(index) {
        return cy.get('#cart_info_table tbody tr').eq(index).find('.cart_quantity button')
    }

    // Obtiene el total de un producto por indice (0-based)
    getProductTotal(index) {
        return cy.get('#cart_info_table tbody tr').eq(index).find('.cart_total p')
    }

    // Verifica que la cantidad de todos los productos en el carrito sea 1
    verifyAllProductsQuantityIsOne() {
        this.cartRows.each((row) => {
            cy.wrap(row).find('.cart_quantity button')
                .should('be.visible')
                .invoke('text')
                .then((text) => {
                    expect(text.trim()).to.eq('1')
                })
        })
    }

    // Verifica que el precio total de cada fila sea igual al precio unitario (cantidad=1)
    verifyProductTotalMatchesUnitPrice(index) {
        let unitPrice
        this.getProductUnitPrice(index)
            .invoke('text')
            .then((price) => {
                unitPrice = price.trim()
                return this.getProductTotal(index).invoke('text')
            })
            .then((total) => {
                expect(total.trim()).to.eq(unitPrice)
            })
    }
}

export default CartPage
