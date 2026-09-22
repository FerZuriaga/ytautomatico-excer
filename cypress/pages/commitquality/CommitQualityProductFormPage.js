const FIXTURE = 'selectors/commitquality/formulario-producto.json'

class CommitQualityProductFormPage {

    // ─── Navegación ───────────────────────────────────────────────────────────

    visitAdd() {
        cy.gotoCQUrl('/add-product')
    }

    // ─── Verificaciones de estado inicial ────────────────────────────────────

    verifyFormVisible() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.nameInput).should('be.visible')
            cy.get(sel.priceInput).should('be.visible')
            cy.get(sel.dateInput).should('be.visible')
        })
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    fillFields({ name, price, date } = {}) {
        cy.fixture(FIXTURE).then(sel => {
            if (name !== undefined) {
                cy.get(sel.nameInput).clear()
                if (name) cy.get(sel.nameInput).type(name)
            }
            if (price !== undefined) {
                cy.get(sel.priceInput).clear()
                if (price) cy.get(sel.priceInput).type(price)
            }
            if (date !== undefined) {
                cy.get(sel.dateInput).clear()
                if (date) cy.get(sel.dateInput).type(date)
            }
        })
    }

    blurName() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.nameInput).blur())
    }

    blurPrice() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.priceInput).blur())
    }

    blurDate() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.dateInput).blur())
    }

    clickSubmit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.submitButton).click())
    }

    clickCancel() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.cancelButton).click())
    }

    // ─── Verificaciones de resultado ──────────────────────────────────────────

    verifyFieldValues({ name, price, date }) {
        cy.fixture(FIXTURE).then(sel => {
            if (name !== undefined) cy.get(sel.nameInput).should('have.value', name)
            if (price !== undefined) cy.get(sel.priceInput).should('have.value', String(price))
            if (date !== undefined) cy.get(sel.dateInput).should('have.value', date)
        })
    }

    verifyFieldError(expectedText) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.fieldErrorMessage).should('be.visible').and('contain.text', expectedText)
        })
    }

    verifyMissingFieldsError() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.fillInAllFieldsError).should('be.visible').and('contain.text', sel.errorMessages.missingFields)
        })
    }

    verifyStillOnForm(pathIncludes) {
        cy.url().should('include', pathIncludes)
    }

    verifyRedirectedToHome() {
        cy.url().should('eq', `${Cypress.env('commitqualityUrl')}/`)
    }
}

export default CommitQualityProductFormPage
