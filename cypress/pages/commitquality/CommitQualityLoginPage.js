const FIXTURE = 'selectors/commitquality/login.json'

class CommitQualityLoginPage {

    // ─── Navegación ───────────────────────────────────────────────────────────

    visit() {
        cy.gotoCQUrl('/login')
    }

    // ─── Verificaciones de estado inicial ────────────────────────────────────

    verifyFormVisible() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.usernameInput).should('be.visible')
            cy.get(sel.passwordInput).should('be.visible')
            cy.get(sel.loginButton).should('be.visible')
        })
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    enterCredentials(username, password) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.usernameInput).clear()
            if (username) cy.get(sel.usernameInput).type(username)

            cy.get(sel.passwordInput).clear()
            if (password) cy.get(sel.passwordInput).type(password)
        })
    }

    clickLoginButton() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.loginButton).click())
    }

    login(username, password) {
        this.enterCredentials(username, password)
        this.clickLoginButton()
    }

    // ─── Verificaciones de resultado ──────────────────────────────────────────

    verifyLoggedIn() {
        cy.fixture(FIXTURE).then(sel => {
            cy.url().should('eq', `${Cypress.env('commitqualityUrl')}/`)
            cy.get(sel.navbarAccountLink).should('be.visible')
            cy.get(sel.navbarLogoutLink).should('be.visible')
        })
    }

    verifyStillLoggedOut() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navbarLoginLink).should('be.visible')
        })
    }

    verifyStillOnLoginPage() {
        cy.url().should('include', '/login')
    }

    verifyFieldsCleared() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.usernameInput).should('have.value', '')
            cy.get(sel.passwordInput).should('have.value', '')
        })
    }

    verifyErrorMessage(expectedText) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.errorMessage).should('be.visible').and('contain.text', expectedText)
        })
    }
}

export default CommitQualityLoginPage
