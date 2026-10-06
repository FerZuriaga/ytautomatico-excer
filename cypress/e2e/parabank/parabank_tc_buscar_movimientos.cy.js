// Modulo: Banca - Buscar movimientos de mi cuenta
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-922 (CA-23..CA-25, Test Cycle SCRUM-923)
//
// Las búsquedas solo leen: el cliente y sus movimientos se preparan una
// sola vez por API (la demo limita la cantidad de pedidos) y cada test
// inicia sesión con ese cliente. La cuenta inicial tiene dos débitos
// "Funds Transfer Sent": $100.00 (al abrir la segunda cuenta) y $25.50.

import ParabankFindTransactionsPage from '../../pages/parabank/ParabankFindTransactionsPage'

const find = new ParabankFindTransactionsPage()

const SENT = 'Funds Transfer Sent'
const BOTH = [{ description: SENT, debit: '$100.00' }, { description: SENT, debit: '$25.50' }]
const ONLY_25 = [{ description: SENT, debit: '$25.50' }]

let customer
let transactions

// Cliente con dos cuentas y una transferencia de $25.50 desde la inicial.
// Devuelve los movimientos de la cuenta inicial.
const prepareCustomerWithMovements = ({ keepSession }) => cy.pbRegisterCustomer({ keepSession })
    .then(registered => cy.pbOpenSecondAccount(registered).then(accounts => cy.pbTransfer(accounts.initial, accounts.second, '25.50')
        .then(() => cy.pbTransactions(accounts.initial))
        .then(movements => ({ customer: registered, movements }))))

describe('[SCRUM-922] ParaBank - Buscar movimientos de mi cuenta', () => {

    before(() => {
        prepareCustomerWithMovements({ keepSession: false }).then(data => {
            customer = data.customer
            transactions = data.movements
        })
    })

    // Paso 1 de cada TC: "Find Transactions" con la sesión del cliente.
    beforeEach(() => {
        cy.pbLogin(customer)
        find.open()
    })

    const movement25 = () => transactions.find(t => Number(t.amount) === 25.5)

    // CA-23: Al buscar movimientos, "Transaction Results" muestra solo los movimientos de la cuenta elegida que coinciden con el criterio.

    it('[CA-23][TC-23.1][SCRUM-924] Buscar los movimientos de una fecha', () => {
        find.type('date', movement25().day)
        find.search('date')
        find.verifyResults(BOTH)
    })

    it('[CA-23][TC-23.2][SCRUM-925] Buscar los movimientos de un período', () => {
        const year = movement25().day.slice(-4)
        find.type('fromDate', `01-01-${year}`)
        find.type('toDate', `12-31-${year}`)
        find.search('range')
        find.verifyResults(BOTH)
    })

    it('[CA-23][TC-23.3][SCRUM-926] Buscar los movimientos de un monto', () => {
        find.type('amount', '25.50')
        find.search('amount')
        find.verifyResults(ONLY_25)
    })

    it('[CA-23][TC-23.4][SCRUM-927] Buscar un movimiento propio por su número', () => {
        find.type('id', String(movement25().id))
        find.search('id')
        find.verifyResults(ONLY_25)
    })

    it.skip('[CA-23][TC-23.5][SCRUM-928] Buscar por número un movimiento de otro cliente (bug conocido: SCRUM-937)', () => {
        prepareCustomerWithMovements({ keepSession: false }).then(other => {
            cy.pbLogin(customer)
            find.open()
            find.type('id', String(other.movements.find(t => Number(t.amount) === 25.5).id))
            find.search('id')
            find.verifyNoResults()
        })
    })

    // CA-24: Al buscar movimientos, un criterio sin coincidencias muestra "Transaction Results" sin ningún movimiento.

    it('[CA-24][TC-24.1][SCRUM-929] Buscar un monto sin movimientos', () => {
        find.type('amount', '999')
        find.search('amount')
        find.verifyNoResults()
    })

    it('[CA-24][TC-24.2][SCRUM-930] Buscar una fecha sin movimientos', () => {
        find.type('date', '01-01-2020')
        find.search('date')
        find.verifyNoResults()
    })

    it('[CA-24][TC-24.3][SCRUM-931] Buscar un número de movimiento que no existe', () => {
        find.type('id', '99999999')
        find.search('id')
        find.verifyNoResults()
    })

    // CA-25: Al buscar movimientos, un criterio con formato inválido se avisa junto al campo y no se busca.

    it('[CA-25][TC-25.1][SCRUM-932] Buscar por un número con letras', () => {
        find.type('id', 'abc')
        find.search('id')
        find.verifyError('id')
    })

    it('[CA-25][TC-25.2][SCRUM-933] Buscar por una fecha con otro formato', () => {
        find.type('date', '2026-10-05')
        find.search('date')
        find.verifyError('date')
    })

    it('[CA-25][TC-25.3][SCRUM-934] Buscar un período con una sola fecha', () => {
        find.type('fromDate', '10-01-2026')
        find.search('range')
        find.verifyError('range')
    })

    it('[CA-25][TC-25.4][SCRUM-935] Buscar por un monto con letras', () => {
        find.type('amount', 'abc')
        find.search('amount')
        find.verifyError('amount')
    })

    it.skip('[CA-25][TC-25.5][SCRUM-936] Buscar por una fecha que no existe (bug conocido: SCRUM-939)', () => {
        find.type('date', '13-45-2026')
        find.search('date')
        find.verifyError('date')
    })
})
