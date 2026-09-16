class AutomationTestStoreOrderLookupPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get orderIdInput() { return cy.get('#CheckOrderFrm_order_id') }
    get emailInput() { return cy.get('#CheckOrderFrm_email') }
    get submitButton() { return cy.get('#CheckOrderFrm button[type="submit"]') }
    get orderIdError() { return this.orderIdInput.closest('.form-group').find('.help-block') }
    get emailError() { return this.emailInput.closest('.form-group').find('.help-block') }
    get resultPanel() { return cy.get('.contentpanel') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visit() {
        cy.gotoATSUrl('/index.php?rt=account/invoice')
    }

    enterData(orderId, email) {
        this.orderIdInput.clear()
        if (orderId) this.orderIdInput.type(orderId, { parseSpecialCharSequences: false })

        this.emailInput.clear()
        if (email) this.emailInput.type(email, { parseSpecialCharSequences: false })
    }

    submit() {
        this.submitButton.click()
    }

    verifyOrderIdError(expectedText) {
        this.orderIdError.should('be.visible').and('contain.text', expectedText)
    }

    verifyEmailError(expectedText) {
        this.emailError.should('be.visible').and('contain.text', expectedText)
    }

    verifyNoOrderIdError() {
        this.orderIdInput.closest('.form-group').should('not.have.class', 'has-error')
    }

    verifyNoEmailError() {
        this.emailInput.closest('.form-group').should('not.have.class', 'has-error')
    }

    verifyNotFound() {
        this.resultPanel.should('contain.text', 'The order you have requested could not be found!')
        this.resultPanel.find('a[href="https://automationteststore.com/"]').should('be.visible')
    }
}

export default AutomationTestStoreOrderLookupPage
