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
