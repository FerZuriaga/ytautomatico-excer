const FIXTURE = 'selectors/restful-booker-platform/mensajes.json'

const T = { timeout: 15000 }

const fill = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template)

// Formulario "Send Us a Message" de la página principal. Las reglas de los
// datos las valida el servidor: el rechazo llega como 400 con la lista de
// avisos, que la pantalla muestra juntos en una alerta.
class ContactPage {

    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.messagePath }).as('sendMessage')
            cy.gotoRestfulBookerPlatformUrl(sel.paths.home)
            cy.contains(sel.texts.formTitle, T).should('be.visible')
            ;['name', 'email', 'phone', 'subject', 'message'].forEach(field => cy.get(sel.contact[field]).should('be.visible'))
            this.submitButton(sel).should('be.visible')
        })
    }

    submitButton(sel) {
        return cy.get(sel.contact.name).closest('form').contains(sel.contact.submit, sel.texts.submit)
    }

    // Solo completa lo indicado: un campo sin valor queda vacío.
    fill(data) {
        cy.fixture(FIXTURE).then(sel => {
            Object.entries(data).forEach(([field, value]) => {
                if (!value) return
                cy.get(sel.contact[field]).type(value, { delay: 0 })
                cy.get(sel.contact[field]).should('have.value', value)
            })
        })
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => this.submitButton(sel).click())
    }

    // Envío aceptado: la confirmación con el nombre y el asunto reemplaza al
    // formulario (textos propios de la pantalla, exactos). Se muestra en tres
    // renglones: "We'll get back to you about", el asunto y "as soon as possible.".
    verifySent({ name, subject }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@sendMessage', T).its('response.statusCode').should('eq', 200)
            cy.contains(fill(sel.texts.thanks, { name }), T).should('be.visible').parent().within(() => {
                cy.contains(sel.texts.followUpStart).should('be.visible')
                cy.contains(subject).should('be.visible')
                cy.contains(sel.texts.followUpEnd).should('be.visible')
            })
            cy.get(sel.contact.name).should('not.exist')
        })
    }

    // Rechazo del servidor: 400, la alerta muestra cada aviso que devolvió el
    // servicio y todos hablan de los campos esperados (por significado, no por
    // redacción). El formulario sigue visible.
    verifyRejected(fields) {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@sendMessage', T).then(({ response }) => {
                expect(response.statusCode, 'consulta rechazada').to.eq(400)
                const notices = response.body
                expect(notices, 'avisos del servicio').to.be.an('array').and.not.be.empty
                fields.forEach(field => {
                    expect(notices.some(n => new RegExp(field, 'i').test(n)), `aviso sobre ${field}`).to.eq(true)
                })
                notices.forEach(notice => {
                    expect(fields.some(field => new RegExp(field, 'i').test(notice)), `"${notice}" es de un campo esperado`).to.eq(true)
                    cy.get(sel.contact.errors).should('contain.text', notice)
                })
            })
            cy.get(sel.contact.name).should('be.visible')
            this.submitButton(sel).should('be.visible')
        })
    }
}

export default ContactPage
