// Modulo: Sesion - Inicio de sesion del cliente
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-485 (CA-01/CA-02/CA-03, Test Cycle SCRUM-486)
//
// Cada test registra su propio cliente por API: 3 intentos fallidos
// seguidos bloquean la cuenta (nunca usar las cuentas demo compartidas).

import PSTLoginPage from '../../pages/practicesoftwaretesting/PSTLoginPage'

const login = new PSTLoginPage()

describe('Sesion: inicio de sesion del cliente [SCRUM-485]', () => {

    it('[CA-01][TC-01.1][SCRUM-487] Debe iniciar sesion con credenciales validas', () => {
        login.createCustomer().then(customer => {
            login.openFromNav()
            login.loginWith(customer.email, customer.password)

            login.verifyLoggedIn(customer)
        })
    })

    it('[CA-01][TC-01.2][SCRUM-488] Debe rechazar el ingreso con contrasena incorrecta', () => {
        login.createCustomer().then(customer => {
            login.openFromNav()
            login.loginWith(customer.email, 'ClaveIncorrecta9')

            login.verifyRejected('Invalid email or password', 401)
        })
    })

    it('[CA-01][TC-01.3][SCRUM-489] Debe rechazar el ingreso con un email no registrado', () => {
        login.openFromNav()
        login.loginWith('noregistrado.qa@example.com', 'welcome01')

        login.verifyRejected('Invalid email or password', 401)
    })

    it('[CA-02][TC-02.1][SCRUM-490] No debe enviar el formulario vacio', () => {
        login.openFromNav()
        login.submit()

        login.verifyFieldErrors({ email: 'Email is required', password: 'Password is required' })
    })

    it('[CA-02][TC-02.2][SCRUM-491] No debe enviar un email con formato invalido', () => {
        login.openFromNav()
        login.loginWith('cliente.sin.arroba', 'welcome01')

        login.verifyFieldErrors({ email: 'Email format is invalid' })
    })

    it('[CA-02][TC-02.3][SCRUM-492] No debe enviar una contrasena demasiado corta', () => {
        login.openFromNav()
        login.loginWith('cliente.qa@example.com', 'ab')

        login.verifyFieldErrors({ password: 'Password length is invalid' })
    })

    it('[CA-03][TC-03.1][SCRUM-493] Debe bloquear la cuenta tras tres intentos fallidos seguidos', () => {
        login.createCustomer().then(customer => {
            login.failLogins(customer, 3)

            login.openFromNav()
            login.loginWith(customer.email, customer.password)

            login.verifyRejected('Account locked, too many failed attempts. Please contact the administrator.', 423)
        })
    })

    it('[CA-03][TC-03.2][SCRUM-494] Debe reiniciar el contador de intentos con un ingreso exitoso', () => {
        login.createCustomer().then(customer => {
            login.failLogins(customer, 2)
            login.apiLogin(customer.email, customer.password, 200)
            login.failLogins(customer, 2)

            login.openFromNav()
            login.loginWith(customer.email, customer.password)

            login.verifyLoggedIn(customer)
        })
    })
})
