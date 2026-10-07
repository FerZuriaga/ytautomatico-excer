import AdminMessagesPage from './AdminMessagesPage'

const FIXTURE = 'selectors/restful-booker-platform/habitaciones.json'

const T = { timeout: 15000 }

const JSON_HEADERS = { Accept: 'application/json' }

const fill = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template)

// Número de habitación único por test: la demo es compartida y la lista
// tiene las habitaciones de otros usuarios. Mismo largo siempre, para que
// un número no sea el comienzo de otro.
export const uniqueRoomName = () => `Q${String(Date.now()).slice(-5)}${Math.floor(Math.random() * 10)}`

// Habitación de la precondición de los TC de edición.
export const SEED_ROOM = { type: 'Double', accessible: false, roomPrice: 120, features: ['WiFi'], description: 'Habitacion creada por QA.' }

// Panel "Rooms": lista de habitaciones con el formulario de alta, y detalle
// de una habitación con el formulario de edición. Las reglas de los datos
// las valida el servidor (400 al crear, 400 "Failed to update room" al
// editar). La sesión y la entrada al panel son las de la bandeja.
class AdminRoomsPage {

    constructor() {
        this.panel = new AdminMessagesPage()
    }

    // ─── Precondiciones por API ───────────────────────────────────────────────

    // Crea la habitación de la precondición y devuelve sus datos con el id
    // (el alta no lo devuelve: se busca por el número).
    createRoomByApi(token, data = {}) {
        const room = { roomName: `QA${Date.now()}`, ...SEED_ROOM, image: '/images/room2.jpg', ...data }
        return cy.fixture(FIXTURE).then(sel => {
            const url = `https://${sel.api.host}${sel.api.roomPath}`
            const headers = { ...JSON_HEADERS, Cookie: `token=${token}` }
            cy.request({ method: 'POST', url, headers, body: room }).its('status').should('eq', 200)
            return cy.request({ url, headers: JSON_HEADERS }).then(({ body }) => {
                const created = body.rooms.find(r => r.roomName === room.roomName)
                expect(created, `habitación "${room.roomName}" creada por API`).to.exist
                return { ...room, id: created.roomid }
            })
        })
    }

