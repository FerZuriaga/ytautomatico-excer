const FIXTURE = 'selectors/parabank/prestamo.json'
const ACCOUNT_FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

// "Request Loan": monto, pie y cuenta de origen. La pantalla no valida; la
// aprobación la decide el banco y la respuesta reemplaza al formulario.
class ParabankLoanPage {

    // Desde la página de inicio con la sesión iniciada.
    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept('POST', sel.loanRequest).as('loan')
            cy.fixture(ACCOUNT_FIXTURE).then(account => cy.gotoParabankUrl(account.paths.home))
            cy.get(sel.menuLink, T).click()
            cy.get(sel.form.title, T).invoke('text').should(t => expect(t.trim()).to.eq(sel.texts.title))
            cy.get(`${sel.form.fromAccount} option`, T).should('have.length', 1)
            cy.get(sel.form.amount).should('have.value', '')
            cy.get(sel.form.downPayment).should('have.value', '')
        })
    }

    // "amount" o "downPayment".
    type(field, value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form[field]).type(value)
            cy.get(sel.form[field]).should('have.value', value)
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    // Número de la cuenta de origen (la única del cliente).
    fromAccount() {
        return cy.fixture(FIXTURE).then(sel => cy.get(sel.form.fromAccount).invoke('val'))
    }

    // "Approved" con el aviso y el número de la cuenta nueva, que devuelve.
    verifyApproved() {
        return cy.fixture(FIXTURE).then(sel => {
            cy.wait('@loan').its('response.statusCode').should('eq', 200)
            cy.get(sel.result.title, T).should('have.text', sel.texts.processed)
            cy.get(sel.result.status).should('have.text', sel.texts.approved)
            cy.get(sel.result.approvedMessage).should('have.text', sel.texts.congratulations)
            return cy.get(sel.result.newAccount).invoke('text').should('match', /^\d+$/)
        })
    }

    // "Denied" con el motivo (clave de "texts").
    verifyDenied(reasonKey) {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@loan')
            cy.get(sel.result.title, T).should('have.text', sel.texts.processed)
            cy.get(sel.result.status).should('have.text', sel.texts.denied)
            cy.get(sel.result.deniedMessage).should('have.text', sel.texts[reasonKey])
            cy.get(sel.result.approved).should('not.be.visible')
        })
    }

    // El préstamo no se otorga: ni "Approved" ni cuenta nueva. El mensaje
    // que muestra la app en su lugar es un bug aparte (SCRUM-958).
    verifyNotGranted() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@loan')
            cy.get(sel.result.approved).should('not.be.visible')
            cy.get(sel.result.newAccount).should('have.text', '')
        })
    }
}

export default ParabankLoanPage
