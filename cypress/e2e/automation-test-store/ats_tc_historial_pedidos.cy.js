// Modulo: Autenticacion y cuenta - Consultar el estado de un pedido (invitado)
// Sitio bajo prueba: https://automationteststore.com
// Ticket Jira: SCRUM-167 (CA-01/CA-02, Test Cycle SCRUM-168)
//
// El sitio indica explicitamente que no genera pedidos reales ni procesa
// pagos ("no orders are actually placed"), por lo que el estado de "pedido
// encontrado" no es verificable y no forma parte de esta HU: solo se cubren
// la validacion de formato (CA-01) y el mensaje de "no encontrado" (CA-02).

import AutomationTestStoreOrderLookupPage from '../../pages/automation-test-store/AutomationTestStoreOrderLookupPage'

const orderLookupPage = new AutomationTestStoreOrderLookupPage()
const ORDER_ID_REQUIRED_ERROR = 'Order ID is required field!'
const EMAIL_INVALID_ERROR = 'E-Mail Address does not appear to be valid!'

describe('Consultar el estado de un pedido como invitado [SCRUM-167]', () => {

    beforeEach(() => {
        orderLookupPage.visit()
    })

    it('[CA-01][TC-01.1][SCRUM-169] Debe exigir ambos campos al enviar la consulta sin completar ningun dato', () => {
        orderLookupPage.submit()
        orderLookupPage.verifyOrderIdError(ORDER_ID_REQUIRED_ERROR)
        orderLookupPage.verifyEmailError(EMAIL_INVALID_ERROR)
    })

    it('[CA-01][TC-01.2][SCRUM-170] Debe rechazar un Order ID con formato no numerico', () => {
        orderLookupPage.enterData('abc', 'a@a.com')
        orderLookupPage.submit()
        orderLookupPage.verifyOrderIdError(ORDER_ID_REQUIRED_ERROR)
        orderLookupPage.verifyNoEmailError()
    })

    it('[CA-01][TC-01.3][SCRUM-171] Debe rechazar la consulta cuando el campo Email queda vacio', () => {
        orderLookupPage.enterData('1', '')
        orderLookupPage.submit()
        orderLookupPage.verifyEmailError(EMAIL_INVALID_ERROR)
        orderLookupPage.verifyNoOrderIdError()
    })

    it('[CA-02][TC-02.1][SCRUM-172] Debe informar que no encontro el pedido con un Order ID bajo que no existe', () => {
        orderLookupPage.enterData('1', `noexiste_${Date.now()}@example.com`)
        orderLookupPage.submit()
        orderLookupPage.verifyNotFound()
    })

    it('[CA-02][TC-02.2][SCRUM-173] Debe informar que no encontro el pedido con un Order ID alto que no existe', () => {
        orderLookupPage.enterData('999999', `noexiste_${Date.now()}@example.com`)
        orderLookupPage.submit()
        orderLookupPage.verifyNotFound()
    })
})
