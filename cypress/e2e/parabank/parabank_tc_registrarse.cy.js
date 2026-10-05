// Modulo: Cuenta - Registrarse
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-836 (CA-01..CA-04, Test Cycle SCRUM-837)
//
// Base compartida y borrable por cualquiera: cada test usa un usuario
// nuevo; el que necesita un cliente existente lo registra antes.

import ParabankRegisterPage from '../../pages/parabank/ParabankRegisterPage'

const register = new ParabankRegisterPage()

const PASSWORD = 'Qa!Pb2026'
const PHONE = '099123456'
const ALL_REQUIRED = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode', 'ssn', 'username', 'password', 'confirm']

// Usuario, contraseña y confirmación (los datos de acceso del formulario).
const typeAccess = (username, confirm = PASSWORD) => {
    register.type('username', username)
    register.type('password', PASSWORD)
    register.type('confirm', confirm)
}

describe('[SCRUM-836] ParaBank - Registrarse en la banca online', () => {

    // CA-01: Al registrarse con todos los datos obligatorios y un usuario libre, se crea el acceso y se entra a la banca.

    it('[CA-01][TC-01.1][SCRUM-838] Registro con todos los datos, incluido el teléfono', () => {
        cy.pbNewUsername().then(username => {
            register.open()
            register.fillPersonalData()
            register.type('phone', PHONE)
            typeAccess(username)
            register.submit()
            register.verifyRegistered(username)
        })
    })

    it('[CA-01][TC-01.2][SCRUM-839] Registro sin teléfono (dato opcional)', () => {
        cy.pbNewUsername().then(username => {
            register.open()
            register.fillPersonalData()
            typeAccess(username)
            register.submit()
            register.verifyRegistered(username)
        })
    })

    // CA-02: Cada dato obligatorio que falta se avisa con su mensaje debajo del campo y no se crea el acceso.

    it('[CA-02][TC-02.1][SCRUM-840] Registro con el formulario vacío', () => {
        register.open()
        register.submit()
        register.verifyMissing(ALL_REQUIRED)
    })

    it('[CA-02][TC-02.2][SCRUM-841] Registro con los datos personales pero sin usuario, contraseña ni confirmación', () => {
        register.open()
        register.fillPersonalData()
        register.submit()
        register.verifyMissing(['username', 'password', 'confirm'])
    })

    // CA-03: Una confirmación que no es idéntica a la contraseña se avisa con "Passwords did not match." y no se crea el acceso.

    it('[CA-03][TC-03.1][SCRUM-842] Registro con una confirmación distinta de la contraseña', () => {
        cy.pbNewUsername().then(username => {
            register.open()
            register.fillPersonalData()
            typeAccess(username, 'Qa!Pb2027')
            register.submit()
            register.verifyPasswordsMismatch()
        })
    })

    it('[CA-03][TC-03.2][SCRUM-843] Registro con una confirmación que solo cambia las mayúsculas', () => {
        cy.pbNewUsername().then(username => {
            register.open()
            register.fillPersonalData()
            typeAccess(username, PASSWORD.toLowerCase())
            register.submit()
            register.verifyPasswordsMismatch()
        })
    })

    // CA-04: Un nombre de usuario idéntico a uno ya registrado se rechaza con "This username already exists." y no se crea el acceso.

    it('[CA-04][TC-04.1][SCRUM-844] Registro con un usuario ya registrado', () => {
        cy.pbRegisterCustomer().then(customer => {
            register.open()
            register.fillPersonalData()
            typeAccess(customer.username)
            register.submit()
            register.verifyUsernameTaken()
        })
    })

    it('[CA-04][TC-04.2][SCRUM-845] Registro con un usuario que solo cambia las mayúsculas de uno existente', () => {
        cy.pbRegisterCustomer().then(customer => {
            const lowercase = customer.username.toLowerCase()
            register.open()
            register.fillPersonalData()
            typeAccess(lowercase)
            register.submit()
            register.verifyRegistered(lowercase)
        })
    })
})
