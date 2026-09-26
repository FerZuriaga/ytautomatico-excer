const FIXTURE = 'selectors/practicesoftwaretesting/login.json'

const T = { timeout: 15000 }

const JSON_HEADERS = { Accept: 'application/json' }

// Pantalla Login y menú del usuario (sesión). Cada test usa un cliente
// propio registrado por API: 3 intentos fallidos bloquean la cuenta, así
// que nunca se prueba contra las cuentas demo compartidas.
class PSTLoginPage {

    // ─── Precondiciones por API ───────────────────────────────────────────────

    // Registra un cliente nuevo con email único y lo devuelve.
    createCustomer() {
        const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`
        const customer = {
            firstName: 'Qa',
            lastName: `Sesion${unique.slice(-6)}`,
            email: `qa.sesion.${unique}@example.com`,
            password: 'Qa!Sesion2026#'
        }
        customer.fullName = `${customer.firstName} ${customer.lastName}`
        return cy.fixture(FIXTURE).then(sel => {
            cy.request({
                method: 'POST',
                url: `https://${sel.api.host}${sel.api.registerPath}`,
                headers: JSON_HEADERS,
                body: {
                    first_name: customer.firstName, last_name: customer.lastName, dob: '1990-01-01',
                    phone: '123456789', email: customer.email, password: customer.password,
                    address: { street: 'Calle 1', city: 'Cordoba', state: 'Cordoba', country: 'AR', postal_code: '5000' }
                }
            }).its('status').should('eq', 201)
            return cy.wrap(customer)
        })
    }

    // Intento de login por API; `expectedStatus` confirma que el intento
    // quedó registrado como fallido (401) o exitoso (200).
    apiLogin(email, password, expectedStatus) {
        return cy.fixture(FIXTURE).then(sel => cy.request({
            method: 'POST',
            url: `https://${sel.api.host}${sel.api.loginPath}`,
            headers: JSON_HEADERS,
            body: { email, password },
            failOnStatusCode: false
        }).then(res => {
            expect(res.status, `login por API de ${email}`).to.eq(expectedStatus)
            return res.body
        }))
    }

    failLogins(customer, times) {
        Cypress._.times(times, () => this.apiLogin(customer.email, 'ClaveIncorrecta9', 401))
    }

    // Sesión iniciada: el token se guarda solo en la próxima carga de
    // página (once), para que un Sign out posterior no lo reponga.
    startSession(customer, route = '/') {
        this.apiLogin(customer.email, customer.password, 200).then(({ access_token }) => {
            cy.fixture(FIXTURE).then(sel => {
                cy.once('window:before:load', win => win.localStorage.setItem(sel.tokenKey, access_token))
                cy.gotoPSTUrl(route)
            })
        })
    }

    // ─── Pantalla Login ───────────────────────────────────────────────────────

    openFromNav() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept('POST', `https://${sel.api.host}${sel.api.loginPath}`).as('login')
            cy.gotoPSTUrl('/')
            cy.get(sel.navSignIn, T).click()
        })
        this.verifyEmptyForm()
    }

    verifyEmptyForm() {
        cy.fixture(FIXTURE).then(sel => {
            cy.location('pathname', T).should('eq', sel.path)
            cy.contains('h1, h2, h3', sel.texts.loginTitle, T).should('be.visible')
            cy.get(sel.email, T).should('be.visible').and('have.value', '')
            cy.get(sel.password).should('be.visible').and('have.value', '')
            cy.get(sel.submit).should('be.visible')
        })
    }

    typeEmail(email) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.email, T).type(email).should('have.value', email))
    }

    typePassword(password) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.password, T).type(password, { log: false }).should('have.value', password).and('have.attr', 'type', 'password')
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.submit, T).click())
    }

    loginWith(email, password) {
        this.typeEmail(email)
        this.typePassword(password)
        this.submit()
    }

    // ─── Resultados ───────────────────────────────────────────────────────────

    verifyLoggedIn(customer) {
        cy.fixture(FIXTURE).then(sel => {
            cy.location('pathname', T).should('eq', sel.accountPath)
            cy.get(sel.pageTitle, T).should('have.text', sel.texts.accountTitle)
            cy.get(sel.navMenu, T).should('contain.text', customer.fullName)
            cy.get(sel.navSignIn).should('not.exist')
        })
    }

    // Rechazo del servidor: se espera la respuesta del login antes de
    // afirmar que la sesión no se inició.
    verifyRejected(message, status) {
        cy.wait('@login', T).its('response.statusCode').should('eq', status)
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.loginError, T).should('be.visible').and('contain.text', message)
            cy.location('pathname').should('eq', sel.path)
            cy.get(sel.navSignIn).should('be.visible')
            cy.get(sel.navMenu).should('not.exist')
        })
    }

    // Rechazo del formulario: los mensajes están y no salió ningún login.
    verifyFieldErrors({ email, password }) {
        cy.fixture(FIXTURE).then(sel => {
            if (email) cy.get(sel.emailError, T).should('be.visible').and('contain.text', email)
            else cy.get(sel.emailError).should('not.exist')
            if (password) cy.get(sel.passwordError, T).should('be.visible').and('contain.text', password)
            else cy.get(sel.passwordError).should('not.exist')
            cy.location('pathname').should('eq', sel.path)
        })
        cy.get('@login.all').should('have.length', 0)
    }

    // ─── Menú del usuario / cierre de sesión ──────────────────────────────────

    openUserMenu(customer) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navMenu, T).should('contain.text', customer.fullName).click()
            cy.get(sel.navSignOut, T).should('be.visible')
        })
    }

    signOut(customer) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navSignOut, T).click()
            cy.get(sel.navSignIn, T).should('be.visible')
            cy.get(sel.navMenu).should('not.exist')
            cy.contains(customer.fullName).should('not.exist')
            cy.window().its('localStorage').invoke('getItem', sel.tokenKey).should('be.null')
        })
    }

    clickSignIn() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept('POST', `https://${sel.api.host}${sel.api.loginPath}`).as('login')
            cy.get(sel.navSignIn, T).click()
        })
        this.verifyEmptyForm()
    }

    openAccount() {
        cy.fixture(FIXTURE).then(sel => cy.gotoPSTUrl(sel.accountPath))
    }

    // Sin sesión, "My account" termina en la pantalla Login.
    verifyRedirectedToLogin() {
        cy.fixture(FIXTURE).then(sel => {
            cy.location('pathname', T).should('eq', sel.path)
            cy.get(sel.email, T).should('be.visible').and('have.value', '')
            cy.get(sel.pageTitle).should('not.exist')
            cy.get(sel.navSignIn, T).should('be.visible')
        })
    }

    verifyAccountVisible(customer) {
        cy.fixture(FIXTURE).then(sel => {
            cy.location('pathname', T).should('eq', sel.accountPath)
            cy.get(sel.pageTitle, T).should('have.text', sel.texts.accountTitle)
            cy.get(sel.navMenu, T).should('contain.text', customer.fullName)
        })
    }

    clickHome() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navHome, T).click()
            cy.location('pathname', T).should('eq', '/')
            cy.get(sel.productCard, T).should('have.length.greaterThan', 0)
            cy.get(sel.navSignIn).should('be.visible')
        })
    }
}

export default PSTLoginPage
