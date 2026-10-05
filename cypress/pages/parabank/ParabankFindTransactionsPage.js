const FIXTURE = 'selectors/parabank/movimientos.json'
const ACCOUNT_FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

// "Find Transactions": cuatro búsquedas (número, fecha, período, monto),
// cada una con su botón; el resultado reemplaza al formulario.
class ParabankFindTransactionsPage {

    // Desde la página de inicio con la sesión iniciada.
    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept('GET', sel.searchRequest).as('search')
            cy.intercept('GET', sel.idRequest).as('searchById')
            cy.fixture(ACCOUNT_FIXTURE).then(account => cy.gotoParabankUrl(account.paths.home))
            cy.get(sel.menuLink, T).click()
            cy.get(sel.form.title, T).invoke('text').should(t => expect(t.trim()).to.eq(sel.texts.title))
            cy.get(`${sel.form.account} option`, T).should('have.length.greaterThan', 0)
            cy.get(sel.form.id).should('have.value', '')
        })
    }

    // Un campo del formulario (clave de "form" en movimientos.json).
    type(field, value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form[field]).type(value)
            cy.get(sel.form[field]).should('have.value', value)
        })
    }

    // Botón de la búsqueda: "id", "date", "range" o "amount".
    search(kind) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.buttons[kind]).click())
    }

    // Exactamente estos movimientos ([{ description, debit }]) en "Transaction
    // Results". La fecha no se controla (bug SCRUM-938).
    verifyResults(expected) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.result.title, T).invoke('text').should(t => expect(t.trim()).to.eq(sel.texts.results))
            cy.get(sel.result.row, T).should('have.length', expected.length)
            cy.get(sel.result.row).then(rows => {
                const shown = [...rows].map(row => {
                    const cells = row.querySelectorAll('td')
                    return { description: cells[sel.result.descriptionCell].innerText.trim(), debit: cells[sel.result.debitCell].innerText.trim() }
                })
                const order = list => [...list].sort((a, b) => a.debit.localeCompare(b.debit))
                expect(order(shown)).to.deep.eq(order(expected))
            })
        })
    }

    verifyNoResults() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.result.title, T).should('be.visible')
            cy.get(sel.result.title).invoke('text').should(t => expect(t.trim()).to.eq(sel.texts.results))
            cy.get(sel.result.row).should('have.length', 0)
        })
    }

    // Aviso junto al campo de la búsqueda, formulario en pantalla y ninguna
    // búsqueda enviada.
    verifyError(kind) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.errors[kind]).should('have.text', sel.texts.errors[kind])
            cy.get(sel.form.container).should('be.visible')
            cy.get(sel.result.container).should('not.be.visible')
            cy.get('@search.all').should('have.length', 0)
            cy.get('@searchById.all').should('have.length', 0)
        })
    }
}

export default ParabankFindTransactionsPage
