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

    // Enlace al carrito en el menú de navegación (TC16)
    get cartLink() {
        return cy.get('.shop-menu ul li a[href*="cart"]')
    }

    // Botón "Proceed To Checkout" en la página del carrito (TC16)
    get proceedToCheckoutButton() {
        return cy.get('.col-sm-6 .check_out')
    }

    // Enlace "Register / Login" en el modal de checkout (TC16)
    get registerLoginButton() {
        return cy.get('.modal-body a[href="/login"]')
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

    // ─── API granular por índice (TC12) ───────────────────────────────────────

    // Retorna la celda de precio unitario del producto en la posicion dada (0-based)
    getProductUnitPrice(index) {
        return cy.get('#cart_info_table tbody tr').eq(index).find('.cart_price p')
    }

    // Retorna la celda de cantidad del producto en la posicion dada (0-based)
    getProductQuantity(index) {
        return cy.get('#cart_info_table tbody tr').eq(index).find('.cart_quantity button')
    }

    // Retorna la celda de total del producto en la posicion dada (0-based)
    getProductTotal(index) {
        return cy.get('#cart_info_table tbody tr').eq(index).find('.cart_total p')
    }

    // Verifica que el carrito tenga exactamente N productos
    verifyCartHasProducts(count) {
        this.cartRows.should('have.length', count)
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

    // Verifica que el total de la fila en el indice dado sea igual al precio unitario (cantidad=1)
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

    // ─── Acciones de navegación y carrito (TC16) ──────────────────────────────

    // Navega a /products, agrega el primer producto al carrito y cierra el modal
    addFirstProductToCart() {
        cy.gotoAEUrl('/products')
        cy.get('.product-image-wrapper').first().within(() => {
            cy.get('.productinfo a').click()
        })
        cy.get('#cartModal .modal-confirm [data-dismiss="modal"]').click()
    }

    // Hace click en el enlace del carrito en el menú de navegación (TC16)
    clickCartButton() {
        this.cartLink.click()
    }

    // Verifica que la página del carrito sea visible usando el contenedor #cart_info.
    // Usa selector explícito para no colisionar con cartInfoTable (#cart_info_table) de TC12/TC13.
    verifyCartPageDisplayed() {
        cy.validateAEUrl('/view_cart')
        cy.get('#cart_info').should('exist').and('be.visible')
    }

    // Hace click en "Proceed To Checkout" desde la página del carrito (TC16)
    clickProceedToCheckout() {
        this.proceedToCheckoutButton.should('be.visible').click()
    }
}

export default CartPage
