import PSTLoginPage from './PSTLoginPage'

const FIXTURE = 'selectors/practicesoftwaretesting/contacto.json'

const T = { timeout: 15000 }

const normalize = (text) => text.replace(/\s+/g, ' ').trim()

// Formulario de contacto ("Contact") e historial de mensajes del cliente.
// Sin sesión el formulario pide nombre, apellido y email; esos campos
// pasan a ser obligatorios recién cuando la consulta de la cuenta
// (GET /users/me) responde 401, por eso la apertura espera a que se
// apliquen antes de devolver el control. Con sesión, la pantalla saluda al cliente
// por su nombre y no muestra esos campos.
class PSTContactPage {

    constructor() {
        this.login = new PSTLoginPage()
    }

    // ─── Precondiciones ───────────────────────────────────────────────────────

    // Cliente propio con la sesión lista para la primera carga.
    prepareCustomer() {
        return this.login.createCustomer().then(customer => {
            this.login.prepareSession(customer)
            return cy.wrap(customer)
        })
    }

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            const host = sel.api.host
            cy.intercept({ method: 'POST', hostname: host, pathname: sel.api.messagesPath }).as('sendMessage')
            cy.intercept({ method: 'POST', hostname: host, pathname: new RegExp(`^${sel.api.messagesPath}/[^/]+${sel.api.attachFileSuffix}$`) }).as('attachFile')
            cy.intercept({ method: 'GET', hostname: host, pathname: sel.api.messagesPath }).as('messagesList')
        })
    }

    visitHome() {
        this.registerAliases()
        cy.gotoPSTUrl('/')
        cy.fixture(FIXTURE).then(sel => cy.get(sel.navContact, T).should('be.visible'))
    }

    // ─── Formulario ───────────────────────────────────────────────────────────

    // Visitante: formulario con los campos de identificación, listo para
    // validarlos (la cuenta ya respondió 401).
    openAsVisitor() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navContact).click()
            cy.location('pathname', T).should('eq', sel.path)
            // La pantalla consulta la cuenta varias veces y los campos pasan a
            // ser obligatorios recién con la respuesta que recibe el
            // formulario: se espera a que el nombre vacío figure inválido.
            // Enviar antes manda una consulta sin nombre ni email (posible
            // defecto, ver docs/discovery/practicesoftwaretesting.md).
            cy.get(sel.form.firstName, T).should('have.class', 'ng-invalid')
            cy.contains('h3', sel.texts.title, T).should('be.visible')
            ;[sel.form.firstName, sel.form.lastName, sel.form.email, sel.form.subject, sel.form.message, sel.form.attachment, sel.form.submit]
                .forEach(field => cy.get(field).should('be.visible'))
        })
    }

    // Cliente con sesión: saludo con su nombre y sin campos de identificación.
    openAsCustomer(customer) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navContact).click()
            cy.location('pathname', T).should('eq', sel.path)
            cy.contains(sel.texts.greeting.replace('{name}', customer.fullName), T).should('be.visible')
            ;[sel.form.subject, sel.form.message, sel.form.attachment, sel.form.submit].forEach(field => cy.get(field).should('be.visible'))
            ;[sel.form.firstName, sel.form.lastName, sel.form.email].forEach(field => cy.get(field).should('not.exist'))
        })
    }

    fillIdentity({ firstName, lastName, email }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.firstName).type(firstName)
            cy.get(sel.form.lastName).type(lastName)
            cy.get(sel.form.email).type(email)
            cy.get(sel.form.firstName).should('have.value', firstName)
            cy.get(sel.form.lastName).should('have.value', lastName)
            cy.get(sel.form.email).should('have.value', email)
        })
    }

    selectSubject(subject) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.subject).select(subject)
            cy.get(sel.form.subject).find('option:selected').should('have.text', subject)
        })
    }

    typeMessage(message) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.message).type(message, { delay: 0 })
            cy.get(sel.form.message).should('have.value', message)
        })
    }

    fillMessage(subject, message) {
        this.selectSubject(subject)
        this.typeMessage(message)
    }

    // Archivo generado en memoria: content "" = archivo vacío (0 KB).
    attachFile({ fileName, content, mimeType }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.attachment).selectFile({ contents: Cypress.Buffer.from(content), fileName, mimeType })
            cy.get(sel.form.attachment).should($input => expect($input[0].files[0].name).to.eq(fileName))
        })
    }

    clickSend() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    // Envío aceptado: el formulario se reemplaza por la confirmación. Con
    // adjunto, además se sube el archivo al mensaje creado.
    verifySent({ withAttachment = false } = {}) {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@sendMessage', T).its('response.statusCode').should('eq', 200)
            if (withAttachment) cy.wait('@attachFile', T).its('response.statusCode').should('eq', 200)
            cy.get(sel.confirmation, T).should($alert => expect(normalize($alert.text())).to.eq(sel.texts.confirm))
            cy.get(sel.form.submit).should('not.exist')
        })
    }

    // Envío rechazado en el formulario: exactamente estos avisos, el
    // formulario sigue en pantalla y no sale ninguna consulta.
    verifyRejected(errorKeys) {
        cy.fixture(FIXTURE).then(sel => {
            const expected = errorKeys.map(key => sel.texts[key])
            cy.get(Object.values(sel.errors).join(', '), T).should('have.length', expected.length)
                .then($errors => expect([...$errors].map(e => normalize(e.innerText))).to.have.members(expected))
            cy.get(sel.form.submit).should('be.visible')
            cy.get(sel.confirmation).should('not.exist')
            cy.get('@sendMessage.all').should('have.length', 0)
        })
    }

    // ─── Historial de mensajes ────────────────────────────────────────────────

    openUserMenu() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navMenu, T).click()
            cy.get(sel.navMyMessages, T).should('be.visible').and('contain.text', 'My messages')
        })
    }

    clickMyMessages() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navMyMessages).click()
            cy.wait('@messagesList', T)
            cy.location('pathname').should('eq', sel.messagesPath)
            cy.get(sel.pageTitle, T).should('have.text', sel.texts.messagesTitle)
        })
    }

    // Una fila con el mensaje, estado NEW, fecha de hoy (del servidor, en
    // UTC) y el botón "Details".
    verifyMessageListed(message) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.messagesRows, T).should('have.length', 1)
            cy.get(sel.messagesRows).first().find('td').then($cells => {
                const cells = [...$cells].map(td => normalize(td.innerText))
                expect(cells[1], 'mensaje').to.eq(message)
                expect(cells[2], 'estado').to.eq('NEW')
                expect(cells[3], 'fecha').to.match(new RegExp(`^${new Date().toISOString().slice(0, 10)} `))
                expect(cells[4], 'boton').to.eq('Details')
            })
        })
    }

    verifyNoMessages() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.texts.noMessages, T).should('be.visible')
            cy.get(sel.messagesRows).should('not.exist')
        })
    }
}

export default PSTContactPage
