const FIXTURE = 'selectors/expandtesting-notes/notas.json'

const T = { timeout: 15000 }

const JSON_HEADERS = { Accept: 'application/json' }

const fill = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template)

// Fecha de la tarjeta tal como la muestra la app ("September 28, 2026 at
// 21:12:08"), en UTC.
const cardDate = (isoDate) => new Date(isoDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

// Pantalla "My Notes" y formulario "Add new note". Cada test registra su
// propio usuario por API (cada usuario ve solo sus notas) y entra con la
// sesión ya iniciada.
class NotesPage {

    // ─── Precondiciones por API ───────────────────────────────────────────────

    // Usuario nuevo registrado y logueado: devuelve { name, email, password, token }.
    prepareUser() {
        const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`
        const user = { name: 'Qa Notes', email: `qa.notes.${unique}@example.com`, password: 'Qa!Notes2026' }
        return cy.fixture(FIXTURE).then(sel => {
            const api = `https://${sel.api.host}`
            cy.request({ method: 'POST', url: `${api}${sel.api.registerPath}`, headers: JSON_HEADERS, body: user })
                .its('status').should('eq', 201)
            return cy.request({ method: 'POST', url: `${api}${sel.api.loginPath}`, headers: JSON_HEADERS, body: { email: user.email, password: user.password } })
                .then(({ status, body }) => {
                    expect(status, 'login por API').to.eq(200)
                    return { ...user, token: body.data.token }
                })
        })
    }

    // Notas del usuario creadas por API, en este orden. `completed: true` la
    // marca completada después de crearla (PATCH), como el interruptor de la
    // tarjeta: el alta por API no acepta ese campo.
    seedNotes(user, notes) {
        cy.fixture(FIXTURE).then(sel => {
            const url = `https://${sel.api.host}${sel.api.notesPath}`
            const headers = { ...JSON_HEADERS, 'x-auth-token': user.token }
            notes.forEach(({ title, description, category, completed }) => {
                cy.request({ method: 'POST', url, headers, body: { title, description, category } }).then(({ status, body }) => {
                    expect(status, `nota "${title}" creada por API`).to.eq(200)
                    if (completed) {
                        cy.request({ method: 'PATCH', url: `${url}/${body.data.id}`, headers, body: { completed: true } })
                            .its('status').should('eq', 200)
                    }
                })
            })
        })
    }

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.notesPath }).as('notesList')
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.notesPath}/?$`) }).as('createNote')
            // La búsqueda pide "/notes/?search=<texto>" (con barra final).
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: `${sel.api.notesPath}/` }).as('searchNotes')
            // El interruptor de la tarjeta manda PATCH /notes/<id> con { completed }.
            cy.intercept({ method: 'PATCH', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.notesPath}/[^/]+$`) }).as('toggleNote')
            // Guardar el formulario "Edit note" manda PUT /notes/<id> con la nota completa.
            cy.intercept({ method: 'PUT', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.notesPath}/[^/]+$`) }).as('updateNote')
            // Confirmar el borrado manda DELETE /notes/<id>; la lista se actualiza sin recargar.
            cy.intercept({ method: 'DELETE', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.notesPath}/[^/]+$`) }).as('deleteNote')
            // La vista de detalle pide la nota: GET /notes/<id>.
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.notesPath}/[^/]+$`) }).as('getNote')
        })
    }

    // "My Notes" con la sesión del usuario, sin notas.
    visitNotes(user) {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoNotesUrl(sel.path, { token: user.token })
            cy.wait('@notesList', T)
            cy.get(sel.list.addNote, T).should('be.visible')
            cy.contains(sel.texts.noNotesAll, T).should('be.visible')
        })
    }

    // "My Notes" con la sesión del usuario y sus notas ya creadas: pestaña
    // All activa y una tarjeta por cada título.
    visitNotesWith(user, titles) {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.gotoNotesUrl(sel.path, { token: user.token })
            cy.wait('@notesList', T)
            this.verifyCardTitles(titles)
            this.verifyActiveCategory('All')
        })
    }

    // ─── Formulario ───────────────────────────────────────────────────────────

    openForm() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.list.addNote).click()
            cy.contains(sel.texts.formTitle, T).should('be.visible')
            cy.get(sel.form.category).should('have.value', 'Home')
            cy.get(sel.form.completed).should('not.be.checked')
            cy.get(sel.form.title).should('be.visible').and('have.value', '')
            cy.get(sel.form.description).should('be.visible').and('have.value', '')
            cy.get(sel.form.submit).should('have.text', sel.texts.create)
            cy.get(sel.form.cancel).should('be.visible')
        })
    }

    // Solo completa lo indicado: sin `category` queda la que trae el formulario.
    fillForm({ category, title, description }) {
        cy.fixture(FIXTURE).then(sel => {
            if (category) {
                cy.get(sel.form.category).select(category)
                cy.get(sel.form.category).should('have.value', category)
            }
            if (title) {
                cy.get(sel.form.title).type(title, { delay: 0 })
                cy.get(sel.form.title).should('have.value', title)
            }
            if (description) {
                cy.get(sel.form.description).type(description, { delay: 0 })
                cy.get(sel.form.description).should('have.value', description)
            }
        })
    }

    checkCompleted() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.completed).check()
            cy.get(sel.form.completed).should('be.checked')
        })
    }

    clickCreate() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    clickCancel() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.cancel).click()
            cy.get(sel.form.title).should('not.exist')
        })
    }

    // Creación aceptada: el formulario se cierra y la lista se recarga.
    // Devuelve la nota tal como la guardó el servidor.
    verifyCreated() {
        return cy.fixture(FIXTURE).then(sel => {
            cy.wait('@createNote', T).then(({ response }) => {
                expect(response.statusCode, 'nota creada').to.eq(200)
                cy.wait('@notesList', T)
                cy.get(sel.form.title).should('not.exist')
                return cy.wrap(response.body.data)
            })
        })
    }

    // Rechazo en el formulario: exactamente estos avisos, el formulario
    // sigue abierto y no se envía ninguna nota (alias del alta o de la edición).
    verifyRejected(errorKeys, alias = 'createNote') {
        cy.fixture(FIXTURE).then(sel => {
            const expected = errorKeys.map(key => sel.texts[key])
            cy.get(sel.form.error, T).filter(':visible').should('have.length', expected.length)
                .then($errors => expect([...$errors].map(e => e.innerText.trim())).to.have.members(expected))
            cy.get(sel.form.title).should('be.visible')
            cy.get(`@${alias}.all`).should('have.length', 0)
        })
    }

    // ─── Formulario de edición ────────────────────────────────────────────────
    // Guardar una edición recarga la página completa (ver docs/discovery).

    // "Edit" en la tarjeta con este título: el formulario abre con los datos
    // actuales de la nota.
    openEditForm({ title, description, category, completed = false }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.card.root, title, T).find(sel.card.edit).click()
            cy.contains(sel.texts.editFormTitle, T).should('be.visible')
            cy.get(sel.form.category).should('have.value', category)
            cy.get(sel.form.completed).should(completed ? 'be.checked' : 'not.be.checked')
            cy.get(sel.form.title).should('have.value', title)
            cy.get(sel.form.description).should('have.value', description)
            cy.get(sel.form.submit).should('have.text', sel.texts.save)
        })
    }

    // Reemplaza el valor de un campo del formulario (title | description);
    // sin texto lo deja vacío.
    replaceField(field, text = '') {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form[field]).clear()
            if (text) cy.get(sel.form[field]).type(text, { delay: 0 })
            cy.get(sel.form[field]).should('have.value', text)
        })
    }

    clickSave() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).should('have.text', sel.texts.save).click())
    }

    // Edición aceptada: el servidor guarda la nota, la página se recarga y el
    // formulario ya no está. Devuelve la nota tal como la guardó el servidor.
    verifySaved() {
        return cy.fixture(FIXTURE).then(sel => {
            cy.wait('@updateNote', T).then(({ response }) => {
                expect(response.statusCode, 'nota editada').to.eq(200)
                cy.wait('@notesList', T)
                cy.get(sel.form.title).should('not.exist')
                return cy.wrap(response.body.data)
            })
        })
    }

    // Texto de la fecha de la única tarjeta ("September 30, 2026 at 17:53:31").
    cardUpdatedAt() {
        return cy.fixture(FIXTURE).then(sel => cy.get(sel.card.updatedAt, T).invoke('text'))
    }

    verifyNoUpdateRequest() {
        cy.get('@updateNote.all').should('have.length', 0)
    }

    // ─── Borrado ──────────────────────────────────────────────────────────────

    // "View" en la tarjeta con este título: vista de detalle de la nota, fuera
    // de la lista.
    openNoteView({ title, description }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.card.root, title, T).find(sel.card.view).click()
            cy.wait('@getNote', T).its('response.statusCode').should('eq', 200)
            cy.get(sel.list.addNote).should('not.exist')
            cy.get(sel.card.title, T).should('have.text', title)
            cy.get(sel.card.description).should('have.text', description)
            cy.get(sel.card.edit).should('be.visible')
            cy.get(sel.card.delete).should('be.visible')
        })
    }

    // "Delete" en la tarjeta con este título (en la lista o en la vista de
    // detalle): abre el diálogo de confirmación con el título de la nota.
    clickDelete(title) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.card.root, title, T).find(sel.card.delete).click()
            cy.get(sel.deleteDialog.root, T).should('be.visible')
                .and('contain.text', sel.texts.deleteDialogTitle)
                .and('contain.text', title)
            cy.get(sel.deleteDialog.confirm).should('have.text', sel.texts.delete)
            cy.get(sel.deleteDialog.cancel).should('have.text', sel.texts.cancel)
        })
    }

    confirmDelete() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.deleteDialog.confirm).click()
            cy.wait('@deleteNote', T).its('response.statusCode').should('eq', 200)
            cy.get(sel.deleteDialog.root).should('not.exist')
        })
    }

    // Cierra el diálogo sin borrar: con "Cancel" o con la X (`close`).
    dismissDelete(button = 'cancel') {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.deleteDialog[button]).click()
            cy.get(sel.deleteDialog.root).should('not.exist')
            cy.get('@deleteNote.all').should('have.length', 0)
        })
    }

    // ─── Lista ────────────────────────────────────────────────────────────────

    // Una sola tarjeta con este título, esta descripción y la fecha de la nota.
    verifyCard(note, { title, description }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.card.root, T).should('have.length', 1)
            cy.get(sel.card.title).should('have.text', title)
            cy.get(sel.card.description).should('have.text', description)
            cy.get(sel.card.updatedAt).should('contain.text', `${cardDate(note.updated_at)} at `)
        })
    }

    verifyCardTitle(title) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.card.root, T).should('have.length', 1)
            cy.get(sel.card.title).should('have.text', title)
        })
    }

    verifyCardDescription(description) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.card.root, T).should('have.length', 1)
            cy.get(sel.card.description).should('have.text', description)
        })
    }

    verifyProgress(textKey, values = {}) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.list.progress, T).should('have.text', fill(sel.texts[textKey], values)))
    }

    verifyCompletedSwitch(completed) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.card.completedSwitch, T).should(completed ? 'be.checked' : 'not.be.checked'))
    }

    verifyNoNotes(category) {
        cy.fixture(FIXTURE).then(sel => {
            const text = category ? fill(sel.texts.noNotesInCategory, { category: category.toLowerCase() }) : sel.texts.noNotesAll
            cy.get(sel.list.noNotes, T).should('be.visible').and('contain.text', text)
            cy.get(sel.card.root).should('not.exist')
        })
    }

    reload() {
        cy.reload()
        cy.wait('@notesList', T)
    }

    clickCategory(category) {
        cy.fixture(FIXTURE).then(sel => cy.get(fill(sel.list.categoryTab, { category: category.toLowerCase() })).click())
    }

    // Exactamente estas tarjetas (el orden de la lista es otra regla).
    verifyCardTitles(titles) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.card.title, T).should($titles => {
                expect([...$titles].map(t => t.innerText.trim())).to.have.members(titles)
            })
        })
    }

    // Exactamente estas tarjetas, en este orden.
    verifyCardOrder(titles) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.card.title, T).should($titles => {
                expect([...$titles].map(t => t.innerText.trim())).to.deep.equal(titles)
            })
        })
    }

    // ─── Estado desde la tarjeta ──────────────────────────────────────────────

    // Clic en el interruptor de la tarjeta con este título; espera que el
    // servidor confirme el cambio (mientras tanto la tarjeta muestra un spinner).
    toggleCompleted(title) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.card.root, title, T).find(sel.card.completedSwitch).click()
            cy.wait('@toggleNote', T).its('response.statusCode').should('eq', 200)
        })
    }

    // Interruptor de la tarjeta con este título: encendido = completada.
    verifyCardCompleted(title, completed) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.card.root, title, T).find(sel.card.completedSwitch, T)
                .should(completed ? 'be.checked' : 'not.be.checked')
        })
    }

    // La pestaña activa se pinta con el color de su categoría y no muestra el
    // punto "•" que tienen las demás (All nunca lo muestra).
    verifyActiveCategory(category) {
        cy.fixture(FIXTURE).then(sel => {
            const tab = name => fill(sel.list.categoryTab, { category: name.toLowerCase() })
            cy.get(tab(category), T).should('have.text', category)
                .and('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
            sel.categories.filter(name => name !== category).forEach(name => {
                cy.get(tab(name)).should('have.text', `${name}•`)
                    .and('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
            })
        })
    }

    // ─── Búsqueda ─────────────────────────────────────────────────────────────
    // Confirmar la búsqueda (Search o Enter) recarga la página completa en
    // ".../search?keyword=<texto>", o en la lista completa si el campo está
    // vacío (ver docs/discovery).

    typeSearch(text) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.list.searchInput).type(text, { delay: 0 })
            cy.get(sel.list.searchInput).should('have.value', text)
        })
    }

    verifySearchValue(text) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.list.searchInput, T).should('be.visible').and('have.value', text))
    }

    clearSearch() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.list.searchInput).clear()
            cy.get(sel.list.searchInput).should('have.value', '')
        })
    }

    // Con texto espera la respuesta de la búsqueda; con el campo vacío, la
    // lista completa.
    clickSearch({ empty = false } = {}) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.list.searchButton).click())
        this.waitSearchResult(empty)
    }

    pressEnterInSearch({ empty = false } = {}) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.list.searchInput).type('{enter}'))
        this.waitSearchResult(empty)
    }

    waitSearchResult(empty) {
        cy.wait(empty ? '@notesList' : '@searchNotes', T).its('response.statusCode').should('eq', 200)
    }

    verifySearchHeader(keyword) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.list.searchHeader, sel.texts.searchHeaderPrefix, T)
                .should('have.text', fill(sel.texts.searchHeader, { keyword }))
        })
    }

    verifyNoSearchHeader() {
        cy.fixture(FIXTURE).then(sel => cy.contains(sel.list.searchHeader, sel.texts.searchHeaderPrefix).should('not.exist'))
    }

    // Sin coincidencias: el aviso de la búsqueda y ninguna tarjeta.
    verifyNoResults(category) {
        cy.fixture(FIXTURE).then(sel => {
            const text = category ? fill(sel.texts.noResultsInCategory, { category: category.toLowerCase() }) : sel.texts.noResultsAll
            cy.get(sel.list.noNotes, T).should('be.visible').and('have.text', text)
            cy.get(sel.card.root).should('not.exist')
        })
    }

    verifyNoSearchRequest() {
        cy.get('@searchNotes.all').should('have.length', 0)
    }

    // En una categoría vacía el resumen queda oculto (en el DOM trae un texto
    // que no corresponde, ver docs/discovery): lo que cuenta es que no se ve.
    verifyProgressHidden() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.list.progress).should('not.be.visible'))
    }
}

export default NotesPage
