class OrangeHRMLoginPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get usernameInput() {
        return cy.get('input[name="username"]')
    }

    get passwordInput() {
        return cy.get('input[name="password"]')
    }

    get loginButton() {
        return cy.get('button[type="submit"]')
    }

    get dashboardMenu() {
        return cy.get('.oxd-main-menu')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyLoginFormVisible() {
        this.usernameInput.should('be.visible')
        this.passwordInput.should('be.visible')
        this.loginButton.should('be.visible')
    }

    enterCredentials(username, password) {
        this.usernameInput.should('be.visible').type(username)
        this.passwordInput.should('be.visible').type(password)
    }

    clickLoginButton() {
        this.loginButton.click()
    }

    verifyDashboardVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/dashboard/index')
        this.dashboardMenu.should('be.visible')
    }
}

export default OrangeHRMLoginPage
