// Modulo: Banca - Pagar un servicio
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-900 (CA-17..CA-18, Test Cycle SCRUM-901)
//
// Cada test registra su cliente con la sesión iniciada: una cuenta con $515.50.

import ParabankBillPayPage from '../../pages/parabank/ParabankBillPayPage'

const billPay = new ParabankBillPayPage()

// Pasos 1 a 11: abrir "Bill Pay", beneficiario, cuenta confirmada, monto y envío confirmado.
const pay = (amount, amountText) => {
    cy.pbRegisterCustomer({ keepSession: true })
    billPay.open()
    billPay.fillPayee()
    billPay.fillAccount()
    billPay.type('amount', amount)
    billPay.submit()
    billPay.verifyComplete(amountText)
}

describe('[SCRUM-900] ParaBank - Pagar un servicio', () => {

    // CA-17: Al pagar con los datos del beneficiario completos, su cuenta confirmada y un monto válido, se confirma con "Bill Payment Complete".

    it('[CA-17][TC-17.1][SCRUM-902] Pagar un servicio con un monto entero', () => {
        pay('50', '$50.00')
    })

    it('[CA-17][TC-17.2][SCRUM-903] Pagar un servicio con centavos', () => {
        pay('12.34', '$12.34')
    })

    // CA-18: Al pagar un servicio, el saldo de la cuenta de origen en "Accounts Overview" baja exactamente en el monto pagado.

    it('[CA-18][TC-18.1][SCRUM-904] El saldo refleja un pago de monto entero', () => {
        pay('50', '$50.00')
        billPay.verifyBalance('$465.50')
    })

    it('[CA-18][TC-18.2][SCRUM-905] El saldo refleja un pago con centavos', () => {
        pay('12.34', '$12.34')
        billPay.verifyBalance('$503.16')
    })
})
