class HomePage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get homeSlider() {
        return cy.get('#slider')
    }

    get subscriptionTitle() {
        return cy.contains(/subscription/i)
    }

    get subscriptionEmailInput() {
        return cy.get('#susbscribe_email')
    }

    get subscriptionSubmitBtn() {
        return cy.get('#subscribe')
    }

    get subscriptionSuccessMessage() {
        return cy.get('#success-subscribe')
    }

    get signupLoginBtn() {
        return cy.get('a[href="/login"]')
    }

    get contactUsLink() {
        return cy.get('a[href="/contact_us"]')
    }

    get cartBtn() {
        return cy.get('.shop-menu ul li a[href*="cart"]')
    }

    // Botón "Products" del menú de navegación (TC22)
    get productsBtn() {
        return cy.get('.navbar-nav a[href="/products"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyHomePageVisible() {
        this.homeSlider.should('be.visible')
    }

    scrollToFooter() {
        cy.get('#footer').scrollIntoView()
    }

    verifySubscriptionTitle() {
        this.subscriptionTitle.scrollIntoView().should('be.visible')
    }

    subscribeWithEmail(email) {
        this.subscriptionEmailInput.should('be.visible').type(email)
        this.subscriptionSubmitBtn.click()
    }

    verifySubscriptionSuccess() {
        this.subscriptionSuccessMessage
            .should('be.visible')
            .and('contain.text', 'You have been successfully subscribed!')
    }

    clickSignupLogin() {
        this.signupLoginBtn.click()
    }

    // Hace scroll hasta el final de la página (footer) usando el comando nativo de Cypress
    scrollToBottom() {
        cy.scrollTo('bottom')
    }

    // Verifica que el footer es visible
    verifyFooterVisible() {
        cy.get('#footer').should('be.visible')
    }

    // Hace scroll hacia arriba hasta el top de la página sin usar el botón de flecha
    scrollToTop() {
        cy.scrollTo('top')
    }

    // Verifica que el header/logo es visible en la parte superior de la página
    verifyHeaderVisible() {
        cy.get('#header').should('be.visible')
    }

    clickContactUs() {
        this.contactUsLink.should('be.visible').click()
    }

    clickCartButton() {
        this.cartBtn.click()
    }

    verifyCartPageVisible() {
        cy.validateAEUrl('/view_cart')
    }

    // Hace click en el botón "Products" del menú de navegación (TC22)
    clickProducts() {
        this.productsBtn.should('be.visible').click()
    }
}

export default HomePage
