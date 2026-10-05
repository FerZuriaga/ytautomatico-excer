const FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

// "Update Profile" (menú "Update Contact Info"). Los datos del cliente se
// cargan por AJAX después de abrir la pantalla: se espera a que el nombre
// tenga valor antes de editar, si no la carga pisa lo escrito.
class ParabankProfilePage {

    // Desde la página de inicio con la sesión iniciada.
    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept('POST', sel.profile.updateRequest).as('updateProfile')
            cy.gotoParabankUrl(sel.paths.home)
            this.openFromMenu()
            cy.get(sel.result.accountServices).should('have.text', sel.texts.accountServices)
            cy.get(sel.result.logout).should('be.visible')
        })
    }

    // Volver a abrir la pantalla desde el menú (datos recién leídos del banco).
    openFromMenu() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.profile.link, T).click()
            cy.get(sel.profile.title, T).should('have.text', sel.texts.updateProfile)
            cy.get(sel.profile.fields.firstName, T).should('not.have.value', '')
        })
    }

    replace(field, value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.profile.fields[field]).clear()
            cy.get(sel.profile.fields[field]).type(value)
            cy.get(sel.profile.fields[field]).should('have.value', value)
        })
    }

    clear(field) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.profile.fields[field]).clear()
            cy.get(sel.profile.fields[field]).should('have.value', '')
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.profile.submit).click())
    }

    verifySaved() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@updateProfile').its('response.statusCode').should('eq', 200)
            cy.get(sel.profile.resultTitle, T).should('have.text', sel.texts.profileUpdated)
            cy.get(sel.profile.resultMessage).invoke('text').should(t => expect(t.trim()).to.eq(sel.texts.profileUpdatedMessage))
            cy.get(sel.profile.form).should('not.be.visible')
        })
    }

    // { campo: valor } tal como los muestra el formulario.
    verifyValues(values) {
        cy.fixture(FIXTURE).then(sel => {
            Object.entries(values).forEach(([field, value]) => cy.get(sel.profile.fields[field]).should('have.value', value))
        })
    }

    // Exactamente los avisos de los campos dados, el formulario en pantalla
    // y ningún pedido de actualización enviado.
    verifyMissing(fields) {
        cy.fixture(FIXTURE).then(sel => {
            fields.forEach(field => {
                cy.get(sel.profile.errors[field]).should('be.visible').and('have.text', sel.texts.required[field])
            })
            cy.get(sel.profile.visibleErrors).should('have.length', fields.length)
            cy.get(sel.profile.form).should('be.visible')
            cy.get('@updateProfile.all').should('have.length', 0)
        })
    }
}

export default ParabankProfilePage