    // ─── Lista y alta ─────────────────────────────────────────────────────────

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.roomPath }).as('createRoom')
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.roomPath}/\\d+$`) }).as('room')
            cy.intercept({ method: 'PUT', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.roomPath}/\\d+$`) }).as('updateRoom')
        })
    }

    // Paso 1 del alta: el panel abre en "Rooms" con la lista y el formulario.
    open() {
        this.registerAliases()
        this.panel.adminToken().then(token => this.panel.openPanel(token))
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.create.submit, T).should('be.visible')
        })
    }

    typeName(name) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.create.name).type(name, { delay: 0 }))
    }

    selectType(type) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.create.type).select(type))
    }

    selectAccessible(accessible) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.create.accessible).select(String(accessible)))
    }

    typePrice(price) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.create.price).type(String(price), { delay: 0 }))
    }

    checkFeature(feature) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.create.features[feature]).check()
            cy.get(sel.create.features[feature]).should('be.checked')
        })
    }

    // Clic en "Create"; espera la respuesta del alta antes de afirmar.
    submit(expectedStatus) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.create.submit).click()
            cy.wait('@createRoom', T).its('response.statusCode').should('eq', expectedStatus)
        })
    }

    // Fila de la lista: número, tipo, accesibilidad, precio y comodidades.
    // Se compara el texto exacto de cada celda (los elementos sin hijos):
    // con "contain.text", un precio 1 pasaría por el "100" de otra celda.
    verifyRow({ name, type, accessible, price, features }) {
        cy.fixture(FIXTURE).then(sel => {
            const expected = [name, type, String(accessible), String(price), features.length ? features.join(', ') : sel.texts.noFeatures]
            cy.contains(sel.list.row, name, T).should('be.visible').should($row => {
                const cells = $row.find('*').toArray().filter(el => !el.children.length).map(el => el.textContent.trim()).filter(Boolean)
                expected.forEach(value => expect(cells, `celdas de la fila ${name}`).to.include(value))
            })
        })
    }

    verifyCreateRejected(textKey, name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.create.alert, T).should('be.visible').and('contain.text', sel.texts[textKey])
            cy.get(sel.list.row).should('have.length.greaterThan', 0)
            if (name) cy.contains(sel.list.row, name).should('not.exist')
        })
    }

    // Sin número: la lista no suma ninguna fila.
    verifyNoNewRow(rowsBefore) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.list.row).should('have.length', rowsBefore))
    }

    rowCount() {
        return cy.fixture(FIXTURE).then(sel => cy.get(sel.list.row, T).its('length'))
    }

    // ─── Detalle y edición ────────────────────────────────────────────────────

    // Paso 1 de la edición: el detalle de la habitación, abierto desde la
    // lista del panel.
    openDetail(room) {
        this.open()
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.list.row, room.roomName, T).click()
            cy.wait('@room', T)
            this.verifyDetail({ name: room.roomName, type: room.type, price: room.roomPrice, description: room.description })
            cy.contains('button', sel.texts.editButton).should('be.visible')
        })
    }

    verifyDetail({ name, type, price, description, features }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(fill(sel.texts.detailTitle, { name }), T).should('be.visible')
            cy.contains(fill(sel.texts.detailType, { type })).should('be.visible')
            cy.contains(fill(sel.texts.detailPrice, { price })).should('be.visible')
            if (description) cy.contains(fill(sel.texts.detailDescription, { description })).should('be.visible')
            if (features) cy.contains(fill(sel.texts.detailFeatures, { features: features.join(', ') })).should('be.visible')
        })
    }

    clickEdit() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains('button', sel.texts.editButton).click()
            // El formulario se completa con los datos actuales: esperarlo
            // antes de reemplazar un valor.
            cy.get(sel.edit.price, T).should('not.have.value', '')
            cy.get(sel.edit.update).should('be.visible')
            cy.get(sel.edit.cancel).should('be.visible')
        })
    }

    replacePrice(price) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.edit.price).clear()
            cy.get(sel.edit.price).type(String(price), { delay: 0 })
            cy.get(sel.edit.price).should('have.value', String(price))
        })
    }

    replaceName(name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.edit.name).clear()
            if (name) cy.get(sel.edit.name).type(name, { delay: 0 })
            cy.get(sel.edit.name).should('have.value', name || '')
        })
    }

    selectEditType(type) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.edit.type).select(type))
    }

    checkEditFeature(feature) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.edit.features[feature]).check()
            cy.get(sel.edit.features[feature]).should('be.checked')
        })
    }

    replaceDescription(description) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.edit.description).clear()
            cy.get(sel.edit.description).type(description, { delay: 0 })
            cy.get(sel.edit.description).should('have.value', description)
        })
    }

    // Clic en "Update"; espera la respuesta antes de afirmar.
    update(expectedStatus) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.edit.update).click()
            cy.wait('@updateRoom', T).its('response.statusCode').should('eq', expectedStatus)
        })
    }

    verifyUpdateRejected() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.edit.alert, T).should('be.visible').and('contain.text', sel.texts.updateFailed)
            cy.get(sel.edit.update).should('be.visible')
        })
    }

    verifyEditClosed() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains('button', sel.texts.editButton, T).should('be.visible')
            cy.get(sel.edit.update).should('not.exist')
        })
    }

    cancel() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.edit.cancel).click())
        this.verifyEditClosed()
    }

    // Recarga el detalle: muestra lo que quedó guardado.
    reload(room) {
        cy.reload()
        cy.wait('@room', T)
        this.verifyDetail({ name: room.roomName, type: room.type, price: room.roomPrice, description: room.description })
    }

    openRoomsFromMenu() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.list.menuLink, sel.texts.rooms).click()
            cy.location('pathname', T).should('eq', sel.paths.rooms)
        })
    }
}

export default AdminRoomsPage
