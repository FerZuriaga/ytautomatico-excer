// Modulo: Perfil - Cambiar mi contraseña
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-574 (CA-04..CA-07, Test Cycle SCRUM-575)
//
// Cada test registra su propio cliente por API (contraseña Qa!Sesion2026#);
// la sesion se inyecta en la primera carga de pagina. Las validaciones de la
// contraseña las hace el servicio: cada negativo espera su respuesta.

import PSTProfilePage from '../../pages/practicesoftwaretesting/PSTProfilePage'

const profile = new PSTProfilePage()

const CURRENT = 'Qa!Sesion2026#'
const NEW = 'Nueva!Clave2026x'

describe('Perfil: cambiar mi contraseña [SCRUM-574]', () => {

    let customer

    beforeEach(() => {
        profile.prepareCustomer().then(c => { customer = c })
        profile.open()
        profile.verifyPasswordFormEmpty()
    })

    const change = ({ current, next, confirm }) => {
        if (current) profile.fillPassword('current', current)
        profile.fillPassword('new', next)
        if (confirm) profile.fillPassword('confirm', confirm)
        profile.changePassword()
    }

    it('[CA-04][TC-04.1][SCRUM-576] Debe permitir ingresar con la contraseña nueva', () => {
        change({ current: CURRENT, next: NEW, confirm: NEW })
        profile.verifyPasswordChanged()

        cy.then(() => profile.loginAfterChange(customer, NEW))
        cy.then(() => profile.login.verifyLoggedIn(customer))
    })

    it('[CA-04][TC-04.2][SCRUM-577] Debe rechazar la contraseña anterior despues del cambio', () => {
        change({ current: CURRENT, next: NEW, confirm: NEW })
        profile.verifyPasswordChanged()

        cy.then(() => profile.loginAfterChange(customer, CURRENT))
        profile.login.verifyRejected('Invalid email or password', 401)
    })

    it('[CA-05][TC-05.1][SCRUM-578] Debe rechazar el cambio con una contraseña actual incorrecta', () => {
        change({ current: 'Mala!Clave2026', next: NEW, confirm: NEW })
        profile.verifyPasswordRejected('currentPasswordWrong', 400)
    })

    it('[CA-05][TC-05.2][SCRUM-579] Debe rechazar el cambio sin la contraseña actual', () => {
        change({ next: NEW, confirm: NEW })
        profile.verifyPasswordRejected('currentPasswordWrong', 400)
    })

    it('[CA-06][TC-06.1][SCRUM-580] Debe rechazar una contraseña nueva corta y sin combinacion de caracteres', () => {
        change({ current: CURRENT, next: 'abc', confirm: 'abc' })
        profile.verifyPasswordRejected('passwordWeak', 422)
    })

    it('[CA-06][TC-06.2][SCRUM-581] Debe rechazar una contraseña nueva sin simbolos', () => {
        change({ current: CURRENT, next: 'NuevaClave2026x', confirm: 'NuevaClave2026x' })
        profile.verifyPasswordRejected('passwordNoSymbol', 422)
    })

    it('[CA-06][TC-06.3][SCRUM-582] Debe rechazar repetir la contraseña actual como nueva', () => {
        change({ current: CURRENT, next: CURRENT, confirm: CURRENT })
        profile.verifyPasswordRejected('passwordSameAsCurrent', 400)
    })

    it('[CA-07][TC-07.1][SCRUM-583] Debe rechazar una confirmacion distinta de la contraseña nueva', () => {
        change({ current: CURRENT, next: NEW, confirm: 'Otra!Clave2026x' })
        profile.verifyPasswordRejected('passwordMismatch', 422)
    })

    it('[CA-07][TC-07.2][SCRUM-584] Debe rechazar el cambio sin confirmar la contraseña nueva', () => {
        change({ current: CURRENT, next: NEW })
        profile.verifyPasswordRejected('passwordMismatch', 422)
    })
})
