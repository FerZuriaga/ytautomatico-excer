// Modulo: Habitaciones - Editar una habitacion
// Sitio bajo prueba: https://automationintesting.online (Restful Booker Platform - panel de administracion)
// Ticket Jira: SCRUM-1013 (CA-04..CA-07, Test Cycle SCRUM-1014)
//
// Cada test crea por API su habitacion (numero unico, Double, no accesible,
// precio 120, WiFi) y la abre desde la lista del panel: la demo es
// compartida y se reinicia cada pocos minutos.

import AdminRoomsPage from '../../pages/restful-booker-platform/AdminRoomsPage'
import AdminMessagesPage from '../../pages/restful-booker-platform/AdminMessagesPage'

const rooms = new AdminRoomsPage()
const panel = new AdminMessagesPage()

// Paso 1 y "Edit": el formulario de edicion de la habitacion de la precondicion.
const editSeedRoom = () => panel.adminToken()
    .then(token => rooms.createRoomByApi(token))
    .then(room => {
        rooms.openDetail(room)
        rooms.clickEdit()
        return cy.wrap(room)
    })

describe('Habitaciones: editar una habitacion [SCRUM-1013]', () => {

    it('[CA-04][TC-04.1][SCRUM-1015] Guardar los cambios de una habitacion', () => {
        editSeedRoom().then(room => {
            rooms.replacePrice(210)
            rooms.selectEditType('Suite')
            rooms.checkEditFeature('TV')
            rooms.replaceDescription('Suite renovada con vista.')
            rooms.update(202)
            rooms.verifyEditClosed()
            rooms.verifyDetail({ name: room.roomName, type: 'Suite', price: 210, description: 'Suite renovada con vista.', features: ['WiFi', 'TV'] })
        })
    })

    it('[CA-04][TC-04.2][SCRUM-1016] El cambio guardado se ve en la lista de habitaciones', () => {
        editSeedRoom().then(room => {
            rooms.replacePrice(210)
            rooms.update(202)
            rooms.verifyDetail({ name: room.roomName, type: room.type, price: 210 })
            rooms.openRoomsFromMenu()
            rooms.verifyRow({ name: room.roomName, type: room.type, accessible: room.accessible, price: 210, features: room.features })
        })
    })

    it('[CA-05][TC-05.1][SCRUM-1017] Guardar una habitacion sin numero', () => {
        editSeedRoom().then(room => {
            rooms.replaceName('')
            rooms.update(400)
            rooms.verifyUpdateRejected()
            rooms.reload(room)
        })
    })

    it.skip('[CA-05][TC-05.2][SCRUM-1018] Guardar una habitacion con un numero de solo espacios (bug conocido: SCRUM-1025)', () => {
        editSeedRoom().then(room => {
            rooms.replaceName('   ')
            rooms.update(400)
            rooms.verifyUpdateRejected()
            rooms.reload(room)
        })
    })

    it('[CA-06][TC-06.1][SCRUM-1019] Guardar una habitacion con precio 0', () => {
        editSeedRoom().then(room => {
            rooms.replacePrice(0)
            rooms.update(400)
            rooms.verifyUpdateRejected()
            rooms.reload(room)
        })
    })

    it('[CA-06][TC-06.2][SCRUM-1020] Guardar una habitacion con precio 1000', () => {
        editSeedRoom().then(room => {
            rooms.replacePrice(1000)
            rooms.update(400)
            rooms.verifyUpdateRejected()
            rooms.reload(room)
        })
    })

    it('[CA-06][TC-06.3][SCRUM-1021] Guardar una habitacion con el precio maximo', () => {
        editSeedRoom().then(room => {
            rooms.replacePrice(999)
            rooms.update(202)
            rooms.verifyEditClosed()
            rooms.verifyDetail({ name: room.roomName, type: room.type, price: 999 })
        })
    })

    it.skip('[CA-07][TC-07.1][SCRUM-1022] Cancelar la edicion deja el detalle con los datos guardados (bug conocido: SCRUM-1024)', () => {
        editSeedRoom().then(room => {
            rooms.replacePrice(300)
            rooms.cancel()
            rooms.verifyDetail({ name: room.roomName, type: room.type, price: room.roomPrice })
        })
    })

    it('[CA-07][TC-07.2][SCRUM-1023] Los cambios cancelados no se guardan', () => {
        editSeedRoom().then(room => {
            rooms.replacePrice(300)
            rooms.cancel()
            rooms.reload(room)
        })
    })
})
