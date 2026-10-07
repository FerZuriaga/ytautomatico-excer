// Modulo: Habitaciones - Crear una habitacion
// Sitio bajo prueba: https://automationintesting.online (Restful Booker Platform - panel de administracion)
// Ticket Jira: SCRUM-1003 (CA-01..CA-03, Test Cycle SCRUM-1004)
//
// La lista de habitaciones es compartida con todos los que usan la demo:
// cada test crea su habitacion con un numero unico y la ubica por ese numero.
// La sesion de administrador se inicia por API (cookie "token").

import AdminRoomsPage, { uniqueRoomName } from '../../pages/restful-booker-platform/AdminRoomsPage'

const rooms = new AdminRoomsPage()

// Alta con numero y precio (los demas campos quedan en su valor inicial).
const createWith = ({ name, price, status }) => {
    rooms.open()
    if (name) rooms.typeName(name)
    rooms.typePrice(price)
    rooms.submit(status)
}

describe('Habitaciones: crear una habitacion [SCRUM-1003]', () => {

    it('[CA-01][TC-01.1][SCRUM-1005] Crear una habitacion con todos sus datos', () => {
        const name = uniqueRoomName()
        rooms.open()
        rooms.typeName(name)
        rooms.selectType('Family')
        rooms.selectAccessible(true)
        rooms.typePrice(180)
        rooms.checkFeature('WiFi')
        rooms.checkFeature('Views')
        rooms.submit(200)
        rooms.verifyRow({ name, type: 'Family', accessible: true, price: 180, features: ['WiFi', 'Views'] })
    })

    it('[CA-01][TC-01.2][SCRUM-1006] Crear una habitacion sin comodidades', () => {
        const name = uniqueRoomName()
        createWith({ name, price: 120, status: 200 })
        rooms.verifyRow({ name, type: 'Single', accessible: false, price: 120, features: [] })
    })

    it('[CA-02][TC-02.1][SCRUM-1007] Crear una habitacion sin numero', () => {
        rooms.open()
        rooms.rowCount().then(before => {
            rooms.typePrice(100)
            rooms.submit(400)
            rooms.verifyCreateRejected('nameRequired')
            rooms.verifyNoNewRow(before)
        })
    })

    it.skip('[CA-02][TC-02.2][SCRUM-1008] Crear una habitacion con un numero de solo espacios (bug conocido: SCRUM-1025)', () => {
        rooms.open()
        rooms.rowCount().then(before => {
            rooms.typeName('   ')
            rooms.typePrice(100)
            rooms.submit(400)
            rooms.verifyCreateRejected('nameRequired')
            rooms.verifyNoNewRow(before)
        })
    })

    it('[CA-03][TC-03.1][SCRUM-1009] Crear una habitacion con precio 0', () => {
        const name = uniqueRoomName()
        createWith({ name, price: 0, status: 400 })
        rooms.verifyCreateRejected('priceMin', name)
    })

    it('[CA-03][TC-03.2][SCRUM-1010] Crear una habitacion con precio 1000', () => {
        const name = uniqueRoomName()
        createWith({ name, price: 1000, status: 400 })
        rooms.verifyCreateRejected('priceMax', name)
    })

    it('[CA-03][TC-03.3][SCRUM-1011] Crear una habitacion con el precio minimo', () => {
        const name = uniqueRoomName()
        createWith({ name, price: 1, status: 200 })
        rooms.verifyRow({ name, type: 'Single', accessible: false, price: 1, features: [] })
    })

    it('[CA-03][TC-03.4][SCRUM-1012] Crear una habitacion con el precio maximo', () => {
        const name = uniqueRoomName()
        createWith({ name, price: 999, status: 200 })
        rooms.verifyRow({ name, type: 'Single', accessible: false, price: 999, features: [] })
    })
})
