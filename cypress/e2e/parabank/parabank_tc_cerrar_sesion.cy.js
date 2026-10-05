// Modulo: Cuenta - Cerrar sesión
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-858 (CA-08..CA-09, Test Cycle SCRUM-859)
//
// Cada test registra su propio cliente. Los que parten de la sesión
// iniciada la reciben de la receta (cy.pbRegisterCustomer con keepSession).

import ParabankRegisterPage from '../../pages/parabank/ParabankRegisterPage'
import ParabankSessionPage from '../../pages/parabank/ParabankSessionPage'

const register = new ParabankRegisterPage()
const session = new ParabankSessionPage()

const PASSWORD = 'Qa!Pb2026'

// Pasos 1 y 2 de los TC de CA-09: salir desde "Update Contact Info".
const logoutFromProfile = () => {
    cy.pbRegisterCustomer({ keepSession: true })
    session.openProfile()
    session.logout()
    session.verifyLoggedOut()
}

describe('[SCRUM-858] ParaBank - Cerrar sesión en la banca online', () => {

    // CA-08: Al hacer clic en "Log Out" se vuelve a la página de inicio con el panel "Customer Login" y sin el menú "Account Services".

    it('[CA-08][TC-08.1][SCRUM-860] Cerrar sesión desde la bienvenida del registro', () => {
        cy.pbNewUsername().then(username => {
            register.open()
            register.register(username, PASSWORD)
            register.verifyRegistered(username)
            session.logout()
            session.verifyLoggedOut()
        })
    })

    it('[CA-08][TC-08.2][SCRUM-861] Cerrar sesión desde Update Contact Info', () => {
        cy.pbRegisterCustomer({ keepSession: true })
        session.openProfile()
        session.logout()
        session.verifyLoggedOut()
    })

    // CA-09: Después de cerrar sesión, las páginas de la cuenta no muestran datos ni opciones del cliente y solo ofrecen el panel "Customer Login".

    it('[CA-09][TC-09.1][SCRUM-862] El resumen de cuentas no se muestra después de cerrar sesión', () => {
        logoutFromProfile()
        session.visitAccountPage('overview')
        session.verifyNoCustomerData()
    })

    it('[CA-09][TC-09.2][SCRUM-863] Transferir fondos no está disponible después de cerrar sesión', () => {
        logoutFromProfile()
        session.visitAccountPage('transfer')
        session.verifyNoCustomerData()
    })

    it('[CA-09][TC-09.3][SCRUM-864] Abrir una cuenta nueva no está disponible después de cerrar sesión', () => {
        logoutFromProfile()
        session.visitAccountPage('openAccount')
        session.verifyNoCustomerData()
    })
})
