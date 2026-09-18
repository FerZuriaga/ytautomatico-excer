class AutomationTestStoreForgottenLoginNamePage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get lastNameInput() { return cy.get('#forgottenFrm_lastname') }
    get emailInput() { return cy.get('#forgottenFrm_email') }
    get submitButton() { return cy.get('#forgottenFrm button[type="submit"], #forgottenFrm input[type="submit"]') }
    get message() { return cy.get('.alert') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visit() {
        cy.gotoATSUrl('/index.php?rt=account/forgotten/loginname')
    }

    enterData(lastName, email) {
        this.lastNameInput.clear()
        if (lastName) this.lastNameInput.type(lastName, { parseSpecialCharSequences: false })

        this.emailInput.clear()
        if (email) this.emailInput.type(email, { parseSpecialCharSequences: false })
    }

    submit() {
        this.submitButton.click()
    }

    verifySuccess() {
        cy.url({ timeout: 30000 }).should('include', 'rt=account/login')
        this.message.should('be.visible').and('contain.text', 'Your login name reminder has been sent to your e-mail address')
    }

    verifyStillOnForm() {
        cy.url().should('include', 'rt=account/forgotten/loginname')
        this.submitButton.should('be.visible')
    }

    verifyErrorMessage(expectedText) {
        this.message.should('be.visible').and('contain.text', expectedText)
    }
}

export default AutomationTestStoreForgottenLoginNamePage
