// Modulo: Checkout - Paso 4 (Payment): pagar y confirmar el pedido
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-514 (CA-05/CA-06/CA-07, Test Cycle SCRUM-515)
//
// Cliente propio con sesion, un Wood Saw en el carrito y la direccion
// completa: cada test llega al paso Payment por la UI (pasos 1 a 3).

import PSTCheckoutPage from '../../pages/practicesoftwaretesting/PSTCheckoutPage'

const checkout = new PSTCheckoutPage()

const ITEMS = [{ name: 'Wood Saw', quantity: 1 }]
const CARD_FIELDS = ['creditCardNumber', 'expirationDate', 'cvv', 'cardHolderName']

const openPayment = () => {
    checkout.openPaymentAsCustomer(ITEMS)
    checkout.proceedFromAddress()
    checkout.verifyPaymentInitial()
}

describe('Checkout: pagar y confirmar el pedido [SCRUM-514]', () => {

    it('[CA-05][TC-05.1][SCRUM-516] No debe confirmar sin medio de pago ni cuotas elegidas', () => {
        openPayment()

        checkout.selectMethod('Buy Now Pay Later')

        checkout.verifyPaymentFields(['monthlyInstallments'])
        checkout.verifyConfirm(false)
    })

    it('[CA-05][TC-05.2][SCRUM-517] Debe habilitar Confirm al elegir Cash on Delivery', () => {
        openPayment()

        checkout.selectMethod('Cash on Delivery')

        checkout.verifyConfirm(true)
    })

    // Bug SCRUM-527: con Credit Card, Confirm se habilita con la tarjeta
    // vacia. Al cerrarlo, quitar el .skip y el sufijo.
    it.skip('[CA-05][TC-05.3][SCRUM-518] No debe confirmar con tarjeta sin datos (bug conocido: SCRUM-527)', () => {
        openPayment()

        checkout.selectMethod('Credit Card')

        checkout.verifyPaymentFields(CARD_FIELDS, true)
        checkout.verifyConfirm(false)
    })

    it('[CA-06][TC-06.1][SCRUM-519] Debe rechazar un numero de tarjeta mal formado', () => {
        openPayment()
        checkout.selectMethod('Credit Card')
        checkout.verifyPaymentFields(CARD_FIELDS)

        checkout.typePayment('creditCardNumber', '1234567890123456')

        checkout.verifyPaymentError('cardNumber')
        checkout.verifyConfirm(false)
    })

    it('[CA-06][TC-06.2][SCRUM-520] Debe rechazar una tarjeta vencida', () => {
        openPayment()
        checkout.selectMethod('Credit Card')
        checkout.verifyPaymentFields(CARD_FIELDS)

        checkout.typePayment('expirationDate', '01/2020')

        checkout.verifyPaymentError('expirationPast')
        checkout.verifyConfirm(false)
    })

    it('[CA-06][TC-06.3][SCRUM-521] Debe rechazar un numero de gift card de largo invalido', () => {
        openPayment()
        checkout.selectMethod('Gift Card')
        checkout.verifyPaymentFields(['giftCardNumber', 'validationCode'])

        checkout.typePayment('giftCardNumber', 'ABC123')

        checkout.verifyPaymentError('giftCardNumber')
        checkout.verifyConfirm(false)
    })

    it('[CA-06][TC-06.4][SCRUM-522] Debe aceptar una tarjeta con datos validos', () => {
        openPayment()
        checkout.selectMethod('Credit Card')

        checkout.typePayment('creditCardNumber', '1111-2222-3333-4444')
        checkout.verifyPaymentError('cardNumber', false)
        checkout.typePayment('expirationDate', '12/2030')
        checkout.verifyPaymentError('expirationFormat', false)
        checkout.verifyPaymentError('expirationPast', false)
        checkout.typePayment('cvv', '123')
        checkout.verifyPaymentError('cvv', false)
        checkout.typePayment('cardHolderName', 'Qa Tester')

        checkout.verifyConfirm(true)
    })

    // Bug SCRUM-525: el primer Confirm valida el pago pero no crea el
    // pedido. Al cerrarlo, quitar el .skip y el sufijo.
    it.skip('[CA-07][TC-07.1][SCRUM-523] Debe crear el pedido con un solo Confirm (bug conocido: SCRUM-525)', () => {
        openPayment()
        checkout.selectMethod('Cash on Delivery')
        checkout.verifyConfirm(true)

        checkout.confirm()

        checkout.verifyOrderCreated()
    })

    it('[CA-07][TC-07.2][SCRUM-524] Debe informar el pago aceptado al confirmar', () => {
        openPayment()
        checkout.selectMethod('Cash on Delivery')
        checkout.verifyConfirm(true)

        checkout.confirm()

        checkout.verifyPaymentAccepted()
    })
})
