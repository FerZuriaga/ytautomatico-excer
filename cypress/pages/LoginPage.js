class LoginPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get loginTitle() {
        return cy.contains('Login to your account')
    }

    get loginEmailInput() {
        return cy.get('[data-qa="login-email"]')
    }

    get loginPasswordInput() {
        return cy.get('[data-qa="login-password"]')
    }

    get loginButton() {
        return cy.get('[data-qa="login-button"]')
    }

    get loggedInLabel() {
        return cy.get('.shop-menu li a').last()
    }

    get logoutButton() {
        return cy.get('li [href="/logout"]')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    verifyLoginFormVisible() {
        this.loginTitle.should('be.visible')
    }

    enterCredentials(email, password) {
        this.loginEmailInput.should('be.visible').type(email)
        this.loginPasswordInput.should('be.visible').type(password)
    }

    clickLoginButton() {
        this.loginButton.click()
    }

    verifyLoggedIn(username) {
        this.loggedInLabel.should('contain.text', `Logged in as ${username}`)
    }

    clickLogout() {
        this.logoutButton.click()
    }
}

export default LoginPage
