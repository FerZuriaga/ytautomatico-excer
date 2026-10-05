const FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

// Cierre de sesión y lo que queda disponible después: el menú "Account
// Services" (con "Log Out") solo existe con la sesión iniciada.
class ParabankSessionPage {

    // "Update Contact Info": pantalla de la cuenta que no depende del
    // listado de cuentas (caído en el entorno el 2026-10-05).
    openProfile() {
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoParabankUrl(sel.paths.home)
            cy.get(sel.profile.link, T).click()
            cy.get(sel.profile.title, T).should('have.text', sel.texts.updateProfile)
            cy.get(sel.profile.firstName, T).should('not.have.value', '')
            cy.get(sel.result.accountServices).should('have.text', sel.texts.accountServices)
            cy.get(sel.result.logout).should('be.visible')
        })
    }

    logout() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.result.logout).click())
    }

    // Página de inicio con el panel de login vacío y sin nada del cliente.
    verifyLoggedOut() {
        cy.fixture(FIXTURE).then(sel => {
            cy.location('pathname', T).should('match', new RegExp(`${sel.paths.home}$`))
            cy.get(sel.login.username, T).should('have.value', '')
            cy.get(sel.login.password).should('have.value', '')
            this.verifyNoCustomerData()
        })
    }

    // Página de la cuenta ("overview", "transfer", "openAccount") por
    // dirección. Sin sesión responde 500 (bug SCRUM-865): se acepta para
    // poder afirmar lo que el CA exige, que no haya datos del cliente.
    visitAccountPage(page) {
        cy.fixture(FIXTURE).then(sel => cy.gotoParabankUrl(sel.accountPages[page], { failOnStatusCode: false }))
    }

    // Ni saludo, ni menú "Account Services", ni "Log Out": solo el panel de
    // login. El mensaje de error interno no se afirma (bug SCRUM-865).
    verifyNoCustomerData() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.login.panel, T).should('be.visible')
            cy.get(sel.result.welcome).should('not.exist')
            cy.contains(sel.result.accountServices, sel.texts.accountServices).should('not.exist')
            cy.get(sel.result.logout).should('not.exist')
        })
    }
}

export default ParabankSessionPage
