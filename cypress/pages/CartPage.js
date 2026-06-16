class CartPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get cartLink() {
        return cy.get('.shop-menu ul li a[href*="cart"]')
    }

    get cartInfoTable() {
        return cy.get('#cart_info')
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
        cy.validateAEUrl('/view_cart')
        this.cartInfoTable.should('be.visible')
    }

    clickProceedToCheckout() {
        this.proceedToCheckoutButton.should('be.visible').click()
    }
}

export default CartPage
