// Modulo: Mensajes - Borrar consultas de la bandeja
// Sitio bajo prueba: https://automationintesting.online (Restful Booker Platform - panel de administracion)
// Ticket Jira: SCRUM-1029 (CA-01..CA-03, Test Cycle SCRUM-1030)
//
// La bandeja es compartida con todos los que usan la demo: cada test envia
// sus consultas por API con un asunto unico y las ubica por ese asunto.
// La sesion de administrador se inicia por API (cookie "token").
// Bug conocido SCRUM-1037: se borra sin pedir confirmacion (no cambia lo que
// afirman estos TC).

import AdminMessagesPage from '../../pages/restful-booker-platform/AdminMessagesPage'

const inbox = new AdminMessagesPage()

// Paso 1: la bandeja con la consulta de la precondicion.
const openInboxWith = (message, { read = false } = {}) => {
    inbox.adminToken().then(token => {
        inbox.openPanel(token)
        inbox.openInbox()
        inbox.verifyRow(message.subject, { name: message.name, read })
    })
}

describe('Mensajes: borrar consultas de la bandeja [SCRUM-1029]', () => {

    it('[CA-01][TC-01.1][SCRUM-1031] Borrar una consulta debe sacarla de la bandeja', () => {
        inbox.sendMessage().then(message => {
            openInboxWith(message)
            inbox.deleteMessage(message.subject)
        })
    })

    it('[CA-01][TC-01.2][SCRUM-1032] Borrar una consulta no debe borrar otra consulta de la bandeja', () => {
        inbox.sendMessage().then(primera => {
            inbox.sendMessage().then(segunda => {
                openInboxWith(primera)
                inbox.verifyRow(segunda.subject, { name: segunda.name, read: false })

                inbox.deleteMessage(primera.subject)
                inbox.verifyRow(segunda.subject, { name: segunda.name, read: false })
            })
        })
    })

    it('[CA-02][TC-02.1][SCRUM-1033] La consulta borrada no debe volver al recargar la bandeja', () => {
        inbox.sendMessage().then(message => {
            openInboxWith(message)
            inbox.deleteMessage(message.subject)
            inbox.reloadInbox()
            inbox.verifyNoRow(message.subject)
        })
    })

    it('[CA-02][TC-02.2][SCRUM-1034] La consulta borrada no debe volver al entrar de nuevo desde el menu Messages', () => {
        inbox.sendMessage().then(message => {
            openInboxWith(message)
            inbox.deleteMessage(message.subject)
            inbox.openRooms()
            inbox.openInbox()
            inbox.verifyNoRow(message.subject)
        })
    })

    it('[CA-03][TC-03.1][SCRUM-1035] Borrar una consulta sin leer debe bajar en uno el contador de sin leer', () => {
        inbox.sendMessage().then(message => {
            openInboxWith(message)
            inbox.unreadCount().then(unread => {
                inbox.deleteMessage(message.subject)
                inbox.verifyUnreadCount(unread - 1)
            })
        })
    })

    it('[CA-03][TC-03.2][SCRUM-1036] Borrar una consulta ya leida no debe cambiar el contador de sin leer', () => {
        // Una consulta propia sin leer de mas: el menu sigue mostrando la
        // cantidad aunque la bandeja no tenga otras pendientes.
        inbox.sendMessage()
        inbox.sendMessage().then(message => {
            // Precondicion: la consulta ya abierta (leida).
            openInboxWith(message)
            inbox.markAsRead(message.subject)

            inbox.unreadCount().then(unread => {
                inbox.deleteMessage(message.subject)
                inbox.verifyUnreadCount(unread)
            })
        })
    })
})
