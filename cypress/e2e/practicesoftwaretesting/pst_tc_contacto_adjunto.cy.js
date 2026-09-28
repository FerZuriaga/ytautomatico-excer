// Modulo: Contacto - Adjuntar un archivo a la consulta
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-612 (CA-05..CA-07, Test Cycle SCRUM-613)
//
// Solo se admiten archivos .txt vacios (restriccion declarada por la
// tienda en la ayuda del campo). Los archivos se generan en memoria.

import PSTContactPage from '../../pages/practicesoftwaretesting/PSTContactPage'

const contact = new PSTContactPage()

const VISITOR = { firstName: 'Qa', lastName: 'Contacto', email: 'qa.contacto@example.com' }
const M50 = 'Consulta sobre el estado de mi pedido numero 12345'

const EMPTY_TXT = { fileName: 'consulta.txt', content: '', mimeType: 'text/plain' }
const TXT_WITH_TEXT = { fileName: 'consulta.txt', content: 'Detalle del pedido', mimeType: 'text/plain' }
const EMPTY_PDF = { fileName: 'consulta.pdf', content: '', mimeType: 'application/pdf' }
const EMPTY_PNG = { fileName: 'foto.png', content: '', mimeType: 'image/png' }

// Visitante con la consulta completa, a falta del adjunto.
const visitorReadyToAttach = () => {
    contact.visitHome()
    contact.openAsVisitor()
    contact.fillIdentity(VISITOR)
    contact.fillMessage('Status of my order', M50)
}

describe('Contacto: adjuntar un archivo a la consulta [SCRUM-612]', () => {

    it('[CA-05][TC-05.1][SCRUM-614] Debe enviar la consulta de un visitante con un archivo de texto adjunto', () => {
        visitorReadyToAttach()
        contact.attachFile(EMPTY_TXT)
        contact.clickSend()
        contact.verifySent({ withAttachment: true })
    })

    it('[CA-05][TC-05.2][SCRUM-615] Debe enviar la consulta de un cliente con sesion con un archivo adjunto', () => {
        contact.prepareCustomer().then(customer => {
            contact.visitHome()
            contact.openAsCustomer(customer)
            contact.fillMessage('Payments', M50)
            contact.attachFile(EMPTY_TXT)
            contact.clickSend()
            contact.verifySent({ withAttachment: true })

            contact.openUserMenu()
            contact.clickMyMessages()
            contact.verifyMessageListed(M50)
        })
    })

    it('[CA-06][TC-06.1][SCRUM-616] No debe aceptar un archivo PDF', () => {
        visitorReadyToAttach()
        contact.attachFile(EMPTY_PDF)
        contact.clickSend()
        contact.verifyRejected(['attachmentType'])
    })

    it('[CA-06][TC-06.2][SCRUM-617] No debe aceptar una imagen', () => {
        visitorReadyToAttach()
        contact.attachFile(EMPTY_PNG)
        contact.clickSend()
        contact.verifyRejected(['attachmentType'])
    })

    it('[CA-07][TC-07.1][SCRUM-618] No debe aceptar un archivo de texto con contenido', () => {
        visitorReadyToAttach()
        contact.attachFile(TXT_WITH_TEXT)
        contact.clickSend()
        contact.verifyRejected(['attachmentSize'])
    })

    it('[CA-07][TC-07.2][SCRUM-619] No debe registrar en el historial la consulta con un archivo con contenido', () => {
        contact.prepareCustomer().then(customer => {
            contact.visitHome()
            contact.openAsCustomer(customer)
            contact.fillMessage('Payments', M50)
            contact.attachFile(TXT_WITH_TEXT)
            contact.clickSend()
            contact.verifyRejected(['attachmentSize'])

            contact.openUserMenu()
            contact.clickMyMessages()
            contact.verifyNoMessages()
        })
    })
})
