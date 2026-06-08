// Page Object Model - CartPage
// Encapsula selectores y acciones de la página de carrito de automationexercise.com

class CartPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get cartLink() {
        return cy.get('.shop-menu ul li a[href*="cart"]')
    }

    get cartInfoTable() {
        return cy.get('#cart_info')
    }

    get cartRows() {
        return cy.get('#cart_info_table tbody tr')
    }

    get proceedToCheckoutButton() {
        return cy.get('.col-sm-6 .check_out')
    }

    get registerLoginButton() {
        return cy.get('.modal-body a[href="/login"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    addFirstProductToCart() {
        cy.gotoAEUrl('/products')
        cy.get('.product-image-wrapper').first().within(() => {
            cy.get('.productinfo a').click()
        })
        cy.get('#cartModal .modal-confirm [data-dismiss="modal"]').click()
    }

    clickCartButton() {
        this.cartLink.click()
    }

    verifyCartPageDisplayed() {
        this.cartInfoTable.should('be.visible')
        cy.validateAEUrl('/view_cart')
    }

    clickProceedToCheckout() {
        this.proceedToCheckoutButton.should('be.visible').click()
    }

    clickRegisterLogin() {
        this.registerLoginButton.should('be.visible').click()
    }
}

export default CartPage
