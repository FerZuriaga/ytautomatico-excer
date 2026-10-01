// Modulo: Cuenta - Iniciar sesión
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-745 (CA-01..CA-04, Test Cycle SCRUM-746)
//
// Cada test registra su propia cuenta por API y abre el login sin sesión
// en el navegador.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'
import NotesSessionPage from '../../pages/expandtesting-notes/NotesSessionPage'

const notes = new NotesPage()
const session = new NotesSessionPage()

const WRONG_PASSWORD = 'Otra!Clave1'
const UNREGISTERED_EMAIL = 'nadie.registrado.2026@example.com'
const PASSWORD_6 = 'Abc123'
const PASSWORD_30 = 'Abcdefghij1234567890Abcdefghij'
const PASSWORD_31 = `${PASSWORD_30}1`

// Paso 1 de cada TC del login: la pantalla de login con una cuenta registrada.
const openLoginWithAccount = () => notes.prepareUser().then(user => {
    session.openLogin()
    return cy.wrap(user)
})

describe('[SCRUM-745] Notes App - Iniciar sesión', () => {

    // CA-01: Solo con el email y la contraseña de una cuenta registrada se entra a "My Notes".

    it('[CA-01][TC-01.1][SCRUM-747] Ingresar con el email y la contraseña de una cuenta registrada', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail(user.email)
            session.typePassword(user.password)
            session.submit()
            session.loginSucceeds()
        })
    })

    it('[CA-01][TC-01.2][SCRUM-748] La sesión iniciada se mantiene al recargar My Notes', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail(user.email)
            session.typePassword(user.password)
            session.submit()
            session.loginSucceeds()
            session.reload()
            session.verifyLoggedIn()
        })
    })

    it('[CA-01][TC-01.3][SCRUM-749] No se ingresa con una contraseña incorrecta', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail(user.email)
            session.typePassword(WRONG_PASSWORD)
            session.submit()
            session.loginRejectedByServer()
        })
    })

    it('[CA-01][TC-01.4][SCRUM-750] No se ingresa con un email que no está registrado', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail(UNREGISTERED_EMAIL)
            session.typePassword(user.password)
            session.submit()
            session.loginRejectedByServer()
        })
    })

    // CA-02: Al iniciar sesión, un email vacío o sin formato válido se avisa debajo del campo y el formulario no se envía.

    it('[CA-02][TC-02.1][SCRUM-751] No se envía el login sin email', () => {
        openLoginWithAccount().then(user => {
            session.typePassword(user.password)
            session.submit()
            session.verifyFieldError('email', 'emailRequired')
        })
    })

    it('[CA-02][TC-02.2][SCRUM-752] No se envía el login con un email sin formato válido', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail('usuario.sin.arroba')
            session.typePassword(user.password)
            session.submit()
            session.verifyFieldError('email', 'emailInvalid')
        })
    })

    // CA-03: Al iniciar sesión, una contraseña vacía o con menos de 6 o más de 30 caracteres se avisa debajo del campo y el formulario no se envía.

    it('[CA-03][TC-03.1][SCRUM-753] No se envía el login sin contraseña', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail(user.email)
            session.submit()
            session.verifyFieldError('password', 'passwordRequired')
        })
    })

    it('[CA-03][TC-03.2][SCRUM-754] No se envía el login con una contraseña de 5 caracteres', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail(user.email)
            session.typePassword('12345')
            session.submit()
            session.verifyFieldError('password', 'passwordLength')
        })
    })

    it('[CA-03][TC-03.3][SCRUM-755] No se envía el login con una contraseña de 31 caracteres', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail(user.email)
            session.typePassword(PASSWORD_31)
            session.submit()
            session.verifyFieldError('password', 'passwordLength')
        })
    })

    it('[CA-03][TC-03.4][SCRUM-756] Una contraseña de 6 caracteres se acepta para intentar el ingreso', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail(user.email)
            session.typePassword(PASSWORD_6)
            session.submit()
            session.verifyPasswordAccepted()
        })
    })

    it('[CA-03][TC-03.5][SCRUM-757] Una contraseña de 30 caracteres se acepta para intentar el ingreso', () => {
        openLoginWithAccount().then(user => {
            session.typeEmail(user.email)
            session.typePassword(PASSWORD_30)
            session.submit()
            session.verifyPasswordAccepted()
        })
    })

    // CA-04: Sin una sesión válida, "My Notes" no muestra ninguna nota.

    it('[CA-04][TC-04.1][SCRUM-758] Sin sesión iniciada My Notes muestra la bienvenida', () => {
        session.visitNotes()
        session.verifyWelcome()
        session.reload()
        session.verifyWelcome()
    })

    it('[CA-04][TC-04.2][SCRUM-759] Con una sesión que ya no es válida My Notes pide volver a ingresar', () => {
        session.visitNotes({ token: 'sesion-que-ya-no-es-valida' })
        session.verifySessionExpired()
        session.reload()
        session.verifyStillOnLogin()
    })
})
