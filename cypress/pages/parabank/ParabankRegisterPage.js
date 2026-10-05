const FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

// Datos personales válidos del formulario de alta (los que no son objeto
// de la prueba). El teléfono es opcional y va aparte.
const PERSONAL = {
    firstName: 'Qa',
    lastName: 'Parabank',
    street: 'Calle 123',
    city: 'Montevideo',
    state: 'MO',
    zipCode: '11000',
    ssn: '123-45-6789'
}

// Registro de un cliente nuevo ("Signing up is easy!"). Página renderizada
// en el servidor: cada envío recarga la pantalla con el resultado.
class ParabankRegisterPage {

    // Paso 1: desde la página de inicio, el enlace "Register" del panel de login.
    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoParabankUrl(sel.paths.home)
            cy.get(sel.login.registerLink, T).click()
            cy.contains(sel.result.title, sel.texts.registerTitle, T).should('be.visible')
            cy.get(sel.register.username).should('have.value', '')
            cy.get(sel.register.password).should('have.value', '')
        })
    }

    // Un campo del formulario (clave de "register" en el JSON).
    type(field, value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.register[field]).type(value, { log: !['password', 'confirm'].includes(field) })
            cy.get(sel.register[field]).should('have.value', value)
        })
    }

    fillPersonalData() {
        Object.entries(PERSONAL).forEach(([field, value]) => this.type(field, value))
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.register.submit).click())
    }

    // Alta correcta: bienvenida con el usuario, mensaje de alta y sesión
    // iniciada (menú con "Log Out").
    verifyRegistered(username) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.result.title, T).should('have.text', `Welcome ${username}`)
            cy.get(sel.result.message).should('have.text', sel.texts.registered)
            cy.get(sel.result.logout).should('be.visible')
        })
    }

    // Alta rechazada por datos obligatorios faltantes: el aviso de cada uno
    // y ninguno más (el teléfono es opcional).
    verifyMissing(fields) {
        cy.fixture(FIXTURE).then(sel => {
            this.verifyRejected(Object.fromEntries(fields.map(f => [f, sel.texts.required[f]])))
        })
    }

    verifyPasswordsMismatch() {
        cy.fixture(FIXTURE).then(sel => this.verifyRejected({ confirm: sel.texts.passwordsMismatch }))
    }

    verifyUsernameTaken() {
        cy.fixture(FIXTURE).then(sel => this.verifyRejected({ username: sel.texts.usernameTaken }))
    }

    // Exactamente los avisos esperados debajo de sus campos ({ campo: texto }),
    // el formulario sigue en pantalla y no hay sesión.
    verifyRejected(expectedErrors) {
        cy.fixture(FIXTURE).then(sel => {
            Object.entries(expectedErrors).forEach(([field, text]) => {
                cy.get(sel.register.errors[field], T).should('have.text', text)
            })
            cy.get(sel.register.fieldErrors).should('have.length', Object.keys(expectedErrors).length)
            cy.get(sel.register.form).should('be.visible')
            cy.get(sel.result.logout).should('not.exist')
        })
    }
}

export default ParabankRegisterPage
