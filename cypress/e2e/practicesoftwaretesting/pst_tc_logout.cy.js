// Modulo: Sesion - Cierre de sesion del cliente
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-495 (CA-04/CA-05, Test Cycle SCRUM-496)
//
// Sesion iniciada por API (token en la primera carga) con un cliente
// propio registrado en cada test.

import PSTLoginPage from '../../pages/practicesoftwaretesting/PSTLoginPage'

const login = new PSTLoginPage()

describe('Sesion: cierre de sesion del cliente [SCRUM-495]', () => {

    it('[CA-04][TC-04.1][SCRUM-497] Debe cerrar la sesion desde el menu del usuario', () => {
        login.createCustomer().then(customer => {
            login.startSession(customer)

            login.openUserMenu(customer)
            login.signOut(customer)
        })
    })

    it('[CA-04][TC-04.2][SCRUM-498] Debe permitir volver a iniciar sesion despues de cerrarla', () => {
        login.createCustomer().then(customer => {
            login.startSession(customer)

            login.openUserMenu(customer)
            login.signOut(customer)
            login.clickSignIn()
            login.loginWith(customer.email, customer.password)

            login.verifyLoggedIn(customer)
        })
    })

    it('[CA-05][TC-05.1][SCRUM-499] No debe mostrar My account despues de cerrar sesion', () => {
        login.createCustomer().then(customer => {
            login.startSession(customer)
            login.openUserMenu(customer)
            login.signOut(customer)

            login.openAccount()
            login.verifyRedirectedToLogin()

            login.openAccount()
            login.verifyRedirectedToLogin()
        })
    })

    it('[CA-05][TC-05.2][SCRUM-500] No debe mostrar My account sin haber iniciado sesion', () => {
        login.openAccount()
        login.verifyRedirectedToLogin()

        login.clickHome()
    })

    it('[CA-05][TC-05.3][SCRUM-501] Debe mostrar My account con la sesion iniciada', () => {
        login.createCustomer().then(customer => {
            login.startSession(customer, '/account')

            login.verifyAccountVisible(customer)
            login.openUserMenu(customer)
        })
    })
})
