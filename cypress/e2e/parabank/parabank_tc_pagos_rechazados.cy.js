// Modulo: Banca - Pagos que no se hacen
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-906 (CA-19..CA-22, Test Cycle SCRUM-907)
//
// Cada test registra su cliente con la sesión iniciada: una cuenta con
// $515.50. Lo que el banco acepta y estas reglas rechazan queda en it.skip
// con su bug.

import ParabankBillPayPage from '../../pages/parabank/ParabankBillPayPage'

const billPay = new ParabankBillPayPage()

const BALANCE = '$515.50'

const open = () => {
    cy.pbRegisterCustomer({ keepSession: true })
    billPay.open()
}

// Formulario completo con el monto dado y envío.
const sendWithAmount = amount => {
    open()
    billPay.fillPayee()
    billPay.fillAccount()
    billPay.type('amount', amount)
    billPay.submit()
}

// Envío que el banco no tendría que hacer: no se confirma y el saldo no cambia.
const rejectedByBank = amount => {
    sendWithAmount(amount)
    billPay.verifyNotComplete()
    billPay.verifyBalance(BALANCE)
}

describe('[SCRUM-906] ParaBank - Pagos que no se hacen', () => {

    // CA-19: Al pagar un servicio, cada dato obligatorio vacío o con solo espacios se avisa con su mensaje debajo del campo y el pago no se envía.

    it('[CA-19][TC-19.1][SCRUM-908] Pagar con el formulario vacío', () => {
        open()
        billPay.submit()
        billPay.verifyErrors(['name', 'street', 'city', 'state', 'zipCode', 'phone', 'accountEmpty', 'verifyEmpty', 'amountEmpty'])
    })

    it('[CA-19][TC-19.2][SCRUM-909] Pagar con el nombre del beneficiario compuesto solo por espacios', () => {
        open()
        billPay.type('name', '   ')
        billPay.fillPayee(['name'])
        billPay.fillAccount()
        billPay.type('amount', '10')
        billPay.submit()
        billPay.verifyErrors(['name'])
    })

    it('[CA-19][TC-19.3][SCRUM-910] Pagar sin teléfono del beneficiario', () => {
        open()
        billPay.fillPayee(['phone'])
        billPay.fillAccount()
        billPay.type('amount', '10')
        billPay.submit()
        billPay.verifyErrors(['phone'])
    })

    it('[CA-19][TC-19.4][SCRUM-911] Pagar sin monto', () => {
        open()
        billPay.fillPayee()
        billPay.fillAccount()
        billPay.submit()
        billPay.verifyErrors(['amountEmpty'])
    })

    // CA-20: Al pagar un servicio, un número de cuenta del beneficiario que no es numérico o no coincide con su confirmación se avisa y el pago no se envía.

    it('[CA-20][TC-20.1][SCRUM-912] Pagar con una confirmación de cuenta distinta', () => {
        open()
        billPay.fillPayee()
        billPay.fillAccount('12345', '12346')
        billPay.type('amount', '10')
        billPay.submit()
        billPay.verifyErrors(['verifyMismatch'])
    })

    it('[CA-20][TC-20.2][SCRUM-913] Pagar a un número de cuenta con letras', () => {
        open()
        billPay.fillPayee()
        billPay.fillAccount('abc')
        billPay.type('amount', '10')
        billPay.submit()
        billPay.verifyErrors(['accountInvalid', 'verifyInvalid'])
    })

    // CA-21: Al pagar un servicio, un monto que no es un importe mayor a cero se rechaza y el saldo queda como estaba.

    it('[CA-21][TC-21.1][SCRUM-914] Pagar un monto con letras', () => {
        sendWithAmount('abc')
        billPay.verifyErrors(['amountInvalid'])
    })

    it.skip('[CA-21][TC-21.2][SCRUM-915] Pagar un monto que empieza con números y sigue con letras (bug conocido: SCRUM-921)', () => {
        sendWithAmount('10abc')
        billPay.verifyErrors(['amountInvalid'])
    })

    it.skip('[CA-21][TC-21.3][SCRUM-916] Pagar un monto negativo (bug conocido: SCRUM-920)', () => {
        rejectedByBank('-50')
    })

    // CA-22: Al pagar un servicio, un monto mayor al saldo de la cuenta de origen se rechaza y el saldo queda como estaba.

    it.skip('[CA-22][TC-22.1][SCRUM-917] Pagar más que el saldo de la cuenta (bug conocido: SCRUM-919)', () => {
        rejectedByBank('5000')
    })

    it.skip('[CA-22][TC-22.2][SCRUM-918] Pagar el saldo más un centavo (bug conocido: SCRUM-919)', () => {
        rejectedByBank('515.51')
    })
})
