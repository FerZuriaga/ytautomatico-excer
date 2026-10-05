// Modulo: Cuenta - Actualizar los datos de contacto
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-866 (CA-10..CA-11, Test Cycle SCRUM-867)
//
// Cada test registra su propio cliente (teléfono 099111222, ciudad
// Montevideo) con la sesión iniciada.

import ParabankProfilePage from '../../pages/parabank/ParabankProfilePage'

const profile = new ParabankProfilePage()

const REQUIRED = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode']

// Paso 1: "Update Contact Info" con la sesión del cliente.
const openProfile = () => cy.pbRegisterCustomer({ keepSession: true }).then(customer => {
    profile.open()
    return cy.wrap(customer)
})

describe('[SCRUM-866] ParaBank - Actualizar los datos de contacto', () => {

    // CA-10: Los datos actualizados con "Update Profile" se confirman con "Profile Updated" y se ven al volver a abrir "Update Contact Info".

    it('[CA-10][TC-10.1][SCRUM-868] Actualizar la dirección y el teléfono', () => {
        openProfile()
        profile.replace('street', 'Av. Italia 456')
        profile.replace('city', 'Salto')
        profile.replace('phone', '098765432')
        profile.submit()
        profile.verifySaved()
        profile.openFromMenu()
        profile.verifyValues({ street: 'Av. Italia 456', city: 'Salto', phone: '098765432' })
    })

    it('[CA-10][TC-10.2][SCRUM-869] Actualizar el nombre', () => {
        openProfile()
        profile.replace('firstName', 'Ana')
        profile.submit()
        profile.verifySaved()
        profile.openFromMenu()
        profile.verifyValues({ firstName: 'Ana' })
    })

    it('[CA-10][TC-10.3][SCRUM-870] Actualizar dejando el teléfono vacío (dato opcional)', () => {
        openProfile().then(customer => {
            profile.clear('phone')
            profile.submit()
            profile.verifySaved()
            profile.openFromMenu()
            profile.verifyValues({
                phone: '', firstName: customer.firstName, lastName: customer.lastName, street: customer.street,
                city: customer.city, state: customer.state, zipCode: customer.zipCode
            })
        })
    })

    // CA-11: Al actualizar los datos de contacto, cada dato obligatorio vacío se avisa debajo del campo y los datos guardados quedan como estaban.

    it('[CA-11][TC-11.1][SCRUM-871] Actualizar con todos los datos obligatorios vacíos', () => {
        openProfile()
        REQUIRED.forEach(field => profile.clear(field))
        profile.submit()
        profile.verifyMissing(REQUIRED)
    })

    it('[CA-11][TC-11.2][SCRUM-872] Actualizar con la ciudad vacía', () => {
        openProfile().then(customer => {
            profile.clear('city')
            profile.submit()
            profile.verifyMissing(['city'])
            profile.openFromMenu()
            profile.verifyValues({ city: customer.city })
        })
    })

    it.skip('[CA-11][TC-11.3][SCRUM-873] Actualizar con la ciudad compuesta solo por espacios (bug conocido: SCRUM-874)', () => {
        openProfile()
        profile.replace('city', '   ')
        profile.submit()
        profile.verifyMissing(['city'])
    })
})
