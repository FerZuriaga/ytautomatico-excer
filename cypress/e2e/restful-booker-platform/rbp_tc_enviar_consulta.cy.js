// Modulo: Mensajes - Enviar una consulta al hotel
// Sitio bajo prueba: https://automationintesting.online (Restful Booker Platform - Shady Meadows B&B)
// Ticket Jira: SCRUM-671 (CA-01..CA-04, Test Cycle SCRUM-672)
//
// Visitante sin sesion en la pagina principal. Las reglas de los datos las
// valida el servidor (el rechazo se verifica por status y por los avisos que
// devuelve, no por su redaccion).

import ContactPage from '../../pages/restful-booker-platform/ContactPage'

const contact = new ContactPage()

const CONSULTA = {
    name: 'Qa Contacto', email: 'qa.contacto@example.com', phone: '01234567890',
    subject: 'Consulta sobre disponibilidad', message: 'Quisiera saber si tienen disponibilidad para dos noches en octubre.'
}

describe('Mensajes: enviar una consulta al hotel [SCRUM-671]', () => {

    beforeEach(() => contact.open())

    it('[CA-01][TC-01.1][SCRUM-673] Una consulta con todos los datos validos debe enviarse y confirmarse', () => {
        contact.fill(CONSULTA)
        contact.submit()
        contact.verifySent(CONSULTA)
    })

    it('[CA-01][TC-01.2][SCRUM-674] La confirmacion debe usar el nombre y el asunto de la consulta', () => {
        const consulta = {
            name: 'Maria Lopez', email: 'maria.lopez@example.com', phone: '01234567890',
            subject: 'Traslado desde la estacion', message: 'Necesito saber si ofrecen traslado desde la estacion de tren.'
        }
        contact.fill(consulta)
        contact.submit()
        contact.verifySent(consulta)
    })

    it('[CA-02][TC-02.1][SCRUM-675] El formulario vacio no debe enviarse', () => {
        contact.submit()
        contact.verifyRejected(['name', 'email', 'phone', 'subject', 'message'])
    })

    it('[CA-02][TC-02.2][SCRUM-676] Una consulta sin email no debe enviarse', () => {
        contact.fill({ ...CONSULTA, email: '' })
        contact.submit()
        contact.verifyRejected(['email'])
    })

    it('[CA-03][TC-03.1][SCRUM-677] Una consulta con un email sin dominio no debe enviarse', () => {
        contact.fill({ ...CONSULTA, email: 'qa.contacto' })
        contact.submit()
        contact.verifyRejected(['email'])
    })

    it('[CA-03][TC-03.2][SCRUM-678] Un email con formato valido debe permitir enviar la consulta', () => {
        const consulta = { ...CONSULTA, subject: 'Consulta sobre el email', message: 'Quisiera confirmar que reciben consultas por este medio.' }
        contact.fill(consulta)
        contact.submit()
        contact.verifySent(consulta)
    })

    it('[CA-04][TC-04.1][SCRUM-679] Una consulta con un telefono de 10 digitos no debe enviarse', () => {
        contact.fill({ ...CONSULTA, phone: '0123456789' })
        contact.submit()
        contact.verifyRejected(['phone'])
    })

    it('[CA-04][TC-04.2][SCRUM-680] Una consulta con un asunto de 4 caracteres no debe enviarse', () => {
        contact.fill({ ...CONSULTA, subject: 'Hola' })
        contact.submit()
        contact.verifyRejected(['subject'])
    })

    it('[CA-04][TC-04.3][SCRUM-681] Una consulta con un mensaje de 19 caracteres no debe enviarse', () => {
        contact.fill({ ...CONSULTA, message: 'Disponibilidad hoy?' })
        contact.submit()
        contact.verifyRejected(['message'])
    })

    it('[CA-04][TC-04.4][SCRUM-682] Una consulta con los largos minimos debe enviarse', () => {
        const consulta = { name: 'Qa', email: 'qa.contacto@example.com', phone: '01234567890', subject: 'Salud', message: 'Consulta de 20 letra' }
        contact.fill(consulta)
        contact.submit()
        contact.verifySent(consulta)
    })
})
