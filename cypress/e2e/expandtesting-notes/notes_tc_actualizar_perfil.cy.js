// Modulo: Cuenta - Actualizar mi perfil
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-786 (CA-01..CA-04, Test Cycle SCRUM-787)
//
// Cada test registra su propia cuenta por API (nombre Qa Notes, sin
// teléfono ni empresa), entra a "My Notes" con la sesión iniciada y abre
// "Profile" desde el menú.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'
import NotesProfilePage from '../../pages/expandtesting-notes/NotesProfilePage'

const notes = new NotesPage()
const profile = new NotesProfilePage()

const VALID = { name: 'Ana Perfil', phone: '1155554444', company: 'Acme Notas' }

// Paso 1: "Profile" de una cuenta nueva.
const openProfile = () => notes.prepareUser().then(user => {
    notes.visitNotes(user)
    profile.openFromMenu(user)
})

// Cambia un solo campo y guarda esperando el aviso bajo ese campo.
const saveAndExpectError = (field, value, textKey) => {
    openProfile()
    profile.setField(field, value)
    profile.submit()
    profile.verifyFieldError(field, textKey)
}

const saveAndExpectSaved = (field, value) => {
    openProfile()
    profile.setField(field, value)
    profile.submit()
    profile.verifySaved()
}

describe('[SCRUM-786] Notes App - Actualizar mi perfil', () => {

    // CA-01: Al guardar datos válidos, los cambios del perfil quedan guardados.

    it('[CA-01][TC-01.1][SCRUM-788] Guardar nombre, teléfono y empresa válidos', () => {
        openProfile()
        Object.entries(VALID).forEach(([field, value]) => profile.setField(field, value))
        profile.submit()
        profile.verifySaved()
    })

    it('[CA-01][TC-01.2][SCRUM-789] Los cambios del perfil siguen al volver a abrirlo', () => {
        openProfile()
        Object.entries(VALID).forEach(([field, value]) => profile.setField(field, value))
        profile.submit()
        profile.verifySaved()
        profile.reload()
        profile.verifyValues(VALID)
    })

    // CA-02: Al guardar el perfil, un nombre que no tenga entre 4 y 30 caracteres se avisa debajo del campo y el perfil no se actualiza.

    it('[CA-02][TC-02.1][SCRUM-790] No se guarda el perfil sin nombre', () => {
        saveAndExpectError('name', '', 'nameRequired')
    })

    it('[CA-02][TC-02.2][SCRUM-791] No se guarda el perfil con un nombre de 3 caracteres', () => {
        saveAndExpectError('name', 'Ana', 'nameLength')
    })

    it('[CA-02][TC-02.3][SCRUM-792] No se guarda el perfil con un nombre de 31 caracteres', () => {
        saveAndExpectError('name', 'A'.repeat(31), 'nameLength')
    })

    it('[CA-02][TC-02.4][SCRUM-793] Un nombre de 4 caracteres se guarda', () => {
        saveAndExpectSaved('name', 'Anab')
    })

    it('[CA-02][TC-02.5][SCRUM-794] Un nombre de 30 caracteres se guarda', () => {
        saveAndExpectSaved('name', 'A'.repeat(30))
    })

    // CA-03: Al guardar el perfil, un teléfono completado que no tenga entre 8 y 20 dígitos se avisa debajo del campo y el perfil no se actualiza.

    it('[CA-03][TC-03.1][SCRUM-795] No se guarda el perfil con un teléfono de 7 dígitos', () => {
        saveAndExpectError('phone', '1234567', 'phoneLength')
    })

    it('[CA-03][TC-03.2][SCRUM-796] No se guarda el perfil con un teléfono de 21 dígitos', () => {
        saveAndExpectError('phone', '1'.repeat(21), 'phoneLength')
    })

    it('[CA-03][TC-03.3][SCRUM-797] No se guarda el perfil con un teléfono con guiones', () => {
        saveAndExpectError('phone', '11-5555-4444', 'phoneLength')
    })

    it('[CA-03][TC-03.4][SCRUM-798] Un teléfono de 8 dígitos se guarda', () => {
        saveAndExpectSaved('phone', '12345678')
    })

    it('[CA-03][TC-03.5][SCRUM-799] Un teléfono de 20 dígitos se guarda', () => {
        saveAndExpectSaved('phone', '1'.repeat(20))
    })

    // CA-04: Al guardar el perfil, una empresa completada que no tenga entre 4 y 30 caracteres se avisa debajo del campo y el perfil no se actualiza.

    it('[CA-04][TC-04.1][SCRUM-800] No se guarda el perfil con una empresa de 3 caracteres', () => {
        saveAndExpectError('company', 'Acm', 'companyLength')
    })

    it('[CA-04][TC-04.2][SCRUM-801] No se guarda el perfil con una empresa de 31 caracteres', () => {
        saveAndExpectError('company', 'C'.repeat(31), 'companyLength')
    })

    it('[CA-04][TC-04.3][SCRUM-802] Una empresa de 4 caracteres se guarda', () => {
        saveAndExpectSaved('company', 'Acme')
    })

    it('[CA-04][TC-04.4][SCRUM-803] Una empresa de 30 caracteres se guarda', () => {
        saveAndExpectSaved('company', 'C'.repeat(30))
    })
})
