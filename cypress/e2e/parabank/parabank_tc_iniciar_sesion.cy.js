// Modulo: Cuenta - Iniciar sesión
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-846 (CA-05..CA-07, Test Cycle SCRUM-847)
//
// Cada test que necesita un cliente lo registra antes (base compartida y
// borrable) y abre la página de inicio sin sesión.

import ParabankLoginPage from '../../pages/parabank/ParabankLoginPage'

const login = new ParabankLoginPage()

const WRONG_PASSWORD = 'Otra!2026'
// Contraseña de los TC sin cliente (usuario inexistente o vacío).
const ANY_PASSWORD = 'Qa!Pb2026'

// Paso 1 de los TC con cliente: la página de inicio con un cliente registrado.
const openLoginWithCustomer = () => cy.pbRegisterCustomer().then(customer => {
    login.open()
    return cy.wrap(customer)
})

describe('[SCRUM-846] ParaBank - Iniciar sesión en la banca online', () => {

    // CA-05: Al ingresar con el usuario y la contraseña de un cliente, se entra al resumen de cuentas "Accounts Overview".

    it('[CA-05][TC-05.1][SCRUM-848] Ingreso con el usuario y la contraseña correctos', () => {
        openLoginWithCustomer().then(customer => {
            login.typeUsername(customer.username)
            login.typePassword(customer.password)
            login.submit()
            login.verifyLoggedIn(customer)
        })
    })

    it('[CA-05][TC-05.2][SCRUM-849] Ingreso presionando Enter en la contraseña', () => {
        openLoginWithCustomer().then(customer => {
            login.typeUsername(customer.username)
            login.typePassword(customer.password)
            login.submitWithEnter()
            login.verifyLoggedIn(customer)
        })
    })

    // CA-06: Un usuario y una contraseña que no corresponden exactamente a un cliente se rechazan con "The username and password could not be verified.".

    it('[CA-06][TC-06.1][SCRUM-850] Ingreso con una contraseña incorrecta', () => {
        openLoginWithCustomer().then(customer => {
            login.typeUsername(customer.username)
            login.typePassword(WRONG_PASSWORD)
            login.submit()
            login.verifyInvalidCredentials()
        })
    })

    it('[CA-06][TC-06.2][SCRUM-851] Ingreso con un usuario que no existe', () => {
        cy.pbNewUsername().then(username => {
            login.open()
            login.typeUsername(username)
            login.typePassword(ANY_PASSWORD)
            login.submit()
            login.verifyInvalidCredentials()
        })
    })

    it('[CA-06][TC-06.3][SCRUM-852] Ingreso con la contraseña en otras mayúsculas', () => {
        openLoginWithCustomer().then(customer => {
            login.typeUsername(customer.username)
            login.typePassword(customer.password.toLowerCase())
            login.submit()
            login.verifyInvalidCredentials()
        })
    })

    it('[CA-06][TC-06.4][SCRUM-853] Ingreso con el usuario en minúsculas', () => {
        openLoginWithCustomer().then(customer => {
            login.typeUsername(customer.username.toLowerCase())
            login.typePassword(customer.password)
            login.submit()
            login.verifyInvalidCredentials()
        })
    })

    // CA-07: Un ingreso sin usuario o sin contraseña se rechaza con "Please enter a username and password.".

    it('[CA-07][TC-07.1][SCRUM-854] Ingreso sin usuario ni contraseña', () => {
        login.open()
        login.submit()
        login.verifyMissingCredentials()
    })

    it('[CA-07][TC-07.2][SCRUM-855] Ingreso solo con el usuario', () => {
        cy.pbNewUsername().then(username => {
            login.open()
            login.typeUsername(username)
            login.submit()
            login.verifyMissingCredentials()
        })
    })

    it('[CA-07][TC-07.3][SCRUM-856] Ingreso solo con la contraseña', () => {
        login.open()
        login.typePassword(ANY_PASSWORD)
        login.submit()
        login.verifyMissingCredentials()
    })
})
