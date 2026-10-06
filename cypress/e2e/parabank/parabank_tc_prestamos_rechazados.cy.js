// Modulo: Banca - Préstamos que no se otorgan
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-947 (CA-28..CA-30, Test Cycle SCRUM-948)
//
// Un préstamo rechazado no cambia nada: un solo cliente (una cuenta con
// $515.50), registrado al empezar el spec, sirve para todos los TC (la demo
// limita la cantidad de pedidos). Cada test inicia sesión con él. El de pie
// negativo queda en it.skip: la app lo aprueba (SCRUM-957).

import ParabankLoanPage from '../../pages/parabank/ParabankLoanPage'

const loan = new ParabankLoanPage()

let customer
let account

// Monto y pie (los que vengan) y pedido.
const request = (amount, downPayment) => {
    if (amount !== null) loan.type('amount', amount)
    if (downPayment !== null) loan.type('downPayment', downPayment)
    loan.submit()
}

// No se otorga y el resumen no cambia: la cuenta en $515.50 y ninguna nueva.
const notGranted = (amount, downPayment) => {
    request(amount, downPayment)
    loan.verifyNotGranted()
    loan.verifyOverview({ [account]: '$515.50' }, 1)
}

describe('[SCRUM-947] ParaBank - Préstamos que no se otorgan', () => {

    before(() => {
        cy.pbRegisterCustomer({ keepSession: true }).then(registered => { customer = registered })
        loan.open()
        loan.fromAccount().then(id => { account = id })
    })

    // Paso 1 de cada TC: "Request Loan" con la sesión del cliente.
    beforeEach(() => {
        cy.pbLogin(customer)
        loan.open()
    })

    // CA-28: Al pedir un préstamo, un monto que los fondos no respaldan se rechaza con "Denied" y "We cannot grant a loan in that amount with your available funds.".

    it('[CA-28][TC-28.1][SCRUM-949] Pedir un préstamo que los fondos no respaldan', () => {
        request('5000', '100')
        loan.verifyDenied('insufficientFunds')
    })

    it('[CA-28][TC-28.2][SCRUM-950] Pedir sin pie un préstamo que los fondos no respaldan', () => {
        request('3000', '0')
        loan.verifyDenied('insufficientFunds')
    })

    // CA-29: Al pedir un préstamo, un pie mayor al saldo de la cuenta de origen se rechaza con "Denied" y "You do not have sufficient funds for the given down payment.".

    it('[CA-29][TC-29.1][SCRUM-951] Pedir un préstamo con un pie mayor al saldo', () => {
        request('1000', '600')
        loan.verifyDenied('insufficientDownPayment')
    })

    it('[CA-29][TC-29.2][SCRUM-952] Pedir un préstamo con un pie del saldo más un centavo', () => {
        request('1000', '515.51')
        loan.verifyDenied('insufficientDownPayment')
    })

    // CA-30: Al pedir un préstamo, un monto que no sea mayor a cero o un pie vacío o negativo no se otorga y no se crea ninguna cuenta.

    it('[CA-30][TC-30.1][SCRUM-953] Pedir un préstamo sin monto', () => {
        notGranted(null, '100')
    })

    it('[CA-30][TC-30.2][SCRUM-954] Pedir un préstamo sin pie', () => {
        notGranted('1000', null)
    })

    it('[CA-30][TC-30.3][SCRUM-955] Pedir un préstamo de cero', () => {
        notGranted('0', '0')
    })

    it.skip('[CA-30][TC-30.4][SCRUM-956] Pedir un préstamo con un pie negativo (bug conocido: SCRUM-957)', () => {
        notGranted('1000', '-50')
    })
})
