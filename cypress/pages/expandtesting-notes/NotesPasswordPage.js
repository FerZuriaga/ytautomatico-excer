const FIXTURE = 'selectors/expandtesting-notes/contrasena.json'

const T = { timeout: 15000 }

const FIELDS = ['current', 'new', 'confirm']

// Pestaña "Change password" de "Profile". Se entra con el perfil ya
// cargado (NotesProfilePage.openFromMenu).
class NotesPasswordPage {

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.changePasswordPath }).as('changePassword')
        })
    }

    openTab() {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.tabs.changePassword, T).click()
            this.verifyEmptyForm()
            cy.get(sel.form.submit).should('be.visible')
        })
    }

    verifyEmptyForm() {
        cy.fixture(FIXTURE).then(sel => {
            FIELDS.forEach(field => cy.get(sel.form[field], T).should('be.visible').and('have.value', ''))
        })
    }

    // field: current | new | confirm. El valor queda oculto.
    type(field, value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form[field]).type(value, { log: false })
                .should('have.value', value)
                .and('have.attr', 'type', 'password')
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    // Avisos del servidor por significado: es el motivo que devuelve el
    // servicio, no un texto copiado. En los dos casos los campos quedan
    // vacíos.
    verifyChanged() {
        this.verifyServerAnswer(200)
    }

    verifyRejectedByServer() {
        this.verifyServerAnswer(400)
    }

    verifyServerAnswer(status) {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@changePassword', T).then(({ response }) => {
                expect(response.statusCode, 'respuesta del cambio de contraseña').to.eq(status)
                cy.get(sel.form.alert, T).should('be.visible').and('have.text', response.body.message)
            })
            this.verifyEmptyForm()
        })
    }

    // Validación del formulario: aviso bajo el campo y ningún pedido de
    // cambio al servidor.
    verifyFieldError(field, textKey) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form[field]).should('have.class', 'is-invalid')
                .parent().find(sel.form.error).should('be.visible').and('have.text', sel.texts[textKey])
            cy.get('@changePassword.all').should('have.length', 0)
            cy.get(sel.form.alert).should('not.exist')
        })
    }
}

export default NotesPasswordPage
