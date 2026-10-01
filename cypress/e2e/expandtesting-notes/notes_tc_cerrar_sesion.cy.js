// Modulo: Cuenta - Cerrar sesión
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-760 (CA-05..CA-06, Test Cycle SCRUM-761)
//
// Cada test registra su propia cuenta por API, le crea una nota por API y
// entra a "My Notes" con la sesión iniciada.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'
import NotesSessionPage from '../../pages/expandtesting-notes/NotesSessionPage'

const notes = new NotesPage()
const session = new NotesSessionPage()

const MATERIALES = { title: 'Comprar materiales', description: 'Pintura, rodillos y cinta de enmascarar', category: 'Home' }

// Paso 1: "My Notes" con la sesión iniciada y la nota de la precondición.
const openNotesWithSession = () => notes.prepareUser().then(user => {
    notes.seedNotes(user, [MATERIALES])
    session.registerAliases()
    notes.visitNotesWith(user, [MATERIALES.title])
    return cy.wrap(user)
})

describe('[SCRUM-760] Notes App - Cerrar sesión', () => {

    // CA-05: "Logout", desde cualquier pantalla de la app, lleva a la bienvenida.

    it('[CA-05][TC-05.1][SCRUM-762] Cerrar sesión desde My Notes', () => {
        openNotesWithSession()
        session.logout()
        session.verifyWelcome()
    })

    it('[CA-05][TC-05.2][SCRUM-763] Cerrar sesión desde el Perfil', () => {
        notes.prepareUser().then(user => {
            notes.visitNotes(user)
            session.registerAliases()
            session.openProfileFromMenu(user.email)
            session.logout()
            session.verifyWelcome()
        })
    })

    // CA-06: Después de cerrar sesión ya no se pueden ver las notas.

    it('[CA-06][TC-06.1][SCRUM-764] Después de cerrar sesión My Notes no muestra las notas', () => {
        openNotesWithSession()
        session.logout()
        session.verifyWelcome()
        session.visitNotes()
        session.verifyWelcome()
    })

    it('[CA-06][TC-06.2][SCRUM-765] La sesión cerrada no se puede volver a usar', () => {
        openNotesWithSession().then(user => {
            session.logout()
            session.verifyWelcome()
            session.visitNotes({ token: user.token })
            session.verifySessionExpired()
        })
    })
})
