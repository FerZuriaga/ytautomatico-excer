const FIXTURE = 'selectors/practicesoftwaretesting/navegacion.json'

const T = { timeout: 15000 }

// Menú Categories y paginado del catálogo (Home y páginas de categoría).
class PSTNavigationPage {

    // ─── Menú ─────────────────────────────────────────────────────────────────

    openMenuItem(name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.menuCategories).first().click()
            cy.get(sel.menuItems[name]).click()
        })
    }

    verifyCategoryTitle(name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.pageTitle, T).should($t => {
                expect($t.text().trim()).to.equal(sel.texts.categoryTitle.replace('{name}', name))
            })
        })
    }

    verifyCategoryNoResults() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.categoryEmpty, T).should('contain.text', sel.texts.noResults)
        })
    }

    // ─── Paginado ─────────────────────────────────────────────────────────────

    goToPage(n) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.paginationPageLink.replace('{n}', n), T).click())
    }

    clickNext() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.paginationNext).click())
    }

    clickPrev() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.paginationPrev).click())
    }

    // Una flecha deshabilitada tiene pointer-events: none (Bootstrap): el
    // clic se fuerza para reproducir el intento del usuario, y el test
    // verifica que el listado no cambió.
    clickPrevWhileDisabled() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.paginationPrev).click({ force: true }))
    }

    clickNextWhileDisabled() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.paginationNext).click({ force: true }))
    }

    verifyActivePage(n) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.paginationPageLink.replace('{n}', n), T)
                .parents(sel.paginationItem).should('have.class', sel.activeClass)
        })
    }

    verifyPrevDisabled() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.paginationPrev).parents(sel.paginationItem).should('have.class', sel.disabledClass)
        })
    }

    verifyNextDisabled() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.paginationNext, T).parents(sel.paginationItem).should('have.class', sel.disabledClass)
        })
    }
}

export default PSTNavigationPage
