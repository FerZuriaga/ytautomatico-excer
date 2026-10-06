import ParabankActivityPage from './ParabankActivityPage'

const FIXTURE = 'selectors/parabank/abrir-cuenta.json'
const ACCOUNT_FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

const activity = new ParabankActivityPage()

// "Open New Account": tipo y cuenta de origen (listas, sin validación en la
// pantalla). La respuesta reemplaza al formulario.
class ParabankOpenAccountPage {

    // Desde la página de inicio con la sesión iniciada: CHECKING elegido y
    // las `accountCount` cuentas del cliente en la cuenta de origen.
    open(accountCount = 1) {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept('POST', sel.createRequest).as('openAccount')
            cy.fixture(ACCOUNT_FIXTURE).then(account => cy.gotoParabankUrl(account.paths.home))
            cy.get(sel.menuLink, T).click()
            cy.get(sel.form.title, T).invoke('text').should(t => expect(t.trim()).to.eq(sel.texts.title))
            cy.get(sel.form.type).find('option:selected').should('have.text', sel.texts.defaultType)
            cy.get(`${sel.form.fromAccount} option`, T).should('have.length', accountCount)
        })
    }

    // "CHECKING" o "SAVINGS".
    selectType(type) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.type).select(type)
            cy.get(sel.form.type).find('option:selected').should('have.text', type)
        })
    }

    selectFromAccount(accountId) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.fromAccount).select(String(accountId))
            cy.get(sel.form.fromAccount).should('have.value', String(accountId))
        })
    }

    // Número de la cuenta de origen elegida.
    fromAccount() {
        return cy.fixture(FIXTURE).then(sel => cy.get(sel.form.fromAccount).invoke('val'))
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    // "Account Opened!" con el aviso y el número de la cuenta nueva, que devuelve.
    verifyOpened() {
        return cy.fixture(FIXTURE).then(sel => {
            cy.wait('@openAccount').its('response.statusCode').should('eq', 200)
            cy.get(sel.result.title, T).should('have.text', sel.texts.opened)
            cy.get(sel.result.message).should('have.text', sel.texts.congratulations)
            return cy.get(sel.result.newAccount).invoke('text').should('match', /^\d+$/)
        })
    }

    // La cuenta no se abre: ni "Account Opened!" ni número de cuenta nueva.
    verifyNotOpened() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@openAccount')
            cy.get(sel.result.container).should('not.be.visible')
            cy.get(sel.result.newAccount).should('have.text', '')
        })
    }

    // Clic en el número de la cuenta nueva: "Account Details" con su tipo.
    verifyDetailsType(accountId, type) {
        activity.prepare()
        cy.fixture(FIXTURE).then(sel => cy.get(sel.result.newAccount).click())
        activity.verifyShown(accountId)
        activity.verifyType(type)
    }
}

export default ParabankOpenAccountPage
