// Modulo: Cuenta - Borrar mi cuenta
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-821 (CA-01..CA-05, Test Cycle SCRUM-822)
//
// Cada test registra su propia cuenta por API (contraseña Qa!Notes2026),
// entra a "My Notes" con la sesión iniciada y abre "Profile" desde el menú.
// En CA-03 la cuenta se borra por API, como desde otro dispositivo.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'
import NotesProfilePage from '../../pages/expandtesting-notes/NotesProfilePage'
import NotesAccountPage from '../../pages/expandtesting-notes/NotesAccountPage'
import NotesSessionPage from '../../pages/expandtesting-notes/NotesSessionPage'
import NotesRegisterPage from '../../pages/expandtesting-notes/NotesRegisterPage'

const notes = new NotesPage()
const profile = new NotesProfilePage()
const account = new NotesAccountPage()
const session = new NotesSessionPage()
const register = new NotesRegisterPage()

const MATERIALES = { title: 'Comprar materiales', description: 'Pintura, rodillos y cinta de enmascarar', category: 'Home' }

// El mismo email con otras mayúsculas (qa.notes.N@example.com -> QA.Notes.N@Example.com).
const otherCase = (email) => email.replace('qa.notes.', 'QA.Notes.').replace('@example.com', '@Example.com')

const openProfile = () => notes.prepareUser().then(user => {
    notes.visitNotes(user)
    profile.openFromMenu(user)
    return cy.wrap(user)
})

// Pasos 1 y 2: borrar la cuenta desde el perfil.
const deleteAccount = () => openProfile().then(user => {
    account.openDeleteDialog()
    account.clickDialog('confirm')
    account.verifyDeleted()
    return cy.wrap(user)
})

const loginWith = (email, password) => {
    session.registerAliases()
    session.typeEmail(email)
    session.typePassword(password)
    session.submit()
}

const registerWith = (email, password) => {
    register.open()
    register.fill({ email, name: 'Qa Notes', password, confirmPassword: password })
    register.submit()
}

describe('[SCRUM-821] Notes App - Borrar mi cuenta', () => {

    // CA-01: Al confirmar el borrado de la cuenta, se muestra el login con el aviso "Your account has been deleted. You should create a new account to continue." y la sesión queda cerrada.

    it('[CA-01][TC-01.1][SCRUM-823] Borrar una cuenta sin notas', () => {
        deleteAccount()
    })

    it('[CA-01][TC-01.2][SCRUM-824] Borrar una cuenta que tiene notas', () => {
        notes.prepareUser().then(user => {
            notes.seedNotes(user, [MATERIALES])
            notes.visitNotesWith(user, [MATERIALES.title])
            profile.openFromMenu(user)
            account.openDeleteDialog()
            account.clickDialog('confirm')
            account.verifyDeleted()
        })
    })

    // CA-02: Después de borrar la cuenta, ingresar con su email y contraseña se rechaza con el aviso de email o contraseña incorrectos.

    it('[CA-02][TC-02.1][SCRUM-825] No se ingresa con el email y la contraseña de una cuenta borrada', () => {
        deleteAccount().then(user => {
            loginWith(user.email, user.password)
            session.loginRejectedByServer()
        })
    })

    it('[CA-02][TC-02.2][SCRUM-826] No se ingresa con el email de una cuenta borrada escrito con otras mayúsculas', () => {
        deleteAccount().then(user => {
            loginWith(otherCase(user.email), user.password)
            session.loginRejectedByServer()
        })
    })

    // CA-03: Después de borrar la cuenta, una sesión que había quedado abierta en otro dispositivo lleva al login con el aviso "Your session has expired. Please login again to continue." al cargar cualquier pantalla.

    it('[CA-03][TC-03.1][SCRUM-827] La sesión abierta de una cuenta borrada no muestra My Notes', () => {
        notes.prepareUser().then(user => {
            notes.visitNotes(user)
            account.deleteByApi(user)
            session.reload()
            session.verifySessionExpired()
        })
    })

    it('[CA-03][TC-03.2][SCRUM-828] La sesión abierta de una cuenta borrada no muestra el perfil', () => {
        openProfile().then(user => {
            account.deleteByApi(user)
            session.reload()
            session.verifySessionExpired()
            profile.verifyNotShown()
        })
    })

    // CA-04: Al cancelar o cerrar el diálogo de confirmación, la cuenta no se borra y se sigue en el perfil con la sesión iniciada.

    it('[CA-04][TC-04.1][SCRUM-829] Cancelar el borrado de la cuenta', () => {
        openProfile()
        account.openDeleteDialog()
        account.clickDialog('cancel')
        account.verifyNotDeleted()
    })

    it('[CA-04][TC-04.2][SCRUM-830] Cerrar con la X el diálogo de borrado de la cuenta', () => {
        openProfile()
        account.openDeleteDialog()
        account.clickDialog('close')
        account.verifyNotDeleted()
    })

    // CA-05: Después de borrar la cuenta, registrarse con su email crea una cuenta nueva.

    it('[CA-05][TC-05.1][SCRUM-831] Registrar una cuenta nueva con el email de una cuenta borrada', () => {
        deleteAccount().then(user => {
            registerWith(user.email, user.password)
            register.verifyCreated()
        })
    })

    it('[CA-05][TC-05.2][SCRUM-832] Registrar una cuenta nueva con el email de una cuenta borrada escrito con otras mayúsculas', () => {
        deleteAccount().then(user => {
            registerWith(otherCase(user.email), user.password)
            register.verifyCreated()
        })
    })
})
