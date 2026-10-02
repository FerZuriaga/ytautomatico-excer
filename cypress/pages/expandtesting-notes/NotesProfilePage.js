const FIXTURE = 'selectors/expandtesting-notes/perfil.json'

const T = { timeout: 15000 }

// Pantalla "Profile". Se entra desde el menú de "My Notes" con la sesión
// iniciada (NotesPage.visitNotes) y se espera el perfil cargado antes de
// editar: los campos se completan recién con la respuesta del servidor.
class NotesProfilePage {

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.profilePath }).as('getProfile')
            cy.intercept({ method: 'PATCH', hostname: sel.api.host, pathname: sel.api.profilePath }).as('updateProfile')
        })
    }

    openFromMenu(user) {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.menu.profile, T).click()
            cy.wait('@getProfile', T)
            cy.location('pathname').should('eq', sel.paths.profile)
            cy.contains(sel.texts.title, T).should('be.visible')
            this.verifyValues({ email: user.email, name: user.name })
            cy.get(sel.form.submit).should('be.visible')
        })
    }

    // Reemplaza el contenido de un campo ('' lo deja vacío).
    setField(field, value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form[field]).clear()
            if (value) cy.get(sel.form[field]).type(value)
            cy.get(sel.form[field]).should('have.value', value)
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    // Aviso del servidor por significado: es el motivo que devuelve el
    // servicio, no un texto copiado.
    verifySaved() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@updateProfile', T).then(({ response }) => {
                expect(response.statusCode, 'perfil actualizado').to.eq(200)
                cy.get(sel.form.alert, T).should('be.visible').and('have.text', response.body.message)
            })
        })
    }

    verifyFieldError(field, textKey) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form[field]).should('have.class', 'is-invalid')
                .parent().find(sel.form.error).should('be.visible').and('have.text', sel.texts[textKey])
            cy.get('@updateProfile.all').should('have.length', 0)
            cy.get(sel.form.alert).should('not.exist')
        })
    }

    reload() {
        cy.reload()
        cy.wait('@getProfile', T)
    }

    // Sin sesión válida no se muestran los datos de la cuenta.
    verifyNotShown() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.id).should('not.exist')
            cy.get(sel.form.email).should('not.exist')
            cy.get(sel.form.name).should('not.exist')
        })
    }

    verifyValues(values) {
        cy.fixture(FIXTURE).then(sel => {
            Object.entries(values).forEach(([field, value]) => cy.get(sel.form[field], T).should('have.value', value))
        })
    }
}

export default NotesProfilePage
