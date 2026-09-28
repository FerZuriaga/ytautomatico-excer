import PSTLoginPage from './PSTLoginPage'

const FIXTURE = 'selectors/practicesoftwaretesting/perfil.json'

const T = { timeout: 15000 }

// Pantalla "Profile" de la cuenta del cliente: datos personales y cambio de
// contraseña. Cada test usa un cliente propio registrado por API (el cambio
// de contraseña y los datos son por cliente, y la re-siembra de la demo
// borra los usuarios registrados). Los avisos se ocultan a los 5 segundos:
// se verifican apenas llega la respuesta.
class PSTProfilePage {

    constructor() {
        this.login = new PSTLoginPage()
    }

    // ─── Precondiciones por API ───────────────────────────────────────────────

    // Cliente con nombre Qa, calle Calle 1, teléfono 123456789 y contraseña
    // Qa!Sesion2026#, con la sesión lista para la primera carga de página.
    prepareCustomer() {
        return this.login.createCustomer().then(customer => {
            this.login.prepareSession(customer)
            return cy.wrap(customer)
        })
    }

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            const host = sel.api.host
            cy.intercept({ method: 'GET', hostname: host, pathname: sel.api.mePath }).as('profileLoad')
            cy.intercept({ method: 'PUT', hostname: host, pathname: new RegExp(`^${sel.api.updatePathPrefix}[^/]+$`) }).as('profileUpdate')
            cy.intercept({ method: 'POST', hostname: host, pathname: sel.api.changePasswordPath }).as('changePassword')
        })
    }

    // ─── Pantalla ─────────────────────────────────────────────────────────────

    // Espera el perfil cargado: la pantalla guarda los datos del cliente al
    // recibirlos y "Change Password" los usa; un clic antes de esa respuesta
    // no envía nada (la excepción la absorbe Angular, sin aviso).
    open() {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoPSTUrl(sel.path)
            cy.get(sel.pageTitle, T).should('have.text', sel.texts.title)
            cy.get(sel.fields.email, T).should('not.have.value', '')
        })
    }

    // Paso 1 de los casos de datos: el perfil precargado del cliente.
    verifyCurrentData(customer) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.fields.firstName, T).should('have.value', customer.firstName)
            cy.get(sel.fields.street).should('have.value', customer.address.street)
            cy.get(sel.fields.phone).should('have.value', '123456789')
            cy.get(sel.fields.email).should('have.value', customer.email).and('have.attr', 'readonly')
        })
    }

    // Paso 1 de los casos de contraseña.
    verifyPasswordFormEmpty() {
        cy.fixture(FIXTURE).then(sel => {
            Object.values(sel.password).filter(s => s !== sel.password.submit)
                .forEach(s => cy.get(s, T).should('be.visible').and('have.value', ''))
        })
    }

    fill(field, value) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.fields[field], T).clear().type(value).should('have.value', value))
    }

    clearField(field) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.fields[field], T).clear().should('have.value', ''))
    }

    reload() {
        this.registerAliases()
        cy.reload()
        cy.wait('@profileLoad', T)
    }

    verifyField(field, value) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.fields[field], T).should('have.value', value))
    }

    // ─── Datos personales ─────────────────────────────────────────────────────

    updateProfile() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.updateProfileSubmit, T).click())
    }

    verifyProfileSaved() {
        cy.wait('@profileUpdate', T).its('response.statusCode').should('eq', 200)
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.profileForm).find(sel.successAlert, T).should('be.visible').and('have.text', sel.texts.profileUpdated)
        })
    }

    // El formulario inválido no envía nada: el aviso y el campo marcado se
    // ven sin request, así que se comprueba que no salió ningún PUT.
    verifyProfileRejected(textKey, field) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.profileForm).find(sel.errorAlert, T).should('be.visible').and('contain.text', sel.texts[textKey])
            cy.get(sel.fields[field]).should('have.class', sel.invalidField.slice(1))
            cy.get(sel.profileForm).find(sel.successAlert).should('not.exist')
        })
        cy.get('@profileUpdate.all').should('have.length', 0)
    }

    verifyMenuName(fullName) {
        cy.fixture('selectors/practicesoftwaretesting/login.json').then(sel => {
            cy.get(sel.navMenu, T).should('contain.text', fullName)
        })
    }

    // ─── Contraseña ───────────────────────────────────────────────────────────

    fillPassword(field, value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.password[field], T).clear().type(value, { log: false }).should('have.value', value).and('have.attr', 'type', 'password')
        })
    }

    changePassword() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.password.submit, T).click())
    }

    // Tras el aviso la app cierra la sesión y recarga sola (a los 5 s): se
    // espera la pantalla Login, sin esperas fijas.
    verifyPasswordChanged() {
        cy.wait('@changePassword', T).its('response.statusCode').should('eq', 200)
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.passwordForm).find(sel.successAlert, T).should('be.visible').and('have.text', sel.texts.passwordUpdated)
        })
        cy.fixture('selectors/practicesoftwaretesting/login.json').then(sel => {
            cy.location('pathname', T).should('eq', sel.path)
            cy.get(sel.navSignIn, T).should('be.visible')
            cy.window().its('localStorage').invoke('getItem', sel.tokenKey).should('be.null')
        })
    }

    // El servicio rechaza el cambio. Aserción funcional, sin copiar su
    // redacción: el status del rechazo, el aviso con el motivo que dio el
    // servicio, la sesión intacta y la regla del CA (la contraseña no
    // cambia: la actual sigue entrando).
    verifyPasswordRejected(customer, status) {
        cy.wait('@changePassword', T).then(({ response }) => {
            expect(response.statusCode, 'rechazo del servicio').to.eq(status)
            const reason = response.body.message
            expect(reason, 'motivo del rechazo').to.be.a('string').and.not.be.empty
            cy.fixture(FIXTURE).then(sel => {
                cy.get(sel.passwordForm).find(sel.errorAlert, T).should('be.visible').and('contain.text', reason)
                cy.location('pathname').should('eq', sel.path)
            })
        })
        cy.fixture('selectors/practicesoftwaretesting/login.json').then(sel => {
            cy.get(sel.navMenu).should('be.visible')
            cy.window().its('localStorage').invoke('getItem', sel.tokenKey).should('not.be.null')
        })
        this.login.apiLogin(customer.email, customer.password, 200)
    }

    // Login posterior al cambio, sobre la pantalla Login a la que volvió la app.
    loginAfterChange(customer, password) {
        cy.fixture('selectors/practicesoftwaretesting/login.json').then(sel => {
            cy.intercept('POST', `https://${sel.api.host}${sel.api.loginPath}`).as('login')
        })
        this.login.verifyEmptyForm()
        this.login.loginWith(customer.email, password)
    }
}

export default PSTProfilePage
