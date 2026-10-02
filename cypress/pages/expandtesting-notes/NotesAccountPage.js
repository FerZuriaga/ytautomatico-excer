const FIXTURE = 'selectors/expandtesting-notes/cuenta.json'

const T = { timeout: 15000 }

const JSON_HEADERS = { Accept: 'application/json' }

// Borrar la cuenta desde "Profile" (NotesProfilePage.openFromMenu). El
// diálogo de confirmación reusa los data-testid del borrado de notas.
class NotesAccountPage {

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'DELETE', hostname: sel.api.host, pathname: sel.api.deleteAccountPath }).as('deleteAccount')
        })
    }

    openDeleteDialog() {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.profile.deleteAccount, T).click()
            // La pregunta y la advertencia son dos elementos (sin espacio
            // entre ellos en el texto del diálogo).
            cy.get(sel.dialog.root, T).should('be.visible')
                .and('contain.text', sel.texts.question)
                .and('contain.text', sel.texts.warning)
            cy.get(sel.dialog.confirm).should('be.visible')
            cy.get(sel.dialog.cancel).should('be.visible')
            cy.get(sel.dialog.close).should('be.visible')
        })
    }

    // button: confirm | cancel | close
    clickDialog(button) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.dialog[button]).click())
    }

    verifyDeleted() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@deleteAccount', T).its('response.statusCode').should('eq', 200)
            cy.location('pathname', T).should('eq', sel.paths.login)
            cy.get(sel.alert, T).should('be.visible').and('have.text', sel.texts.deleted)
            cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
        })
    }

    // Diálogo cerrado sin borrar: ningún pedido y se sigue en el perfil con
    // la sesión.
    verifyNotDeleted() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.dialog.root).should('not.exist')
            cy.get('@deleteAccount.all').should('have.length', 0)
            cy.location('pathname').should('eq', sel.paths.profile)
            cy.get(sel.profile.deleteAccount).should('be.visible')
            cy.window().its('localStorage').invoke('getItem', 'token').should('be.a', 'string').and('not.be.empty')
        })
    }

    // La cuenta borrada desde otro dispositivo: la misma llamada que el
    // botón, con el token de la sesión.
    deleteByApi(user) {
        cy.fixture(FIXTURE).then(sel => {
            cy.request({ method: 'DELETE', url: `https://${sel.api.host}${sel.api.deleteAccountPath}`, headers: { ...JSON_HEADERS, 'x-auth-token': user.token } })
                .its('status').should('eq', 200)
        })
    }
}

export default NotesAccountPage
