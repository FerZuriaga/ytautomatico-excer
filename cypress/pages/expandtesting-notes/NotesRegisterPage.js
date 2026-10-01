const FIXTURE = 'selectors/expandtesting-notes/registro.json'

const T = { timeout: 15000 }

const FIELDS = ['email', 'name', 'password', 'confirmPassword']

// Pantalla "Register". Cada test usa un email nuevo (newEmail) y el
// navegador arranca sin sesión.
class NotesRegisterPage {

    newEmail() {
        return `qa.registro.${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`
    }

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.registerPath }).as('register')
        })
    }

    open() {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoNotesUrl(sel.paths.register)
            cy.contains('h1', sel.texts.title, T).should('be.visible')
            FIELDS.forEach(field => cy.get(sel.form[field], T).should('be.visible').and('have.value', ''))
            cy.get(sel.form.submit).should('be.visible')
        })
    }

    // Completa los campos que vienen en `data` ({ email, name, password,
    // confirmPassword }); los que no vienen quedan vacíos.
    fill(data) {
        cy.fixture(FIXTURE).then(sel => {
            FIELDS.filter(field => data[field] !== undefined).forEach(field => {
                const secret = /password/i.test(field)
                cy.get(sel.form[field]).type(data[field], { log: !secret }).should('have.value', data[field])
                if (secret) cy.get(sel.form[field]).should('have.attr', 'type', 'password')
            })
            FIELDS.forEach(field => cy.get(sel.form[field]).should('not.have.class', 'is-invalid'))
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    verifyCreated() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@register', T).its('response.statusCode').should('eq', 201)
            cy.get(sel.success.box, T).should('be.visible').and('contain.text', sel.texts.success)
            cy.get(sel.success.loginLink).should('be.visible').and('have.text', sel.texts.loginLink)
            cy.get(sel.form.submit).should('not.exist')
        })
    }

    // Crear la cuenta no inicia la sesión (regla de negocio de la HU).
    verifyNoSession() {
        cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
    }

    openLoginFromSuccess() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.success.loginLink).click()
            cy.location('pathname', T).should('eq', sel.paths.login)
        })
    }

    // Rechazo del servidor: el aviso es el motivo que devuelve el servicio
    // (no se copia el texto), no se crea la cuenta y el formulario sigue.
    verifyRejectedByServer() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@register', T).then(({ response }) => {
                expect(response.statusCode, 'email ya registrado').to.eq(409)
                cy.get(sel.form.alert, T).should('be.visible').and('have.text', response.body.message)
            })
            cy.get(sel.success.box).should('not.exist')
            cy.get(sel.form.submit).should('be.visible')
        })
    }

    // Validación del formulario: aviso bajo el campo, ningún pedido de
    // registro y el formulario sigue visible.
    verifyFieldError(field, textKey) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form[field]).should('have.class', 'is-invalid')
                .parent().find(sel.form.error).should('be.visible').and('have.text', sel.texts[textKey])
            cy.get('@register.all').should('have.length', 0)
            cy.get(sel.success.box).should('not.exist')
            cy.get(sel.form.submit).should('be.visible')
        })
    }
}

export default NotesRegisterPage
