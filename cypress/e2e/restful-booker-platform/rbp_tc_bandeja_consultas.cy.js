// Modulo: Mensajes - Leer las consultas recibidas
// Sitio bajo prueba: https://automationintesting.online (Restful Booker Platform - panel de administracion)
// Ticket Jira: SCRUM-683 (CA-01..CA-04, Test Cycle SCRUM-684)
//
// La bandeja es compartida con todos los que usan la demo: cada test envia
// sus consultas por API con un asunto unico y las ubica por ese asunto.
// La sesion de administrador se inicia por API (cookie "token").

import AdminMessagesPage from '../../pages/restful-booker-platform/AdminMessagesPage'
import ContactPage from '../../pages/restful-booker-platform/ContactPage'

const inbox = new AdminMessagesPage()
const contact = new ContactPage()

// Paso 1 de los TC con sesion: la bandeja con la consulta de la precondicion.
const openInboxWith = message => {
    inbox.adminToken().then(token => {
        inbox.openPanel(token)
        inbox.openInbox()
        inbox.verifyRow(message.subject, { name: message.name, read: false })
    })
}

describe('Mensajes: leer las consultas recibidas [SCRUM-683]', () => {

    it('[CA-01][TC-01.1][SCRUM-685] La consulta enviada debe aparecer en la bandeja como no leida', () => {
        inbox.sendMessage().then(message => {
            inbox.adminToken().then(token => {
                inbox.openPanel(token)
                inbox.unreadCount().should('be.greaterThan', 0)
                inbox.openInbox()
                inbox.verifyRow(message.subject, { name: message.name, read: false })
            })
        })
    })

    it('[CA-01][TC-01.2][SCRUM-686] Una consulta rechazada no debe llegar a la bandeja', () => {
        const subject = `Consulta rechazada QA ${Date.now()}`
        contact.open()
        contact.fill({ name: 'Qa Rechazada', email: 'qa.rechazada@example.com', phone: '0123456789', subject, message: 'Quisiera saber si tienen disponibilidad para dos noches en octubre.' })
        contact.submit()
        contact.verifyRejected(['phone'])

        inbox.adminToken().then(token => {
            inbox.openPanel(token)
            inbox.openInbox()
            inbox.verifyNoRow(subject)
        })
    })

    it('[CA-02][TC-02.1][SCRUM-687] Abrir una consulta debe mostrar los datos del huesped y el mensaje', () => {
        inbox.sendMessage().then(message => {
            openInboxWith(message)
            inbox.openMessage(message.subject)
            inbox.verifyDetail(message)
        })
    })

    it('[CA-02][TC-02.2][SCRUM-688] Cerrar el detalle debe volver a la bandeja', () => {
        inbox.sendMessage().then(message => {
            openInboxWith(message)
            inbox.openMessage(message.subject)
            inbox.closeDetail()
            inbox.row(message.subject).should('contain.text', message.name)
        })
    })

    it('[CA-03][TC-03.1][SCRUM-689] Abrir una consulta debe bajar en uno el contador de no leidas', () => {
        inbox.sendMessage().then(message => {
            openInboxWith(message)
            inbox.unreadCount().then(unread => {
                inbox.openMessage(message.subject)
                inbox.verifyUnreadCount(unread - 1)
            })
        })
    })

    it('[CA-03][TC-03.2][SCRUM-690] La consulta abierta debe quedar marcada como leida', () => {
        inbox.sendMessage().then(message => {
            openInboxWith(message)
            inbox.openMessage(message.subject)
            inbox.closeDetail()
            inbox.verifyRow(message.subject, { name: message.name, read: true })
        })
    })

    it('[CA-03][TC-03.3][SCRUM-691] Abrir una consulta no debe marcar como leidas a las demas', () => {
        inbox.sendMessage().then(primera => {
            inbox.sendMessage().then(segunda => {
                openInboxWith(primera)
                inbox.verifyRow(segunda.subject, { name: segunda.name, read: false })

                inbox.openMessage(primera.subject)
                inbox.closeDetail()
                inbox.verifyRow(primera.subject, { name: primera.name, read: true })
                inbox.verifyRow(segunda.subject, { name: segunda.name, read: false })
            })
        })
    })

    it('[CA-04][TC-04.1][SCRUM-692] Sin sesion, la bandeja debe pedir iniciar sesion', () => {
        inbox.openInboxWithoutSession()
        inbox.clickFrontPage()
    })

    it('[CA-04][TC-04.2][SCRUM-693] Con el usuario administrador se debe entrar a la bandeja', () => {
        inbox.openPanelWithoutSession()
        inbox.login()
        inbox.openInbox()
    })
})
