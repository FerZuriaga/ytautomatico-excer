// Modulo: Reservas - No reservar fechas no disponibles
// Sitio bajo prueba: https://automationintesting.online (Restful Booker Platform - habitacion Single)
// Ticket Jira: SCRUM-708 (CA-01..CA-02, Test Cycle SCRUM-709)
//
// Los cuatro casos esperan que la reserva se rechace con un aviso. Hoy la app
// rompe la pagina con fechas ocupadas (SCRUM-714) y confirma fechas pasadas
// (SCRUM-715): quedan en espera hasta que se corrijan.

import RoomBookingPage, { dayFromToday, randomFutureStay } from '../../pages/restful-booker-platform/RoomBookingPage'

const room = new RoomBookingPage()

const OTRO = { firstname: 'Qa Otra', lastname: 'Tester', email: 'qa.otra@example.com', phone: '01234567890' }
const HUESPED = { firstname: 'Qa Reserva', lastname: 'Tester', email: 'qa.reserva@example.com', phone: '01234567890' }

const tryToBook = (stay, guest) => {
    room.open(stay)
    room.openForm()
    room.fillGuest(guest)
    room.submit()
    room.verifyNotAvailable()
}

describe('Reservas: no reservar fechas no disponibles [SCRUM-708]', () => {

    it.skip('[CA-01][TC-01.1][SCRUM-710] No se deben poder reservar las mismas fechas de otra reserva (bug conocido: SCRUM-714)', () => {
        const stay = randomFutureStay(2)
        room.bookByApi(stay)
        tryToBook(stay, OTRO)
    })

    it.skip('[CA-01][TC-01.2][SCRUM-711] No se deben poder reservar fechas que se superponen con otra reserva (bug conocido: SCRUM-714)', () => {
        const previa = randomFutureStay(2)
        room.bookByApi(previa)
        const [y, m, d] = previa.checkin.split('-').map(Number)
        const shifted = n => new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
        tryToBook({ checkin: shifted(1), checkout: shifted(3), nights: 2 }, OTRO)
    })

    it.skip('[CA-02][TC-02.1][SCRUM-712] No se deben poder reservar fechas pasadas (bug conocido: SCRUM-715)', () => {
        tryToBook({ checkin: dayFromToday(-600), checkout: dayFromToday(-598), nights: 2 }, HUESPED)
    })

    it.skip('[CA-02][TC-02.2][SCRUM-713] No se debe poder reservar con un check-in pasado (bug conocido: SCRUM-715)', () => {
        tryToBook({ checkin: dayFromToday(-1), checkout: dayFromToday(3), nights: 4 }, HUESPED)
    })
})
