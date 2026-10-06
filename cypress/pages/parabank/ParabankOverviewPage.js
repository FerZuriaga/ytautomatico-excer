const FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

// "Accounts Overview" desde el menú: donde se ven los efectos de una
// transferencia o un pago. La tabla se completa por AJAX.
class ParabankOverviewPage {

    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.overview.link).click()
            cy.get(sel.overview.row, T).should('have.length.greaterThan', 1)
        })
    }

    // Cantidad de cuentas del cliente (filas con número de cuenta; la de
    // "Total" no cuenta).
    verifyAccountCount(count) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.overview.accountLink).should('have.length', count))
    }

    // Abre el resumen y controla cantidad de cuentas y saldos.
    verifyAccounts(balances, count) {
        this.open()
        this.verifyAccountCount(count)
        this.verifyBalances(balances)
    }

    // { númeroDeCuenta: "$315.50" } en "Available Amount".
    verifyAvailable(amounts) {
        cy.fixture(FIXTURE).then(sel => {
            Object.entries(amounts).forEach(([account, amount]) => {
                cy.contains(sel.overview.row, account).find('td').eq(sel.overview.availableCell).should('have.text', amount)
            })
        })
    }

    // La fila "Total" (suma de los saldos).
    verifyTotal(total) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.overview.row, sel.overview.totalLabel).find('td').eq(sel.overview.balanceCell).should('have.text', total)
        })
    }

    // { númeroDeCuenta: "$315.50" } tal como lo muestra la tabla.
    verifyBalances(balances) {
        cy.fixture(FIXTURE).then(sel => {
            Object.entries(balances).forEach(([account, balance]) => {
                cy.contains(sel.overview.row, account).find('td').eq(sel.overview.balanceCell).should('have.text', balance)
            })
        })
    }
}

export default ParabankOverviewPage
