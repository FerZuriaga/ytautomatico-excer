// Page Object Model - CheckoutPage
// Encapsula selectores y acciones del flujo de checkout y pago en automationexercise.com

class CheckoutPage {

    // ─── Selectores - Carrito ─────────────────────────────────────────────────

    get cartLink() {
        return cy.get('.shop-menu ul li a[href*="cart"]')
    }

    get cartInfoTable() {
        return cy.get('#cart_info')
    }

    get proceedToCheckoutBtn() {
        return cy.get('.btn.btn-default.check_out')
    }

    // ─── Selectores - Pagina de checkout ──────────────────────────────────────

    get deliveryAddressSection() {
        return cy.get('#address_delivery')
    }

    get billingAddressSection() {
        return cy.get('#address_invoice')
    }

    get orderCommentTextarea() {
        return cy.get('textarea.form-control')
    }

    get placeOrderBtn() {
        return cy.get('a.btn.btn-default.check_out')
    }

    // ─── Selectores - Formulario de pago ──────────────────────────────────────

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

    get payAndConfirmBtn() {
        return cy.get('[data-qa="pay-button"]')
    }

    // ─── Selectores - Confirmacion de orden ───────────────────────────────────

    get orderSuccessMessage() {
        return cy.get('[data-qa="order-placed"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Navega al carrito desde el menu de navegacion
    clickCartButton() {
        this.cartLink.click()
    }

    // Verifica que la pagina del carrito esta visible con al menos un producto
    verifyCartPageDisplayed() {
        cy.validateAEUrl('/view_cart')
        this.cartInfoTable.should('exist').and('be.visible')
    }

    // Hace click en "Proceed To Checkout"
    clickProceedToCheckout() {
        this.proceedToCheckoutBtn.click()
    }

    // Verifica que la seccion de direccion de entrega esta visible
    verifyAddressDetails() {
        this.deliveryAddressSection.should('be.visible')
        this.billingAddressSection.should('be.visible')
    }

    // Ingresa un comentario y hace click en "Place Order"
    enterCommentAndPlaceOrder(comment) {
        this.orderCommentTextarea.should('be.visible').type(comment)
        this.placeOrderBtn.click()
    }

    // Completa los datos de pago en el formulario
    fillPaymentDetails({ nameOnCard, cardNumber, cvc, expiryMonth, expiryYear }) {
        this.nameOnCardInput.should('be.visible').type(nameOnCard)
        this.cardNumberInput.should('be.visible').type(cardNumber)
        this.cvcInput.should('be.visible').type(cvc)
        this.expiryMonthInput.should('be.visible').type(expiryMonth)
        this.expiryYearInput.should('be.visible').type(expiryYear)
    }

    // Hace click en "Pay and Confirm Order"
    clickPayAndConfirm() {
        this.payAndConfirmBtn.click()
    }

    // Verifica el mensaje de confirmacion de orden exitosa
    verifyOrderPlacedSuccessfully() {
        this.orderSuccessMessage
            .should('be.visible')
            .and('have.text', 'Order Placed!')
    }
}

export default CheckoutPage
