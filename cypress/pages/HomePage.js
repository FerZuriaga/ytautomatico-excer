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
}

export default HomePage
