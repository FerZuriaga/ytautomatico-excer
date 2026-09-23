const FIXTURE = 'selectors/commitquality/mi-cuenta.json'
const LOGIN_FIXTURE = 'selectors/commitquality/login.json'

class CommitQualityAccountPage {

    // ─── Navegación ───────────────────────────────────────────────────────────

    // El link "My Account" del menu solo se renderiza con sesion iniciada.
    openFromNavbar() {
        cy.fixture(LOGIN_FIXTURE).then(sel => cy.get(sel.navbarAccountLink).click())
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Toggle "+"/"-" sin data-testid (ver docs/discovery/commitquality.md).
    clickToggleDetails() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.toggleDetailsButton).click())
    }

    fillDetails({ name, youtube }) {
        cy.fixture(FIXTURE).then(sel => {
            if (name !== undefined) cy.get(sel.nameInput).clear().type(name)
            if (youtube !== undefined) cy.get(sel.youtubeInput).clear().type(youtube)
        })
    }

    clickSave() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.saveButton).click())
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyOnAccountPage() {
        cy.fixture(FIXTURE).then(sel => {
            cy.url().should('eq', `${Cypress.env('commitqualityUrl')}/account`)
            cy.get(sel.pageTitle).should('be.visible').and('have.text', 'My Account')
        })
    }

    // Ojo: el data-testid de "My Details" esta en la ETIQUETA ("Name:"), no
    // en el valor -- el valor es texto hermano dentro del mismo <li>, por
    // eso se compara el texto completo del padre.
    verifySavedDetails({ name, youtube }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.savedNameLabel).parent().should('have.text', `Name: ${name}`)
            cy.get(sel.savedYoutubeNameLabel).parent().should('have.text', `Youtube Name: ${youtube}`)
        })
    }

    verifyDefaultDetails() {
        cy.fixture(FIXTURE).then(sel => {
            this.verifySavedDetails(sel.defaults)
            cy.get(sel.savedYoutubeChannelLink).should('have.attr', 'href', sel.defaults.youtubeLink)
        })
    }

    verifyDetailsCollapsed() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.toggleDetailsButton).should('have.text', '+')
            cy.get(sel.nameInput).should('not.exist')
            cy.get(sel.youtubeInput).should('not.exist')
            cy.get(sel.saveButton).should('not.exist')
        })
    }

    verifyDetailsExpanded({ name, youtube }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.toggleDetailsButton).should('have.text', '-')
            cy.get(sel.nameInput).should('be.visible').and('have.value', name)
            cy.get(sel.youtubeInput).should('be.visible').and('have.value', youtube)
            cy.get(sel.saveButton).should('be.visible')
        })
    }

    verifyNavbarAccountLinkHidden() {
        cy.fixture(LOGIN_FIXTURE).then(sel => {
            cy.get(sel.navbarLoginLink).should('be.visible')
            cy.get(sel.navbarAccountLink).should('not.exist')
        })
    }
}

export default CommitQualityAccountPage
