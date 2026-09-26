const FIXTURE = 'selectors/practicesoftwaretesting/comparador.json'
const CATALOG = 'selectors/practicesoftwaretesting/catalogo.json'

const T = { timeout: 15000 }

const normalize = (text) => text.replace(/\s+/g, ' ').trim()
const exact = (name) => new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`)

// Selección de productos desde el catálogo (barra de comparación) y
// pantalla Product Comparison. La selección vive en sessionStorage, que
// Cypress limpia entre tests.
class PSTComparisonPage {

    visit() {
        cy.gotoPSTUrl('/comparison')
    }

    // ─── Desde el catálogo ────────────────────────────────────────────────────

    toggleCompare(productName) {
        cy.fixture(CATALOG).then(cat => {
            cy.fixture(FIXTURE).then(sel => {
                cy.contains(`${cat.productCard} ${cat.productName}`, exact(productName), T)
                    .parents(cat.productCard).find(sel.compareButton).click()
            })
        })
    }

    verifyBarCount(count) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.comparisonBar, T).should($b => {
                expect(normalize($b.text())).to.contain(sel.texts.barCount.replace('{count}', count))
            })
        })
    }

    compareNow() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.compareNow).click())
    }

    // ─── Pantalla de comparación ──────────────────────────────────────────────

    verifyComparedProducts(names) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(`${sel.comparisonTable} ${sel.productName}`, T).should($n => {
                expect([...$n].map(el => normalize(el.innerText))).to.deep.equal(names)
            })
        })
    }

    // Una celda por producto, en el mismo orden que las columnas.
    verifyPricesAndBrands(prices, brands) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.comparePrice).should($p => expect([...$p].map(el => normalize(el.innerText))).to.deep.equal(prices))
            cy.get(sel.compareBrand).should($b => expect([...$b].map(el => normalize(el.innerText))).to.deep.equal(brands))
        })
    }

    toggleShowDifferences() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.showDifferences).click())
    }

    // La app quita del DOM las filas ocultas por "Show differences only";
    // la tabla tiene scroll propio, así que se verifica presencia y no
    // visibilidad en pantalla.
    verifySpecRowShown(specName) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(`${sel.comparisonTable} ${sel.specRow} ${sel.specRowHeader}`, exact(specName), T).should('exist')
        })
    }

    verifySpecRowHidden(specName) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.comparisonTable, T).find(`${sel.specRow} ${sel.specRowHeader}`).should($th => {
                expect([...$th].map(el => normalize(el.innerText))).not.to.include(specName)
            })
        })
    }

    removeProduct(productName) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(`${sel.comparisonTable} ${sel.productName}`, exact(productName), T)
                .parents(sel.headerCell).find(sel.removeProduct).click()
        })
    }

    clearAll() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.clearAll).click())
    }

    verifyTitle() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.comparisonTitle, T).should('contain.text', sel.texts.title))
    }

    verifyEmpty() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.emptyMessage, T).should('contain.text', sel.texts.empty)
            cy.get(sel.comparisonTable).should('not.exist')
        })
    }

    clickBrowseProducts() {
        cy.fixture(FIXTURE).then(sel => cy.contains(`${sel.emptyMessage} a`, sel.texts.browse).click())
    }
}

export default PSTComparisonPage
