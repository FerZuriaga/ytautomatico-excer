// Modulo: Banca - Ver el resumen de mis cuentas
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-970 (CA-35..CA-37, Test Cycle SCRUM-971)
//
// Los tests solo leen: dos clientes preparados una vez en before (la demo
// limita la cantidad de pedidos) y cada test inicia sesión con uno. El de
// una cuenta de otro cliente queda en it.skip: la app la muestra (SCRUM-990).

import ParabankOverviewPage from '../../pages/parabank/ParabankOverviewPage'
import ParabankActivityPage from '../../pages/parabank/ParabankActivityPage'

const overview = new ParabankOverviewPage()
const activity = new ParabankActivityPage()

// Una sola cuenta con $515.50.
let single
let singleAccount
// Dos cuentas: la inicial transfirió $25.50 a la segunda ($390.00 / $125.50).
let pair
let initial
let second

// Paso 1: "Accounts Overview" con la sesión del cliente.
const openOverview = (customer) => {
    cy.pbLogin(customer)
    activity.prepare()
    cy.fixture('selectors/parabank/cuenta.json').then(sel => cy.gotoParabankUrl(sel.paths.home))
    overview.open()
}

describe('[SCRUM-970] ParaBank - Ver el resumen de mis cuentas', () => {

    before(() => {
        cy.pbRegisterCustomer().then(customer => { single = customer })
            .then(() => cy.pbAccounts(single)).then(([id]) => { singleAccount = id })
        cy.pbRegisterCustomer().then(customer => { pair = customer })
            .then(() => cy.pbOpenSecondAccount(pair)).then(accounts => {
                initial = accounts.initial
                second = accounts.second
                cy.pbTransfer(initial, second, '25.50')
            })
    })

    // CA-35: Al abrir "Accounts Overview", cada cuenta del cliente aparece con su número, su "Balance" y su "Available Amount", los mismos que muestra su "Account Details".

    it('[CA-35][TC-35.1][SCRUM-972] El resumen muestra los saldos de dos cuentas', () => {
        openOverview(pair)
        overview.verifyAccountCount(2)
        overview.verifyBalances({ [initial]: '$390.00', [second]: '$125.50' })
        overview.verifyAvailable({ [initial]: '$390.00', [second]: '$125.50' })
        activity.openFromOverview(second)
        activity.verifyBalance('$125.50', '$125.50')
    })

    it('[CA-35][TC-35.2][SCRUM-973] El resumen muestra el saldo de una sola cuenta', () => {
        openOverview(single)
        overview.verifyAccountCount(1)
        overview.verifyBalances({ [singleAccount]: '$515.50' })
        overview.verifyAvailable({ [singleAccount]: '$515.50' })
        activity.openFromOverview(singleAccount)
        activity.verifyBalance('$515.50', '$515.50')
    })

    // CA-36: Al abrir "Accounts Overview", la fila "Total" muestra la suma de los saldos de todas las cuentas del cliente.

    it('[CA-36][TC-36.1][SCRUM-974] El total del resumen suma dos cuentas', () => {
        openOverview(pair)
        overview.verifyTotal('$515.50')
        activity.openFromOverview(initial)
        activity.verifyBalance('$390.00')
    })

    it('[CA-36][TC-36.2][SCRUM-975] El total del resumen con una sola cuenta', () => {
        openOverview(single)
        overview.verifyTotal('$515.50')
        activity.openFromOverview(singleAccount)
        activity.verifyBalance('$515.50')
    })

    // CA-37: "Account Details" se muestra solo para las cuentas del propio cliente, y con el número de una cuenta de otro cliente no aparecen su saldo ni sus movimientos.

    it.skip('[CA-37][TC-37.1][SCRUM-976] El detalle de una cuenta de otro cliente no se muestra (bug conocido: SCRUM-990)', () => {
        openOverview(single)
        activity.openFromOverview(singleAccount)
        activity.verifyBalance('$515.50')
        activity.openByAddress(second)
        cy.wait('@transactions')
        activity.verifyNotShown()
    })

    it('[CA-37][TC-37.2][SCRUM-977] El detalle de otra cuenta propia se muestra', () => {
        openOverview(pair)
        activity.openFromOverview(initial)
        activity.verifyBalance('$390.00')
        activity.openByAddress(second)
        activity.verifyShown(second)
        activity.verifyBalance('$125.50')
    })
})
