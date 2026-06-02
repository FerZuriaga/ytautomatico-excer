// Page Object Model - CheckoutPage
// Encapsula selectores y acciones de la pagina de checkout de automationexercise.com

class CheckoutPage {

    // ─── Selectores - Carrito ─────────────────────────────────────────────────

    get cartLink() {
        return cy.get('.shop-menu ul li a[href="/view_cart"]')
    }

    get proceedToCheckoutBtn() {
        return cy.get('.btn.btn-default.check_out')
    }

    // ─── Selectores - Direcciones en checkout ────────────────────────────────

    // Bloque completo de delivery address
    get deliveryAddressSection() {
        return cy.get('#address_delivery')
    }

    // Bloque completo de billing address
    get billingAddressSection() {
        return cy.get('#address_invoice')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    clickCartLink() {
        this.cartLink.should('be.visible').click()
    }

    verifyCartPageDisplayed() {
        cy.validateAEUrl('/view_cart')
        cy.get('#cart_info').should('exist').and('be.visible')
    }

    clickProceedToCheckout() {
        this.proceedToCheckoutBtn.should('be.visible').click()
    }

    /**
     * Verifica que la seccion de delivery address contenga los datos del usuario.
     * @param {Object} userData - Objeto con firstName, lastName, address1, city, state, zipcode, country, mobile
     */
    verifyDeliveryAddress(userData) {
        this.deliveryAddressSection.within(() => {
            cy.get('li').should('contain.text', userData.firstName)
            cy.get('li').should('contain.text', userData.lastName)
            cy.get('li').should('contain.text', userData.address1)
            cy.get('li').should('contain.text', userData.city)
            cy.get('li').should('contain.text', userData.state)
            cy.get('li').should('contain.text', userData.zipcode)
            cy.get('li').should('contain.text', userData.country)
        })
    }

    /**
     * Verifica que la seccion de billing address contenga los datos del usuario.
     * @param {Object} userData - Objeto con firstName, lastName, address1, city, state, zipcode, country, mobile
     */
    verifyBillingAddress(userData) {
        this.billingAddressSection.within(() => {
            cy.get('li').should('contain.text', userData.firstName)
            cy.get('li').should('contain.text', userData.lastName)
            cy.get('li').should('contain.text', userData.address1)
            cy.get('li').should('contain.text', userData.city)
            cy.get('li').should('contain.text', userData.state)
            cy.get('li').should('contain.text', userData.zipcode)
            cy.get('li').should('contain.text', userData.country)
        })
    }
}

export default CheckoutPage
