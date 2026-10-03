// Modulo: Cuenta - Cambiar mi contraseña
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-804 (CA-01..CA-06, Test Cycle SCRUM-805)
// Defecto conocido: SCRUM-833 (las sesiones abiertas antes del cambio siguen activas).
//
// Cada test registra su propia cuenta por API (contraseña Qa!Notes2026),
// entra a "My Notes" con la sesión iniciada, abre "Profile" desde el menú
// y después la pestaña "Change password".

import NotesPage from '../../pages/expandtesting-notes/NotesPage'
import NotesProfilePage from '../../pages/expandtesting-notes/NotesProfilePage'
import NotesPasswordPage from '../../pages/expandtesting-notes/NotesPasswordPage'
import NotesSessionPage from '../../pages/expandtesting-notes/NotesSessionPage'

const notes = new NotesPage()
const profile = new NotesProfilePage()
const password = new NotesPasswordPage()
const session = new NotesSessionPage()

const NEW = 'Nueva!2026x'

// Paso 1: pestaña "Change password" de una cuenta nueva.
const openChangePassword = () => notes.prepareUser().then(user => {
    notes.visitNotes(user)
    profile.openFromMenu(user)
    password.openTab()
    return cy.wrap(user)
})

// Completa solo los campos indicados (un campo vacío no se toca) y envía.
const fillAndSubmit = (values) => {
    Object.entries(values).forEach(([field, value]) => password.type(field, value))
    password.submit()
}

const changeFrom = (user, newPassword = NEW) => fillAndSubmit({ current: user.password, new: newPassword, confirm: newPassword })

// Después del cambio: cerrar sesión e intentar ingresar con `loginPassword`.
const logoutAndLogin = (user, loginPassword) => {
    session.registerAliases()
    session.logout()
    session.verifyWelcome()
    session.openLoginFromWelcome()
    session.typeEmail(user.email)
    session.typePassword(loginPassword)
    session.submit()
}

describe('[SCRUM-804] Notes App - Cambiar mi contraseña', () => {

    // CA-01: Al cambiar la contraseña con la actual correcta y una nueva válida, desde ese momento se ingresa con la nueva y la anterior deja de servir.

    it('[CA-01][TC-01.1][SCRUM-806] Cambiar la contraseña con la actual correcta y una nueva válida', () => {
        openChangePassword().then(user => {
            changeFrom(user)
            password.verifyChanged()
        })
    })

    it('[CA-01][TC-01.2][SCRUM-807] Después del cambio se ingresa con la contraseña nueva', () => {
        openChangePassword().then(user => {
            changeFrom(user)
            password.verifyChanged()
            logoutAndLogin(user, NEW)
            session.loginSucceeds()
        })
    })

    it('[CA-01][TC-01.3][SCRUM-808] Después del cambio la contraseña anterior ya no sirve para ingresar', () => {
        openChangePassword().then(user => {
            changeFrom(user)
            password.verifyChanged()
            logoutAndLogin(user, user.password)
            session.loginRejectedByServer()
        })
    })

    // CA-02: Al cambiar la contraseña, una contraseña actual que no sea la vigente se rechaza con el aviso de que la contraseña actual es incorrecta y la contraseña no cambia.

    it('[CA-02][TC-02.1][SCRUM-810] No se cambia la contraseña con una contraseña actual incorrecta', () => {
        openChangePassword()
        fillAndSubmit({ current: 'Otra!Clave1', new: NEW, confirm: NEW })
        password.verifyRejectedByServer('currentIncorrect')
    })

    it('[CA-02][TC-02.2][SCRUM-834] No se cambia la contraseña con la contraseña actual escrita con otras mayúsculas', () => {
        openChangePassword().then(user => {
            fillAndSubmit({ current: user.password.toUpperCase(), new: NEW, confirm: NEW })
            password.verifyRejectedByServer('currentIncorrect')
        })
    })

    // CA-03: Al cambiar la contraseña, una contraseña nueva que no tenga entre 6 y 30 caracteres se avisa debajo del campo y la contraseña no cambia.

    it('[CA-03][TC-03.1][SCRUM-813] No se cambia la contraseña sin una contraseña nueva', () => {
        openChangePassword().then(user => {
            fillAndSubmit({ current: user.password })
            password.verifyFieldError('new', 'newRequired')
        })
    })

    it('[CA-03][TC-03.2][SCRUM-814] No se cambia la contraseña con una contraseña nueva de 5 caracteres', () => {
        openChangePassword().then(user => {
            changeFrom(user, 'Ab!12')
            password.verifyFieldError('new', 'newLength')
        })
    })

    it('[CA-03][TC-03.3][SCRUM-815] Una contraseña nueva de 6 caracteres se acepta', () => {
        openChangePassword().then(user => {
            changeFrom(user, 'Ab!123')
            password.verifyChanged()
        })
    })

    it('[CA-03][TC-03.4][SCRUM-816] Una contraseña nueva de 30 caracteres se acepta', () => {
        openChangePassword().then(user => {
            changeFrom(user, `${'A'.repeat(29)}!`)
            password.verifyChanged()
        })
    })

    it('[CA-03][TC-03.5][SCRUM-817] No se cambia la contraseña con una contraseña nueva de 31 caracteres', () => {
        openChangePassword().then(user => {
            changeFrom(user, `${'A'.repeat(30)}!`)
            password.verifyFieldError('new', 'newLength')
        })
    })

    // CA-04: Al cambiar la contraseña, una confirmación que no coincida con la contraseña nueva se avisa debajo del campo y la contraseña no cambia.

    it('[CA-04][TC-04.1][SCRUM-818] No se cambia la contraseña con una confirmación distinta', () => {
        openChangePassword().then(user => {
            fillAndSubmit({ current: user.password, new: NEW, confirm: 'Nueva!2026y' })
            password.verifyFieldError('confirm', 'mismatch')
        })
    })

    it('[CA-04][TC-04.2][SCRUM-819] No se cambia la contraseña sin la confirmación', () => {
        openChangePassword().then(user => {
            fillAndSubmit({ current: user.password, new: NEW })
            password.verifyFieldError('confirm', 'confirmRequired')
        })
    })

    // CA-05: Al cambiar la contraseña, una contraseña nueva igual a la actual se rechaza con el aviso de que la nueva tiene que ser distinta de la actual y la contraseña no cambia.

    it('[CA-05][TC-05.1][SCRUM-809] No se acepta una contraseña nueva igual a la actual', () => {
        openChangePassword().then(user => {
            changeFrom(user, user.password)
            password.verifyRejectedByServer('sameAsCurrent')
        })
    })

    it('[CA-05][TC-05.2][SCRUM-820] Una contraseña nueva que solo cambia mayúsculas se acepta', () => {
        openChangePassword().then(user => {
            changeFrom(user, user.password.toUpperCase())
            password.verifyChanged()
        })
    })

    // CA-06: Al cambiar la contraseña, una contraseña actual que no tenga entre 6 y 30 caracteres se avisa debajo del campo y la contraseña no cambia.

    it('[CA-06][TC-06.1][SCRUM-811] No se cambia la contraseña sin la contraseña actual', () => {
        openChangePassword()
        fillAndSubmit({ new: NEW, confirm: NEW })
        password.verifyFieldError('current', 'currentRequired')
    })

    it('[CA-06][TC-06.2][SCRUM-812] No se cambia la contraseña con una contraseña actual de 5 caracteres', () => {
        openChangePassword()
        fillAndSubmit({ current: 'Qa!No', new: NEW, confirm: NEW })
        password.verifyFieldError('current', 'currentLength')
    })
})
