const FIXTURE = 'selectors/practicesoftwaretesting/registro.json'

const T = { timeout: 15000 }

// Fecha YYYY-MM-DD de hace `years` años menos `days` días (UTC, como la API).
const isoDateYearsAgo = (years, days = 0) => {
    const d = new Date()
    d.setUTCFullYear(d.getUTCFullYear() - years)
    d.setUTCDate(d.getUTCDate() - days)
    return d.toISOString().slice(0, 10)
}

// Pantalla "Customer registration". Cada test usa un email único: la
// re-siembra de la demo borra los clientes y un email repetido se rechaza.
class PSTRegisterPage {

    static isoDateYearsAgo = isoDateYearsAgo

    // Datos válidos por defecto; `overrides` reemplaza campos puntuales.
    buildCustomer(overrides = {}) {
        const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`
        const customer = {
            firstName: 'Qa', lastName: 'Registro', dob: '1990-01-01', country: 'AR', postalCode: '5000',
            houseNumber: '42', street: 'Calle Falsa 123', city: 'Cordoba', state: 'Cordoba', phone: '123456789',
            email: `qa.registro.${unique}@example.com`, password: 'Qa!Registro2026#', ...overrides
        }
        customer.fullName = `${customer.firstName} ${customer.lastName}`
        return customer
    }

    // Entra por Login → "Register your account" (el camino del usuario).
    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.registerPath }).as('register')
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.postcodeLookupPath }).as('postcodeLookup')
            cy.gotoPSTUrl(sel.loginPath)
            cy.get(sel.registerLink, T).click()
            cy.location('pathname', T).should('eq', sel.path)
            cy.contains('h3', sel.texts.title, T).should('be.visible')
            // El país arranca en la opción de ayuda deshabilitada (valor null).
            Object.entries(sel.fields).filter(([key]) => key !== 'country')
                .forEach(([, field]) => cy.get(field).should('have.value', ''))
            cy.get(sel.fields.country).find('option:selected').should('have.attr', 'value', '')
        })
    }

    // País + código postal + número de casa disparan la búsqueda de la
    // dirección, que pisa calle, ciudad y estado: se cargan primero y se
    // espera la búsqueda antes de completar el resto.
    fill(customer) {
        cy.fixture(FIXTURE).then(sel => {
            const f = sel.fields
            cy.get(f.country).select(customer.country)
            cy.get(f.postalCode).type(customer.postalCode)
            cy.get(f.houseNumber).type(customer.houseNumber)
            cy.wait('@postcodeLookup', T)
            cy.get(sel.postcodeLoading).should('not.exist')
            const text = { firstName: customer.firstName, lastName: customer.lastName, dob: customer.dob, street: customer.street,
                city: customer.city, state: customer.state, phone: customer.phone, email: customer.email }
            Object.entries(text).forEach(([key, value]) => cy.get(f[key]).clear().type(value).should('have.value', value))
            cy.get(f.password).clear().type(customer.password, { log: false }).should('have.value', customer.password)
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.submit).click())
    }

    register(customer) {
        this.fill(customer)
        this.submit()
    }

    // ─── Resultados ───────────────────────────────────────────────────────────

    verifyBackToLogin() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@register', T).its('response.statusCode').should('eq', 201)
            cy.location('pathname', T).should('eq', sel.loginPath)
            cy.get(sel.loginSubmit, T).should('be.visible')
        })
    }

    verifyStillOnForm() {
        cy.fixture(FIXTURE).then(sel => {
            cy.location('pathname').should('eq', sel.path)
            cy.contains('h3', sel.texts.title).should('be.visible')
        })
    }

    // Rechazo del formulario: el error se muestra y la request nunca sale.
    verifyFieldError(field, textKey) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.errors[field], T).should('be.visible').and('contain.text', sel.texts[textKey])
            this.verifyNotSent()
        })
    }

    // Solo que hay un error en la contraseña: el texto exacto es el Bug SCRUM-562.
    verifyPasswordRejected() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.errors.password, T).should('be.visible').invoke('text').should('match', /\S/)
            this.verifyNotSent()
        })
    }

    verifyAllRequired() {
        cy.fixture(FIXTURE).then(sel => {
            Object.entries(sel.texts.required).forEach(([field, text]) => {
                cy.get(sel.errors[field], T).should('be.visible').and('contain.text', text)
            })
            this.verifyNotSent()
        })
    }

    verifyNotSent() {
        cy.get('@register.all').should('have.length', 0)
        this.verifyStillOnForm()
    }

    // Rechazo del servidor: se espera la respuesta antes de afirmar.
    verifyServerError(textKey, status) {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@register', T).its('response.statusCode').should('eq', status)
            cy.get(sel.registerError, T).should('be.visible').and('contain.text', sel.texts[textKey])
            this.verifyStillOnForm()
        })
    }
}

export default PSTRegisterPage
