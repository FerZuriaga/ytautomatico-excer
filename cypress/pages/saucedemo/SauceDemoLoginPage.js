class SauceDemoLoginPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get usernameInput() {
        return cy.get('#user-name')
    }

    get passwordInput() {
        return cy.get('#password')
    }

    get loginButton() {
        return cy.get('#login-button')
    }

    get inventoryContainer() {
        return cy.get('.inventory_container')
    }

    get errorMessage() {
        return cy.get('[data-test="error"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyLoginFormVisible() {
        this.usernameInput.should('be.visible')
        this.passwordInput.should('be.visible')
        this.loginButton.should('be.visible')
    }

    enterCredentials(username, password) {
        this.usernameInput.should('be.visible').clear().type(username)
        this.passwordInput.should('be.visible').clear().type(password)
    }

    clickLoginButton() {
        this.loginButton.click()
    }

    verifyInventoryVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/inventory.html')
        this.inventoryContainer.should('be.visible')
    }

    verifyStillOnLoginPage() {
        cy.location('pathname').should('eq', '/')
        this.loginButton.should('be.visible')
    }

    verifyErrorMessage(expectedText) {
        this.errorMessage.should('be.visible').and('contain.text', expectedText)
    }
}

export default SauceDemoLoginPage
