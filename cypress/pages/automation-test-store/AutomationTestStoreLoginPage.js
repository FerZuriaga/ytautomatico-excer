class AutomationTestStoreLoginPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get loginNameInput() { return cy.get('#loginFrm_loginname') }
    get passwordInput() { return cy.get('#loginFrm_password') }
    get loginButton() { return cy.get('#loginFrm button[type="submit"]') }
    get errorMessage() { return cy.get('.alert-danger') }
    get accountHeading() { return cy.get('h1.heading1') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyLoginFormVisible() {
        this.loginNameInput.should('be.visible')
        this.passwordInput.should('be.visible')
        this.loginButton.should('be.visible')
    }

    enterCredentials(loginName, password) {
        this.loginNameInput.clear()
        if (loginName) this.loginNameInput.type(loginName, { parseSpecialCharSequences: false })

        this.passwordInput.clear()
        if (password) this.passwordInput.type(password, { parseSpecialCharSequences: false })
    }

    clickLoginButton() {
        this.loginButton.click()
    }

    verifyLoggedIn() {
        cy.url({ timeout: 30000 }).should('include', 'rt=account/account')
        this.accountHeading.should('contain.text', 'My Account')
    }

    verifyStillOnLoginPage() {
        cy.url().should('include', 'rt=account/login')
        this.loginButton.should('be.visible')
    }

    verifyErrorMessage(expectedText) {
        this.errorMessage.should('be.visible').and('contain.text', expectedText)
    }
}

export default AutomationTestStoreLoginPage
