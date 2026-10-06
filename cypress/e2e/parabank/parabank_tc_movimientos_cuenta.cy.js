// Modulo: Banca - Ver los movimientos de una cuenta
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-978 (CA-38..CA-40, Test Cycle SCRUM-979)
//
// Los tests solo leen: dos clientes preparados una vez en before y cada test
// inicia sesión con uno. La pantalla se pide en inglés salvo el TC que fija
// el español; el de un mes sin movimientos en español queda en it.skip: la
// app muestra todos los movimientos (SCRUM-989).

import ParabankOverviewPage from '../../pages/parabank/ParabankOverviewPage'
import ParabankActivityPage from '../../pages/parabank/ParabankActivityPage'

const overview = new ParabankOverviewPage()
const activity = new ParabankActivityPage()

// Una sola cuenta, sin movimientos.
let single
let singleAccount
// Dos cuentas: la inicial envió $100.00 (al abrir la segunda) y $25.50, y la
// segunda le devolvió $10.00.
let pair
let initial
let second

const received = (amount) => ({ description: 'Funds Transfer Received', amount, type: 'Credit' })
const sent = (amount) => ({ description: 'Funds Transfer Sent', amount, type: 'Debit' })

const INITIAL_MOVEMENTS = [sent('$100.00'), sent('$25.50'), received('$10.00')]
const SECOND_MOVEMENTS = [received('$100.00'), received('$25.50'), sent('$10.00')]

// Pasos 1 y 2: "Accounts Overview" y clic en el número de la cuenta.
const openActivity = (customer, accountId, language) => {
    activity.prepare(language)
    overview.openAs(customer)
    overview.verifyAccountCount(customer === pair ? 2 : 1)
    activity.openFromOverview(accountId)
}

describe('[SCRUM-978] ParaBank - Ver los movimientos de una cuenta', () => {

    before(() => {
        cy.pbRegisterCustomer().then(customer => { single = customer })
            .then(() => cy.pbAccounts(single)).then(([id]) => { singleAccount = id })
        cy.pbRegisterCustomer().then(customer => { pair = customer })
            .then(() => cy.pbOpenSecondAccount(pair)).then(accounts => {
                initial = accounts.initial
                second = accounts.second
                cy.pbTransfer(initial, second, '25.50')
                cy.pbTransfer(second, initial, '10.00')
            })
    })

    // CA-38: "Account Activity" muestra cada movimiento de la cuenta con su descripción y su monto en "Debit (-)" o en "Credit (+)" según su tipo, o "No transactions found." si la cuenta no tiene movimientos.

    it('[CA-38][TC-38.1][SCRUM-980] Ver los movimientos de una cuenta que recibió transferencias', () => {
        openActivity(pair, second)
        activity.verifyMovements(SECOND_MOVEMENTS)
    })

    it('[CA-38][TC-38.2][SCRUM-981] Ver los movimientos de una cuenta que envió transferencias', () => {
        openActivity(pair, initial)
        activity.verifyMovements(INITIAL_MOVEMENTS)
    })

    it('[CA-38][TC-38.3][SCRUM-982] Ver una cuenta sin movimientos', () => {
        openActivity(single, singleAccount)
        activity.verifyNoTransactions()
    })

    // CA-39: Al elegir un tipo en "Type" y hacer clic en "Go", "Account Activity" muestra solo los movimientos de ese tipo.

    it('[CA-39][TC-39.1][SCRUM-983] Filtrar los débitos de una cuenta', () => {
        openActivity(pair, initial)
        activity.verifyMovements(INITIAL_MOVEMENTS)
        activity.selectType('Debit')
        activity.go()
        activity.verifyMovements([sent('$100.00'), sent('$25.50')])
    })

    it('[CA-39][TC-39.2][SCRUM-984] Filtrar los créditos de la segunda cuenta', () => {
        openActivity(pair, second)
        activity.verifyMovements(SECOND_MOVEMENTS)
        activity.selectType('Credit')
        activity.go()
        activity.verifyMovements([received('$100.00'), received('$25.50')])
    })

    it('[CA-39][TC-39.3][SCRUM-985] Filtrar los créditos de la cuenta inicial', () => {
        openActivity(pair, initial)
        activity.verifyMovements(INITIAL_MOVEMENTS)
        activity.selectType('Credit')
        activity.go()
        activity.verifyMovements([received('$10.00')])
    })

    // CA-40: Al elegir un mes en "Activity Period" y hacer clic en "Go", "Account Activity" muestra solo los movimientos de ese mes, o "No transactions found." si no hay.

    it('[CA-40][TC-40.1][SCRUM-986] Filtrar los movimientos del mes actual', () => {
        openActivity(pair, second)
        activity.verifyMovements(SECOND_MOVEMENTS)
        activity.selectMonth('current')
        activity.go()
        activity.verifyMovements(SECOND_MOVEMENTS)
    })

    it('[CA-40][TC-40.2][SCRUM-987] Filtrar un mes sin movimientos con el navegador en inglés', () => {
        openActivity(pair, second, 'en-US')
        activity.verifyMovements(SECOND_MOVEMENTS)
        activity.selectMonth('other')
        activity.go()
        activity.verifyNoTransactions()
    })

    it.skip('[CA-40][TC-40.3][SCRUM-988] Filtrar un mes sin movimientos con el navegador en español (bug conocido: SCRUM-989)', () => {
        openActivity(pair, second, 'es-419')
        activity.verifyMovements(SECOND_MOVEMENTS)
        activity.selectMonth('other')
        activity.go()
        activity.verifyNoTransactions()
    })
})
