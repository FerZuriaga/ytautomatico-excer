import ParabankOverviewPage from './ParabankOverviewPage'

const FIXTURE = 'selectors/parabank/transferencia.json'
const ACCOUNT_FIXTURE = 'selectors/parabank/cuenta.json'

const overview = new ParabankOverviewPage()

const T = { timeout: 15000 }

// "Transfer Funds" y el resumen de cuentas donde se ven sus efectos. Las
// cuentas se cargan por AJAX: se espera a que estén todas antes de operar.
class ParabankTransferPage {

    // Desde la página de inicio con la sesión iniciada; accounts = cuántas
    // cuentas tiene el cliente.
    open(accounts) {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept('POST', sel.transferRequest).as('transfer')
            cy.fixture(ACCOUNT_FIXTURE).then(account => cy.gotoParabankUrl(account.paths.home))
            cy.get(sel.menuLink, T).click()
            cy.get(sel.form.title, T).invoke('text').should(t => expect(t.trim()).to.eq(sel.texts.title))
            cy.get(`${sel.form.to} option`, T).should('have.length', accounts)
            cy.get(`${sel.form.from} option`).should('have.length', accounts)
            cy.get(sel.form.amount).should('have.value', '')
        })
    }

    typeAmount(amount) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.amount).type(amount)
            cy.get(sel.form.amount).should('have.value', amount)
        })
    }

    selectTo(accountId) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.to).select(String(accountId))
            cy.get(sel.form.to).should('have.value', String(accountId))
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    // "Transfer Complete!" con el importe ya formateado ("$25.50") y las cuentas.
    verifyComplete(amountText, from, to) {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@transfer').its('response.statusCode').should('eq', 200)
            cy.get(sel.result.title, T).should('have.text', sel.texts.complete)
            cy.get(sel.result.message).invoke('text').should(text => {
                expect(text.replace(/\s+/g, ' ').trim()).to.eq(`${amountText} has been transferred from account #${from} to account #${to}.`)
            })
        })
    }

    // La transferencia no se confirma (el mensaje que muestra la app en su
    // lugar es un bug aparte: SCRUM-899).
    verifyNotComplete() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@transfer')
            cy.get(sel.result.container).should('not.be.visible')
        })
    }

    openOverview() {
        overview.open()
    }

    verifyBalances(balances) {
        overview.verifyBalances(balances)
    }
}

export default ParabankTransferPage
