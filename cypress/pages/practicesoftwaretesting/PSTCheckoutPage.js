import PSTCartPage from './PSTCartPage'
import PSTLoginPage from './PSTLoginPage'

const FIXTURE = 'selectors/practicesoftwaretesting/checkout.json'

const T = { timeout: 15000 }

const normalize = (text) => text.replace(/\s+/g, ' ').trim()

// Pasos 2-4 del checkout (Sign in, Billing Address, Payment). El paso 1
// (Cart) es PSTCartPage. Cada test parte de un carrito preparado por API y,
// si corresponde, de un cliente propio con la sesión iniciada.
class PSTCheckoutPage {

    constructor() {
        this.cart = new PSTCartPage()
        this.login = new PSTLoginPage()
    }

    // ─── Precondiciones ───────────────────────────────────────────────────────

    // Cliente propio con sesión y un carrito, abierto en el paso Cart.
    startAsCustomer(items) {
        return this.login.createCustomer().then(customer => {
            this.login.prepareSession(customer)
            this.cart.openWithItems(items)
            return cy.wrap(customer)
        })
    }

    // Visitante sin sesión con un carrito, abierto en el paso Cart.
    startAsGuest(items) {
        this.cart.openWithItems(items)
    }

    // Los intercepts se registran antes de avanzar: la dirección se completa
    // con una búsqueda por código postal asíncrona y el pago se valida por API.
    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.postcodeLookupPath }).as('postcodeLookup')
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.paymentCheckPath }).as('paymentCheck')
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.invoicesPath }).as('createInvoice')
        })
    }

    // ─── Paso 2: Sign in ──────────────────────────────────────────────────────

    proceedFromCart() {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => cy.get(sel.steps.cartProceed, T).click())
    }

    verifyGreeting(customer) {
        cy.fixture(FIXTURE).then(sel => {
            const greeting = sel.texts.alreadyLoggedIn.replace('{first}', customer.firstName).replace('{last}', customer.lastName)
            cy.contains('you are already logged in', T).should($p => expect(normalize($p.text())).to.equal(greeting))
            cy.get(sel.steps.signInProceed).should('be.visible')
        })
    }

    verifySignInRequired() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.signIn.loginEmail, T).should('be.visible')
            cy.get(sel.signIn.loginPassword).should('be.visible')
            cy.get(sel.signIn.guestTab).should('be.visible')
            cy.contains('you are already logged in').should('not.exist')
            cy.get(sel.steps.signInProceed).should('not.exist')
        })
    }

    openGuestTab() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.signIn.guestTab, T).click()
            cy.get(sel.signIn.guestEmail, T).should('be.visible').and('have.value', '')
            cy.get(sel.signIn.guestFirstName).should('have.value', '')
            cy.get(sel.signIn.guestLastName).should('have.value', '')
            cy.get(sel.signIn.guestSubmit).should('be.visible')
        })
    }

    typeGuest(field, value) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.signIn[field], T).type(value).should('have.value', value))
    }

    submitGuest() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.signIn.guestSubmit, T).click())
    }

    verifyGuestAccepted(guest) {
        cy.fixture(FIXTURE).then(sel => {
            const text = sel.texts.guestProceed.replace('{first}', guest.firstName).replace('{last}', guest.lastName).replace('{email}', guest.email)
            cy.contains(text, T).should('be.visible')
            cy.get(sel.steps.guestProceed).should('be.visible')
        })
    }

    verifyGuestErrors() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.signIn.guestEmailError, T).should('contain.text', sel.texts.errors.guestEmailRequired)
            cy.get(sel.signIn.guestFirstNameError).should('contain.text', sel.texts.errors.guestFirstNameRequired)
            cy.get(sel.signIn.guestLastNameError).should('contain.text', sel.texts.errors.guestLastNameRequired)
            cy.get(sel.steps.guestProceed).should('not.exist')
        })
    }

    proceedFromSignIn({ guest = false } = {}) {
        cy.fixture(FIXTURE).then(sel => cy.get(guest ? sel.steps.guestProceed : sel.steps.signInProceed, T).click())
        this.verifyAddressStep()
    }

    // ─── Paso 3: Billing Address ──────────────────────────────────────────────

    verifyAddressStep() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains('h1, h2, h3', sel.texts.addressTitle, T).should('be.visible')
            cy.get(sel.address.street, T).should('be.visible')
        })
    }

    // Con país, código postal y número cargados la app busca la dirección, y
    // lo hace DOS veces al cargar el paso (visto en todas las exploraciones):
    // si el test edita el formulario antes de la segunda respuesta, esta
    // vuelve a completar la calle. Se esperan ambas antes de interactuar.
    waitForAddressLookup() {
        cy.wait(['@postcodeLookup', '@postcodeLookup'], T)
        cy.fixture(FIXTURE).then(sel => cy.get(sel.address.street, T).invoke('val').should('not.be.empty'))
    }

    verifyAddressFields(expected) {
        cy.fixture(FIXTURE).then(sel => {
            Object.entries(expected).forEach(([field, value]) => cy.get(sel.address[field], T).should('have.value', value))
        })
    }

    verifyAddressEmpty() {
        cy.fixture(FIXTURE).then(sel => {
            ['street', 'houseNumber', 'city', 'state', 'postalCode'].forEach(field => cy.get(sel.address[field], T).should('have.value', ''))
        })
    }

    clearStreet() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.address.street, T).clear().blur())
    }

    typeStreet(value) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.address.street, T).type(value).should('have.value', value))
    }

    verifyStreetInvalid(invalid) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.address.street, T).should(invalid ? 'have.class' : 'not.have.class', sel.address.invalidClass))
    }

    verifyAddressProceed(enabled) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.steps.addressProceed, T).should(enabled ? 'be.enabled' : 'be.disabled'))
    }

    proceedFromAddress() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.steps.addressProceed, T).should('be.enabled').click()
            cy.contains('h1, h2, h3', sel.texts.paymentTitle, T).should('be.visible')
            cy.get(sel.payment.method, T).should('be.visible')
        })
    }

    // ─── Paso 4: Payment ──────────────────────────────────────────────────────

    // Precondición de los casos de pago: cliente con sesión y dirección completa.
    openPaymentAsCustomer(items) {
        return this.startAsCustomer(items).then(customer => {
            this.proceedFromCart()
            this.proceedFromSignIn()
            this.waitForAddressLookup()
            return cy.wrap(customer)
        })
    }

    verifyPaymentInitial() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.payment.method, T).find('option:selected').should('have.value', '')
            this.verifyConfirm(false)
        })
    }

    selectMethod(label) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.payment.method, T).select(label).find('option:selected').should('have.text', label))
    }

    typePayment(field, value) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.payment[field], T).type(value).should('have.value', value).blur())
    }

    verifyPaymentFields(fields, empty = false) {
        cy.fixture(FIXTURE).then(sel => fields.forEach(field => {
            cy.get(sel.payment[field], T).should('be.visible')
            if (empty) cy.get(sel.payment[field]).should('have.value', '')
        }))
    }

    verifyPaymentError(errorKey, shown = true) {
        cy.fixture(FIXTURE).then(sel => cy.contains(sel.texts.errors[errorKey], T).should(shown ? 'be.visible' : 'not.exist'))
    }

    verifyConfirm(enabled) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.payment.finish, T).should(enabled ? 'be.enabled' : 'be.disabled'))
    }

    confirm() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.payment.finish, T).should('be.enabled').click())
    }

    verifyPaymentAccepted() {
        cy.wait('@paymentCheck', T).its('response.statusCode').should('eq', 200)
        cy.fixture(FIXTURE).then(sel => cy.get(sel.payment.successMessage, T).should('be.visible').and('contain.text', sel.texts.paymentSuccess))
    }

    // Pedido creado: número de factura visible y carrito vacío (el menú deja
    // de mostrar el ícono del carrito).
    verifyOrderCreated() {
        cy.wait('@createInvoice', T).its('response.statusCode').should('eq', 201)
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.payment.orderConfirmation, T).should($c => {
                expect(normalize($c.text())).to.match(new RegExp(`^${sel.texts.orderConfirmation}INV-\\d+\\.$`))
            })
            cy.get(sel.navCart).should('not.exist')
        })
    }
}

export default PSTCheckoutPage
