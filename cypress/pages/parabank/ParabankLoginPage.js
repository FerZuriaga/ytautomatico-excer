const FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

// Panel "Customer Login" de la página de inicio y su resultado: el resumen
// de cuentas o la página "Error!".
class ParabankLoginPage {

    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoParabankUrl(sel.paths.home)
            cy.get(sel.login.panel, T).should('be.visible')
            cy.get(sel.login.username).should('have.value', '')
            cy.get(sel.login.password).should('have.value', '')
        })
    }

    typeUsername(username) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.login.username).type(username)
            cy.get(sel.login.username).should('have.value', username)
        })
    }

    typePassword(password) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.login.password).type(password, { log: false })
            cy.get(sel.login.password).should('have.value', password)
                .and('have.attr', 'type', 'password')
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.login.submit).click())
    }

    submitWithEnter() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.login.password).type('{enter}'))
    }

    // Resumen de cuentas del cliente: la tabla se completa después de la
    // carga, por eso se espera una fila con cuenta.
    verifyLoggedIn(customer) {
        cy.fixture(FIXTURE).then(sel => {
            cy.location('pathname', T).should('match', new RegExp(`${sel.paths.overview}$`))
            cy.get(sel.result.overviewTitle, T).invoke('text').should(t => expect(t.trim()).to.eq(sel.texts.overview))
            cy.get(sel.result.accountRow, T).should('have.length.greaterThan', 0)
            cy.get(sel.result.overviewError).should('not.be.visible')
            cy.get(sel.result.welcome).should('contain.text', `${customer.firstName} ${customer.lastName}`)
            cy.get(sel.result.logout).should('be.visible')
        })
    }

    verifyInvalidCredentials() {
        this.verifyRejected('loginInvalid')
    }

    verifyMissingCredentials() {
        this.verifyRejected('loginEmpty')
    }

    // Ingreso rechazado: página "Error!" con el aviso (clave de "texts") y
    // el panel de login todavía disponible (no hay sesión).
    verifyRejected(textKey) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.result.title, T).should('have.text', sel.texts.errorTitle)
            cy.get(sel.result.error).should('have.text', sel.texts[textKey])
            cy.get(sel.login.panel).should('be.visible')
            cy.get(sel.result.logout).should('not.exist')
        })
    }
}

export default ParabankLoginPage
