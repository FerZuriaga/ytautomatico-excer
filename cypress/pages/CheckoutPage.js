class CheckoutPage {

    // ─── Selectores - Checkout ────────────────────────────────────────────────

    get addressDetailsSection() {
        return cy.get('#address_delivery')
    }

    get reviewOrderSection() {
        return cy.get('#cart_info')
    }

    get commentTextArea() {
        return cy.get('textarea[name="message"]')
    }

    get placeOrderButton() {
        return cy.get('.btn.btn-default.check_out')
    }

    // ─── Selectores - Pago ────────────────────────────────────────────────────

    get nameOnCardInput() {
        return cy.get('[data-qa="name-on-card"]')
    }

    get cardNumberInput() {
        return cy.get('[data-qa="card-number"]')
    }

    get cvcInput() {
        return cy.get('[data-qa="cvc"]')
    }

    get expiryMonthInput() {
        return cy.get('[data-qa="expiry-month"]')
    }

    get expiryYearInput() {
        return cy.get('[data-qa="expiry-year"]')
    }

    get payConfirmButton() {
        return cy.get('[data-qa="pay-button"]')
    }

    get orderSuccessMessage() {
        return cy.get('[data-qa="order-placed"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyAddressAndOrderDetails() {
        this.addressDetailsSection.should('be.visible')
        this.reviewOrderSection.should('be.visible')
    }

    enterComment(comment) {
        this.commentTextArea.should('be.visible').type(comment)
    }

    clickPlaceOrder() {
        this.placeOrderButton.should('be.visible').click()
    }

    enterPaymentDetails(nameOnCard, cardNumber, cvc, expiryMonth, expiryYear) {
        this.nameOnCardInput.should('be.visible').type(nameOnCard)
        this.cardNumberInput.should('be.visible').type(cardNumber)
        this.cvcInput.should('be.visible').type(cvc)
        this.expiryMonthInput.should('be.visible').type(expiryMonth)
        this.expiryYearInput.should('be.visible').type(expiryYear)
    }

    clickPayAndConfirm() {
        this.payConfirmButton.should('be.visible').click()
    }

    verifyOrderPlaced() {
        this.orderSuccessMessage
            .should('be.visible')
            .and('contain.text', 'Order Placed!')
    }
}

export default CheckoutPage
