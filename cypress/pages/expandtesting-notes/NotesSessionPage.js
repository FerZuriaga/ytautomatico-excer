import { notesSelectors } from './notesSelectors'
const FIXTURE = 'selectors/expandtesting-notes/sesion.json'

const T = { timeout: 15000 }

// Login, logout y acceso a "My Notes" según la sesión. La cuenta se
// registra por API (NotesPage.prepareUser) y el navegador arranca sin
// sesión: el token que devuelve la API solo se inyecta cuando el TC parte
// de una sesión iniciada.
class NotesSessionPage {

    registerAliases() {
        notesSelectors(FIXTURE).then(sel => {
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.loginPath }).as('login')
            cy.intercept({ method: 'DELETE', hostname: sel.api.host, pathname: sel.api.logoutPath }).as('logout')
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.profilePath }).as('profile')
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.notesPath }).as('sessionNotes')
        })
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    openLogin() {
        this.registerAliases()
        notesSelectors(FIXTURE).then(sel => {
            cy.gotoNotesUrl(sel.paths.login)
            cy.contains('h1', sel.texts.loginTitle, T).should('be.visible')
            cy.get(sel.login.email, T).should('be.visible')
            cy.get(sel.login.password).should('be.visible')
            cy.get(sel.login.submit).should('be.visible')
        })
    }

    // "Login" desde la bienvenida (después de cerrar sesión). El link no
    // tiene atributo de test: open-login-view es el contenedor de "Login" y
    // "Create an account".
    openLoginFromWelcome() {
        notesSelectors(FIXTURE).then(sel => {
            cy.get(sel.welcome.actions).contains('a', sel.texts.loginButton).click()
            cy.location('pathname', T).should('eq', sel.paths.login)
            cy.get(sel.login.email, T).should('be.visible')
            cy.get(sel.login.password).should('be.visible')
            cy.get(sel.login.submit).should('be.visible')
        })
    }

    typeEmail(email) {
        notesSelectors(FIXTURE).then(sel => cy.get(sel.login.email).type(email).should('have.value', email))
    }

    typePassword(password) {
        notesSelectors(FIXTURE).then(sel => {
            cy.get(sel.login.password).type(password, { log: false })
                .should('have.value', password)
                .and('have.attr', 'type', 'password')
        })
    }

    submit() {
        notesSelectors(FIXTURE).then(sel => cy.get(sel.login.submit).click())
    }

    // "My Notes" con la sesión iniciada: pestañas de categorías, "+ Add
    // Note", "Logout" en el menú y token guardado.
    verifyLoggedIn() {
        notesSelectors(FIXTURE).then(sel => {
            cy.location('pathname', T).should('eq', sel.paths.notes)
            cy.get(sel.notes.addNote, T).should('be.visible')
            sel.notes.categoryTabs.forEach(tab => cy.get(tab).should('be.visible'))
            cy.get(sel.menu.logout).should('be.visible')
            cy.window().its('localStorage').invoke('getItem', 'token').should('be.a', 'string').and('not.be.empty')
        })
    }

    loginSucceeds() {
        cy.wait('@login', T).its('response.statusCode').should('eq', 200)
        cy.wait('@sessionNotes', T)
        this.verifyLoggedIn()
    }

    // Cuenta recién creada: "My Notes" vacío.
    verifyNoNotes() {
        notesSelectors(FIXTURE).then(sel => {
            cy.contains(sel.texts.noNotesAll, T).should('be.visible')
            cy.get(sel.notes.card).should('not.exist')
        })
    }

    // Rechazo del servidor: el aviso es el motivo que devuelve el servicio
    // (no se copia el texto) y se sigue en el login, sin sesión.
    loginRejectedByServer() {
        notesSelectors(FIXTURE).then(sel => {
            cy.wait('@login', T).then(({ response }) => {
                expect(response.statusCode, 'credenciales rechazadas').to.eq(401)
                cy.get(sel.login.alert, T).should('be.visible').and('have.text', response.body.message)
            })
            this.verifyStillOnLogin()
        })
    }

    // Validación del formulario: aviso bajo el campo y ningún pedido de
    // ingreso al servidor.
    verifyFieldError(field, textKey) {
        notesSelectors(FIXTURE).then(sel => {
            cy.get(sel.login[field]).should('have.class', 'is-invalid')
                .parent().find(sel.login.error).should('be.visible').and('have.text', sel.texts[textKey])
            cy.get('@login.all').should('have.length', 0)
            this.verifyStillOnLogin()
        })
    }

    // El largo de la contraseña se aceptó: sin aviso bajo el campo y el
    // ingreso se intentó (la contraseña no es la de la cuenta, el servidor
    // lo rechaza).
    verifyPasswordAccepted() {
        notesSelectors(FIXTURE).then(sel => {
            cy.wait('@login', T).its('response.statusCode').should('eq', 401)
            cy.get(sel.login.password).should('not.have.class', 'is-invalid')
            cy.get(sel.login.alert, T).should('be.visible')
        })
    }

    verifyStillOnLogin() {
        notesSelectors(FIXTURE).then(sel => {
            cy.location('pathname').should('eq', sel.paths.login)
            cy.get(sel.login.submit).should('be.visible')
            cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
        })
    }

    // ─── Sesión desde "My Notes" ──────────────────────────────────────────────

    // Entrar a "My Notes" escribiendo la dirección, con o sin token.
    visitNotes({ token } = {}) {
        this.registerAliases()
        notesSelectors(FIXTURE).then(sel => cy.gotoNotesUrl(sel.paths.notes, token ? { token } : {}))
    }

    openProfileFromMenu(email) {
        notesSelectors(FIXTURE).then(sel => {
            cy.get(sel.menu.profile).click()
            cy.wait('@profile', T)
            cy.location('pathname').should('eq', sel.paths.profile)
            cy.get(sel.profile.email, T).should('have.value', email)
            cy.get(sel.menu.logout).should('be.visible')
        })
    }

    logout() {
        notesSelectors(FIXTURE).then(sel => {
            cy.get(sel.menu.logout).click()
            cy.wait('@logout', T).its('response.statusCode').should('eq', 200)
        })
    }

    // Bienvenida: "Welcome to Notes App" con Login y Create an account, sin
    // notas ni "Logout".
    verifyWelcome() {
        notesSelectors(FIXTURE).then(sel => {
            cy.contains(sel.welcome.heading, sel.texts.welcome, T).should('be.visible')
            cy.get(sel.welcome.actions).should('be.visible')
                .and('contain.text', sel.texts.loginButton)
                .and('contain.text', sel.texts.createAccount)
            cy.get(sel.menu.logout).should('not.exist')
            cy.get(sel.notes.card).should('not.exist')
            cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
        })
    }

    // Sesión que ya no es válida: login con el aviso de volver a ingresar y
    // sin notas. Se afirma por pantalla y no con cy.wait: en los TC que
    // parten de una sesión iniciada el alias ya tiene el GET /notes 200 de
    // la carga anterior.
    verifySessionExpired() {
        notesSelectors(FIXTURE).then(sel => {
            cy.location('pathname', T).should('eq', sel.paths.login)
            cy.contains(sel.texts.sessionExpired, T).should('be.visible')
            cy.get(sel.notes.card).should('not.exist')
        })
    }

    reload() {
        cy.reload()
    }
}

export default NotesSessionPage
