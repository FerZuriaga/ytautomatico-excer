const FIXTURE = 'selectors/commitquality/practice-iframe.json'
// El iframe embebe la Home del mismo sitio: dentro se usan los mismos
// selectores del catalogo.
const CATALOG_FIXTURE = 'selectors/commitquality/catalogo-productos.json'
const IFRAME_TIMEOUT = 15000

class CommitQualityIframePage {

    // ─── Navegación ───────────────────────────────────────────────────────────

    visit() {
        cy.gotoCQUrl('/practice-iframe')
    }

    // ─── Acceso al documento del iframe ───────────────────────────────────────

    // Iframe del MISMO origen: su contentDocument es accesible. Se espera a
    // que la app embebida monte la tabla (no alcanza con que el body exista:
    // arranca como about:blank y React renderiza despues).
    withIframe(fn) {
        cy.fixture(FIXTURE).then(sel => {
            cy.fixture(CATALOG_FIXTURE).then(cat => {
                const body = () => cy.get(sel.iframe, { timeout: IFRAME_TIMEOUT })
                    .its('0.contentDocument.body', { timeout: IFRAME_TIMEOUT })
                    .should('not.be.empty')
                    .then(cy.wrap)
                body().find(cat.productTable, { timeout: IFRAME_TIMEOUT }).should('be.visible')
                fn(body, cat)
            })
        })
    }

    // ─── Acciones dentro del iframe ───────────────────────────────────────────

    filterByNameInIframe(text) {
        this.withIframe((body, cat) => {
            body().find(cat.filterInput).clear().type(text)
            body().find(cat.filterButton).click()
        })
    }

    clickResetInIframe() {
        this.withIframe((body, cat) => body().find(cat.resetButton).click())
    }

    clickShowMoreInIframe() {
        this.withIframe((body, cat) => body().find(cat.showMoreButton).click())
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyLoaded() {
        cy.fixture(FIXTURE).then(sel => {
            cy.url().should('eq', `${Cypress.env('commitqualityUrl')}/practice-iframe`)
            cy.get(sel.title).should('have.text', 'IFrame')
            cy.get(sel.iframe).should('be.visible')
        })
    }

    verifyIframeRowCount(expectedCount) {
        this.withIframe((body, cat) => {
            body().find(`${cat.productTable} tbody tr`).should('have.length', expectedCount)
        })
    }

    verifyIframeOnlyProductsNamed(expectedName) {
        this.withIframe((body, cat) => {
            body().find(`${cat.productTable} tbody tr [data-testid="name"]`).each(cell => {
                cy.wrap(cell).should('have.text', expectedName)
            })
        })
    }

    verifyIframeInitialCatalog() {
        this.withIframe((body, cat) => {
            body().find(`${cat.productTable} tbody tr`).should('have.length', cat.defaultPageSize)
            body().find(cat.showMoreButton).should('be.visible')
            body().find(cat.addProductLink).should('be.visible')
        })
    }

    verifyIframeShowMoreNotVisible() {
        this.withIframe((body, cat) => body().find(cat.showMoreButton).should('not.exist'))
    }

    verifyIframeFilterEmpty() {
        this.withIframe((body, cat) => body().find(cat.filterInput).should('have.value', ''))
    }

    verifyIframeNoActions() {
        this.withIframe((body, cat) => {
            body().find(`${cat.productTable} thead th`).should('not.contain.text', 'Actions')
            body().find(cat.editButton).should('not.exist')
            body().find(cat.deleteButton).should('not.exist')
        })
    }

    verifyIframeActionsOnEveryRow(expectedCount) {
        this.withIframe((body, cat) => {
            body().find(cat.editButton).should('have.length', expectedCount)
            body().find(cat.deleteButton).should('have.length', expectedCount)
        })
    }

    // La tabla existe SOLO dentro del iframe, no en el documento contenedor.
    verifyContainerHasNoProductTable() {
        cy.fixture(CATALOG_FIXTURE).then(cat => cy.get(cat.productTable).should('not.exist'))
    }
}

export default CommitQualityIframePage
