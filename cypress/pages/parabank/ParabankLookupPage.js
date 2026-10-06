const FIXTURE = 'selectors/parabank/recuperar.json'
const ACCOUNT_FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

const FIELDS = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode', 'ssn']

// "Customer Lookup" ("Forgot login info?"): siete datos personales, se
// valida en el servidor y la respuesta reemplaza la página.
class ParabankLookupPage {

    // Desde la página de inicio sin sesión.
    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.fixture(ACCOUNT_FIXTURE).then(account => cy.gotoParabankUrl(account.paths.home))
            cy.get(sel.link, T).click()
            cy.get(sel.result.title, T).should('have.text', sel.texts.title)
            cy.get(sel.form.intro).should('have.text', sel.texts.intro)
            FIELDS.forEach(field => cy.get(sel.form[field]).should('have.value', ''))
        })
    }

    // { firstName, lastName, street, city, state, zipCode, ssn }: completa
    // los que vengan, cada uno en su campo.
    fill(data) {
        cy.fixture(FIXTURE).then(sel => {
            FIELDS.filter(field => data[field] !== undefined).forEach(field => {
                cy.get(sel.form[field]).type(data[field])
                cy.get(sel.form[field]).should('have.value', data[field])
            })
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    // Encontrado: el aviso con el usuario y la sesión iniciada (menú con
    // "Log Out"). La contraseña visible no se afirma (bug SCRUM-1001).
    verifyLocated(username) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.result.title, T).should('have.text', sel.texts.title)
            cy.get(sel.result.message).invoke('text').should(t => expect(t.trim()).to.eq(sel.texts.located))
            cy.get(sel.result.credentials).invoke('text').should('match', new RegExp(`Username\\s*:\\s*${username}\\b`))
        })
        cy.fixture(ACCOUNT_FIXTURE).then(account => cy.get(account.result.logout).should('be.visible'))
    }

    // "Error!" con el motivo y sin entrar a la banca.
    verifyNotFound() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.result.title, T).should('have.text', sel.texts.errorTitle)
            cy.get(sel.result.error).should('have.text', sel.texts.notFound)
        })
        cy.fixture(ACCOUNT_FIXTURE).then(account => {
            cy.get(account.login.panel).should('be.visible')
            cy.get(account.result.logout).should('not.exist')
        })
    }

    // Exactamente los avisos de esos campos y el formulario en pantalla.
    verifyRequired(fields) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.fieldErrors, T).should('have.length', fields.length)
            fields.forEach(field => cy.get(sel.form.errors[field]).should('have.text', sel.texts.required[field]))
            cy.get(sel.form.container).should('be.visible')
        })
        cy.fixture(ACCOUNT_FIXTURE).then(account => cy.get(account.result.logout).should('not.exist'))
    }
}

export default ParabankLookupPage
