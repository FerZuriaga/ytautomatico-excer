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

    // Alias de deliveryAddressSection (nombre usado en TC16)
    get addressDetailsSection() {
        return cy.get('#address_delivery')
    }

    get billingAddressSection() {
        return cy.get('#address_invoice')
    }

    // Seccion de revisión de la orden — mismo selector que cartInfoTable (TC16)
    get reviewOrderSection() {
        return cy.get('#cart_info')
    }

    get orderCommentTextarea() {
        return cy.get('textarea.form-control')
    }

    // Alias de orderCommentTextarea con selector por atributo name (TC16)
    get commentTextArea() {
        return cy.get('textarea[name="message"]')
    }

    get placeOrderBtn() {
        return cy.get('a.btn.btn-default.check_out')
    }

    // Alias de placeOrderBtn sin prefijo de tag (TC16)
    get placeOrderButton() {
        return cy.get('.btn.btn-default.check_out')
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

    // Alias de payAndConfirmBtn (nombre usado en TC16)
    get payConfirmButton() {
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

    // Verifica la seccion de direccion de entrega y la revision de la orden (TC16)
    verifyAddressAndOrderDetails() {
        this.addressDetailsSection.should('be.visible')
        this.reviewOrderSection.should('be.visible')
    }

    // Ingresa un comentario y hace click en "Place Order"
    enterCommentAndPlaceOrder(comment) {
        this.orderCommentTextarea.should('be.visible').type(comment)
        this.placeOrderBtn.click()
    }

    // Ingresa solo el comentario sin hacer click en Place Order (TC16)
    enterComment(comment) {
        this.commentTextArea.should('be.visible').type(comment)
    }

    // Hace click en "Place Order" (TC16)
    clickPlaceOrder() {
        this.placeOrderButton.should('be.visible').click()
    }

    // Completa los datos de pago — recibe un objeto desestructurado (TC15)
    fillPaymentDetails({ nameOnCard, cardNumber, cvc, expiryMonth, expiryYear }) {
        this.nameOnCardInput.should('be.visible').type(nameOnCard)
        this.cardNumberInput.should('be.visible').type(cardNumber)
        this.cvcInput.should('be.visible').type(cvc)
        this.expiryMonthInput.should('be.visible').type(expiryMonth)
        this.expiryYearInput.should('be.visible').type(expiryYear)
    }

    // Completa los datos de pago — recibe argumentos posicionales (TC16)
    enterPaymentDetails(nameOnCard, cardNumber, cvc, expiryMonth, expiryYear) {
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

    // Verifica el mensaje de confirmacion de orden exitosa con texto exacto (TC15)
    verifyOrderPlacedSuccessfully() {
        this.orderSuccessMessage
            .should('be.visible')
            .and('have.text', 'Order Placed!')
    }

    // Verifica el mensaje de confirmacion de orden exitosa con texto parcial (TC16)
    verifyOrderPlaced() {
        this.orderSuccessMessage
            .should('be.visible')
            .and('contain.text', 'Order Placed!')
    }

    // ─── Acciones — TC23 ─────────────────────────────────────────────────────

    // Alias de clickCartButton() con assert de visibilidad (TC23)
    clickCartLink() {
        this.cartLink.should('be.visible').click()
    }

    verifyDeliveryAddress(userData) {
        this.deliveryAddressSection.within(() => {
            cy.get('li').should('contain.text', userData.firstName)
            cy.get('li').should('contain.text', userData.lastName)
            cy.get('li').should('contain.text', userData.address)
            cy.get('li').should('contain.text', userData.city)
            cy.get('li').should('contain.text', userData.state)
            cy.get('li').should('contain.text', userData.zipcode)
            cy.get('li').should('contain.text', userData.country)
        })
    }

    verifyBillingAddress(userData) {
        this.billingAddressSection.within(() => {
            cy.get('li').should('contain.text', userData.firstName)
            cy.get('li').should('contain.text', userData.lastName)
            cy.get('li').should('contain.text', userData.address)
            cy.get('li').should('contain.text', userData.city)
            cy.get('li').should('contain.text', userData.state)
            cy.get('li').should('contain.text', userData.zipcode)
            cy.get('li').should('contain.text', userData.country)
        })
    }
}

export default CheckoutPage
