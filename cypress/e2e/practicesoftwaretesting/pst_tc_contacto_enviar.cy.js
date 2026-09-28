// Modulo: Contacto - Enviar una consulta
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-599 (CA-01..CA-04, Test Cycle SCRUM-600)
//
// Los visitantes entran sin sesion; los clientes con sesion usan una
// cuenta propia registrada por API (sin mensajes previos). Cada test
// afirma solo lo que promete su Test Case: el historial de mensajes es la
// regla del CA-04.

import PSTContactPage from '../../pages/practicesoftwaretesting/PSTContactPage'

const contact = new PSTContactPage()

const VISITOR = { firstName: 'Qa', lastName: 'Contacto', email: 'qa.contacto@example.com' }
const M49 = 'Consulta sobre el estado de mi pedido numero 1234'
const M50 = `${M49}5`

describe('Contacto: enviar una consulta [SCRUM-599]', () => {

    it('[CA-01][TC-01.1][SCRUM-601] Debe enviar la consulta de un visitante identificado con sus datos', () => {
        contact.visitHome()
        contact.openAsVisitor()
        contact.fillIdentity(VISITOR)
        contact.fillMessage('Status of my order', M50)
        contact.clickSend()
        contact.verifySent()
    })

    it('[CA-01][TC-01.2][SCRUM-602] No debe enviar la consulta de un visitante sin nombre, apellido ni email', () => {
        contact.visitHome()
        contact.openAsVisitor()
        contact.fillMessage('Status of my order', M50)
        contact.clickSend()
        contact.verifyRejected(['firstNameRequired', 'lastNameRequired', 'emailRequired'])
    })

    it('[CA-01][TC-01.3][SCRUM-603] No debe enviar la consulta de un visitante con un email invalido', () => {
        contact.visitHome()
        contact.openAsVisitor()
        contact.fillIdentity({ ...VISITOR, email: 'qa.contacto-example.com' })
        contact.fillMessage('Status of my order', M50)
        contact.clickSend()
        contact.verifyRejected(['emailFormat'])
    })

    it('[CA-02][TC-02.1][SCRUM-604] Debe enviar la consulta de un cliente con sesion sin pedirle sus datos', () => {
        contact.prepareCustomer().then(customer => {
            contact.visitHome()
            contact.openAsCustomer(customer)
            contact.fillMessage('Payments', M50)
            contact.clickSend()
            contact.verifySent()
        })
    })

    it('[CA-02][TC-02.2][SCRUM-605] No debe pedir nombre, apellido ni email a un cliente con sesion', () => {
        contact.prepareCustomer().then(customer => {
            contact.visitHome()
            contact.openAsCustomer(customer)
            contact.clickSend()
            contact.verifyRejected(['subjectRequired', 'messageRequired'])
        })
    })

    it('[CA-03][TC-03.1][SCRUM-606] No debe enviar una consulta sin asunto', () => {
        contact.visitHome()
        contact.openAsVisitor()
        contact.fillIdentity(VISITOR)
        contact.typeMessage(M50)
        contact.clickSend()
        contact.verifyRejected(['subjectRequired'])
    })

    it('[CA-03][TC-03.2][SCRUM-607] No debe enviar una consulta sin mensaje', () => {
        contact.visitHome()
        contact.openAsVisitor()
        contact.fillIdentity(VISITOR)
        contact.selectSubject('Status of my order')
        contact.clickSend()
        contact.verifyRejected(['messageRequired'])
    })

    it('[CA-03][TC-03.3][SCRUM-608] No debe enviar un mensaje de 49 caracteres', () => {
        contact.visitHome()
        contact.openAsVisitor()
        contact.fillIdentity(VISITOR)
        contact.fillMessage('Status of my order', M49)
        contact.clickSend()
        contact.verifyRejected(['messageMinLength'])
    })

    it('[CA-03][TC-03.4][SCRUM-609] Debe enviar un mensaje de exactamente 50 caracteres', () => {
        contact.visitHome()
        contact.openAsVisitor()
        contact.fillIdentity(VISITOR)
        contact.fillMessage('Status of my order', M50)
        contact.clickSend()
        contact.verifySent()
    })

    it('[CA-04][TC-04.1][SCRUM-610] Debe registrar la consulta del cliente en su historial de mensajes', () => {
        contact.prepareCustomer().then(customer => {
            contact.visitHome()
            contact.openAsCustomer(customer)
            contact.fillMessage('Payments', M50)
            contact.clickSend()
            contact.verifySent()

            contact.openUserMenu()
            contact.clickMyMessages()
            contact.verifyMessageListed(M50)
        })
    })

    it('[CA-04][TC-04.2][SCRUM-611] No debe registrar en el historial una consulta rechazada', () => {
        contact.prepareCustomer().then(customer => {
            contact.visitHome()
            contact.openAsCustomer(customer)
            contact.fillMessage('Payments', M49)
            contact.clickSend()
            contact.verifyRejected(['messageMinLength'])

            contact.openUserMenu()
            contact.clickMyMessages()
            contact.verifyNoMessages()
        })
    })
})
