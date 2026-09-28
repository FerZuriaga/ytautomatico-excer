// Modulo: Perfil - Actualizar mis datos personales
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-565 (CA-01..CA-03, Test Cycle SCRUM-566)
//
// Cada test registra su propio cliente por API (nombre Qa, calle Calle 1,
// telefono 123456789); la sesion se inyecta en la primera carga de pagina.

import PSTProfilePage from '../../pages/practicesoftwaretesting/PSTProfilePage'

const profile = new PSTProfilePage()

describe('Perfil: actualizar mis datos personales [SCRUM-565]', () => {

    let customer

    beforeEach(() => {
        profile.prepareCustomer().then(c => { customer = c })
        profile.open()
        cy.then(() => profile.verifyCurrentData(customer))
    })

    it('[CA-01][TC-01.1][SCRUM-567] Debe guardar el nombre modificado en la cuenta', () => {
        profile.fill('firstName', 'Juana')
        profile.updateProfile()
        profile.verifyProfileSaved()

        profile.reload()
        profile.verifyField('firstName', 'Juana')
        cy.then(() => profile.verifyMenuName(`Juana ${customer.lastName}`))
    })

    it('[CA-01][TC-01.2][SCRUM-568] Debe guardar la calle modificada en la cuenta', () => {
        profile.fill('street', 'Av Colon 100')
        profile.updateProfile()
        profile.verifyProfileSaved()

        profile.reload()
        profile.verifyField('street', 'Av Colon 100')
    })

    it('[CA-02][TC-02.1][SCRUM-569] Debe rechazar guardar el perfil con el nombre vacio', () => {
        profile.clearField('firstName')
        profile.updateProfile()
        profile.verifyProfileRejected('profileInvalid', 'firstName')

        profile.reload()
        profile.verifyField('firstName', 'Qa')
    })

    it('[CA-02][TC-02.2][SCRUM-570] Debe rechazar guardar el perfil con la calle vacia', () => {
        profile.clearField('street')
        profile.updateProfile()
        profile.verifyProfileRejected('profileInvalid', 'street')

        profile.reload()
        profile.verifyField('street', 'Calle 1')
    })

    it('[CA-03][TC-03.1][SCRUM-571] Debe rechazar un telefono con letras', () => {
        profile.fill('phone', 'abc123')
        profile.updateProfile()
        profile.verifyProfileRejected('phoneInvalid', 'phone')

        profile.reload()
        profile.verifyField('phone', '123456789')
    })

    it('[CA-03][TC-03.2][SCRUM-572] Debe rechazar un telefono de menos de 7 digitos', () => {
        profile.fill('phone', '12345')
        profile.updateProfile()
        profile.verifyProfileRejected('phoneInvalid', 'phone')

        profile.reload()
        profile.verifyField('phone', '123456789')
    })

    it('[CA-03][TC-03.3][SCRUM-573] Debe guardar un telefono con formato internacional', () => {
        profile.fill('phone', '+54 351 555-1234')
        profile.updateProfile()
        profile.verifyProfileSaved()

        profile.reload()
        profile.verifyField('phone', '+54 351 555-1234')
    })
})
