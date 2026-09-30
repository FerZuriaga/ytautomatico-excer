// Modulo: Reservas - Reservar una habitacion
// Sitio bajo prueba: https://automationintesting.online (Restful Booker Platform - habitacion Single)
// Ticket Jira: SCRUM-695 (CA-01..CA-04, Test Cycle SCRUM-696)
//
// Visitante sin sesion. Cada test usa fechas futuras al azar (la demo es
// compartida): las fechas de los Test Cases son ejemplos del mismo caso.

import RoomBookingPage, { randomFutureStay } from '../../pages/restful-booker-platform/RoomBookingPage'

const room = new RoomBookingPage()

const HUESPED = { firstname: 'Qa Reserva', lastname: 'Tester', email: 'qa.reserva@example.com', phone: '01234567890' }

// Pasos 1 y 2 de cada TC: la habitacion con las fechas y el formulario abierto.
const openFormFor = stay => {
    room.open(stay)
    room.openForm()
}

describe('Reservas: reservar una habitacion [SCRUM-695]', () => {

    it('[CA-01][TC-01.1][SCRUM-697] Una reserva con datos validos debe confirmarse con las fechas elegidas', () => {
        const stay = randomFutureStay(2)
        openFormFor(stay)
        room.fillGuest(HUESPED)
        room.submit()
        room.verifyConfirmed(stay)
    })

    it('[CA-01][TC-01.2][SCRUM-698] Cancelar el formulario no debe hacer la reserva', () => {
        openFormFor(randomFutureStay(2))
        room.cancel()
    })

    it('[CA-02][TC-02.1][SCRUM-699] El total de 2 noches debe ser 240 libras', () => {
        openFormFor(randomFutureStay(2))
        room.verifyPriceSummary(2)
    })

    it('[CA-02][TC-02.2][SCRUM-700] El total de 1 noche debe ser 140 libras', () => {
        openFormFor(randomFutureStay(1))
        room.verifyPriceSummary(1)
    })

    it('[CA-03][TC-03.1][SCRUM-701] No se debe poder reservar con el formulario vacio', () => {
        openFormFor(randomFutureStay(2))
        room.submit()
        room.verifyRejected([/firstname.*blank/i, /lastname.*blank/i, /must not be empty/i])
    })

    it('[CA-03][TC-03.2][SCRUM-702] No se debe poder reservar sin email', () => {
        openFormFor(randomFutureStay(2))
        room.fillGuest({ ...HUESPED, email: '' })
        room.submit()
        room.verifyRejected([/must not be empty/i])
    })

    it('[CA-04][TC-04.1][SCRUM-703] No se debe poder reservar con un nombre de 2 caracteres', () => {
        openFormFor(randomFutureStay(2))
        room.fillGuest({ ...HUESPED, firstname: 'Qa' })
        room.submit()
        room.verifyRejected([/between 3 and 18/i])
    })

    it('[CA-04][TC-04.2][SCRUM-704] No se debe poder reservar con un apellido de 2 caracteres', () => {
        openFormFor(randomFutureStay(2))
        room.fillGuest({ ...HUESPED, lastname: 'Te' })
        room.submit()
        room.verifyRejected([/between 3 and 30/i])
    })

    it('[CA-04][TC-04.3][SCRUM-705] No se debe poder reservar con un email sin dominio', () => {
        openFormFor(randomFutureStay(2))
        room.fillGuest({ ...HUESPED, email: 'qa.reserva' })
        room.submit()
        room.verifyRejected([/email/i])
    })

    it('[CA-04][TC-04.4][SCRUM-706] No se debe poder reservar con un telefono de 10 digitos', () => {
        openFormFor(randomFutureStay(2))
        room.fillGuest({ ...HUESPED, phone: '0123456789' })
        room.submit()
        room.verifyRejected([/between 11 and 21/i])
    })

    it('[CA-04][TC-04.5][SCRUM-707] Una reserva con los largos minimos debe confirmarse', () => {
        const stay = randomFutureStay(2)
        openFormFor(stay)
        room.fillGuest({ firstname: 'Ana', lastname: 'Paz', email: 'qa.reserva@example.com', phone: '01234567890' })
        room.submit()
        room.verifyConfirmed(stay)
    })
})
