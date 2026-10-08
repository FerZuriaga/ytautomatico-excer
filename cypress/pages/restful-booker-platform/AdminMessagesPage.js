const FIXTURE = 'selectors/restful-booker-platform/mensajes.json'

const T = { timeout: 15000 }

const JSON_HEADERS = { Accept: 'application/json' }

const fill = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template)

// Panel de administración y bandeja "Messages". La bandeja es compartida con
// todos los que usan la demo (y se reinicia cada tanto): cada test crea sus
// consultas con un asunto único y las ubica por ese asunto, nunca por
// posición ni por la cantidad total.
class AdminMessagesPage {

    // ─── Precondiciones por API ───────────────────────────────────────────────

    adminToken() {
        return cy.fixture(FIXTURE).then(sel => cy.request({
            method: 'POST', url: `https://${sel.api.host}${sel.api.loginPath}`, headers: JSON_HEADERS,
            body: { username: sel.api.adminUser, password: sel.api.adminPassword }
        }).then(({ status, body }) => {
            expect(status, 'login de administrador por API').to.eq(200)
            return body.token
        }))
    }

    // Consulta enviada como la manda el formulario del sitio. Devuelve los
    // datos con el asunto único.
    sendMessage(data = {}) {
        const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`
        const message = {
            name: 'Qa Contacto', email: 'qa.contacto@example.com', phone: '01234567890',
            subject: `Consulta QA ${unique}`,
            description: 'Quisiera saber si tienen disponibilidad para dos noches en octubre.',
            ...data
        }
        return cy.fixture(FIXTURE).then(sel => cy.request({
            method: 'POST', url: `https://${sel.api.host}${sel.api.messagePath}`, headers: JSON_HEADERS, body: message
        }).then(({ status }) => {
            expect(status, `consulta "${message.subject}" enviada por API`).to.eq(200)
            return message
        }))
    }

    // ─── Panel ────────────────────────────────────────────────────────────────

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.messagePath }).as('inbox')
            // El menú pide el contador cuando la página ya está montada: esperarlo
            // antes de hacer clic (un clic durante la re-hidratación se pierde).
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.messageCountPath }).as('messageCount')
            cy.intercept({ method: 'PUT', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.messagePath}/\\d+/read$`) }).as('markRead')
        })
    }

    // Panel con la sesión de administrador ya iniciada (cookie del login).
    openPanel(token) {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoRestfulBookerPlatformUrl(sel.paths.admin, { token })
            cy.wait('@messageCount', T)
            this.waitPanelReady()
            this.verifyMenu()
        })
    }

    // Al entrar, el panel redirige solo de /admin a /admin/rooms. Un clic en el
    // menú antes de que termine esa redirección se pierde (la redirección gana
    // y se vuelve a Habitaciones): se espera la dirección y la lista.
    waitPanelReady() {
        cy.fixture(FIXTURE).then(sel => {
            cy.location('pathname', T).should('eq', sel.paths.rooms)
            cy.get(sel.admin.roomListing, T).should('have.length.greaterThan', 0)
        })
    }

    verifyMenu() {
        cy.fixture(FIXTURE).then(sel => {
            sel.texts.menu.forEach(item => cy.contains(sel.admin.menuLink, item, T).should('be.visible'))
        })
    }

    verifyLoginForm() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.admin.username, T).should('be.visible')
            cy.get(sel.admin.password).should('be.visible')
            cy.get(sel.admin.login).should('be.visible')
            cy.get(sel.admin.row).should('not.exist')
        })
    }

    // Panel sin sesión: se ve el login.
    openPanelWithoutSession() {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoRestfulBookerPlatformUrl(sel.paths.admin)
            this.verifyLoginForm()
        })
    }

    // Bandeja pedida sin sesión: tiene que mostrar el login, no las consultas.
    openInboxWithoutSession() {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoRestfulBookerPlatformUrl(sel.paths.inbox)
            this.verifyLoginForm()
        })
    }

    login() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.admin.username).type(sel.api.adminUser, { delay: 0 })
            cy.get(sel.admin.password).type(sel.api.adminPassword, { delay: 0 })
            cy.get(sel.admin.login).click()
            cy.wait('@messageCount', T)
            this.waitPanelReady()
            this.verifyMenu()
        })
    }

    clickFrontPage() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains('a', sel.texts.frontPage).click()
            cy.contains(sel.texts.formTitle, T).should('be.visible')
            cy.get(sel.admin.row).should('not.exist')
        })
    }

    // ─── Bandeja ──────────────────────────────────────────────────────────────

    openInbox() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.admin.menuLink, sel.texts.messages).click()
            cy.location('pathname', T).should('eq', sel.paths.inbox)
            cy.wait('@inbox', T)
            sel.texts.listHeaders.forEach(header => cy.contains(header).should('be.visible'))
        })
    }

    row(subject) {
        return cy.fixture(FIXTURE).then(sel => cy.contains(sel.admin.rowSubject, subject, T).closest(sel.admin.row))
    }

    verifyRow(subject, { name, read }) {
        cy.fixture(FIXTURE).then(sel => {
            this.row(subject).should('contain.text', name)
                .and('have.class', read ? sel.admin.rowRead : sel.admin.rowUnread)
        })
    }

    verifyNoRow(subject) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.admin.rowSubject, T).should('have.length.greaterThan', 0)
            cy.contains(sel.admin.rowSubject, subject).should('not.exist')
        })
    }

    // Cantidad de consultas sin leer del menú. Los tests que la leen tienen al
    // menos una consulta propia sin leer: se espera la insignia.
    unreadCount() {
        return cy.fixture(FIXTURE).then(sel => cy.contains(sel.admin.menuLink, sel.texts.messages, T)
            .find(sel.admin.unreadBadge, T).should('be.visible')
            .invoke('text').then(Number))
    }

    verifyUnreadCount(expected) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.admin.menuLink, sel.texts.messages, T).should($link => {
                expect(Number($link.find(sel.admin.unreadBadge).text() || 0), 'consultas sin leer').to.eq(expected)
            })
        })
    }

    // Abre la consulta por su asunto; espera que quede marcada como leída.
    openMessage(subject) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.admin.rowSubject, subject, T).click()
            cy.get(sel.admin.detail, T).should('be.visible').and('contain.text', subject)
            cy.wait('@markRead', T).its('response.statusCode').should('be.oneOf', [200, 202])
        })
    }

    verifyDetail({ name, phone, email, subject, description }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.admin.detail).within(() => {
                cy.contains(fill(sel.texts.from, { name })).should('be.visible')
                cy.contains(fill(sel.texts.phone, { phone })).should('be.visible')
                cy.contains(fill(sel.texts.email, { email })).should('be.visible')
                cy.contains(subject).should('be.visible')
                cy.contains(description).should('be.visible')
            })
        })
    }

    closeDetail() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.admin.detail).contains(sel.admin.detailClose, sel.texts.close).click()
            cy.get(sel.admin.detail).should('not.exist')
        })
    }

    // Deja la consulta leída (abrir y cerrar) con el contador del menú ya
    // actualizado: leerlo antes da el valor previo a la lectura.
    markAsRead(subject) {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.messageCountPath }).as('countAfterRead')
            this.openMessage(subject)
            cy.wait('@countAfterRead', T)
            this.closeDetail()
            this.row(subject).should('have.class', sel.admin.rowRead)
        })
    }

    // ─── Borrar ───────────────────────────────────────────────────────────────

    // Borra la consulta con el ícono de su fila. Espera el borrado y el
    // contador que el menú vuelve a pedir después: quien afirma que el
    // contador no cambió lo hace con la respuesta ya llegada.
    deleteMessage(subject) {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'DELETE', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.messagePath}/\\d+$`) }).as('deleteMessage')
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.messageCountPath }).as('countAfterDelete')
            this.row(subject).find(sel.admin.rowDelete).click()
            cy.wait('@deleteMessage', T).its('response.statusCode').should('be.oneOf', [200, 202])
            cy.wait('@countAfterDelete', T)
            this.verifyNoRow(subject)
        })
    }

    reloadInbox() {
        cy.fixture(FIXTURE).then(sel => {
            cy.reload()
            cy.location('pathname', T).should('eq', sel.paths.inbox)
            cy.wait('@inbox', T)
        })
    }

    openRooms() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.admin.menuLink, sel.texts.rooms).click()
            this.waitPanelReady()
        })
    }
}

export default AdminMessagesPage
