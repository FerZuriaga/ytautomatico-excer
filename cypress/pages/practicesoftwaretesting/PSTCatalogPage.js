const FIXTURE = 'selectors/practicesoftwaretesting/catalogo.json'

// La API responde en ~200-800 ms pero en la demo publica compartida hay
// picos: las verificaciones que dependen de una respuesta usan este tope.
const T = { timeout: 15000 }

const priceOf = ($el) => Number($el.text().replace(/[^0-9.]/g, ''))

// Los ids de categorias y marcas cambian cada vez que la demo re-siembra la
// base: la opcion de filtro se ubica por su texto visible exacto ("Saw" no
// debe tomar "Hand Saw").
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const filterOption = (sel, name) =>
    cy.contains(`${sel.filtersPanel} ${sel.filterOptionLabel}`, new RegExp(`^\\s*${escapeRegex(name)}\\s*$`), T).find('input')

class PSTCatalogPage {

    // ─── Navegación ───────────────────────────────────────────────────────────

    // Registra los alias de la API antes de cargar la Home: @pstList es el
    // listado (filtros, orden, rango de precio) y @pstSearch la búsqueda.
    // El front las pide con QUERY; el adaptador de cy.gotoPSTUrl las envia
    // como GET (ver cypress/support/commands/practicesoftwaretesting.js).
    // Se espera la carga inicial para que el próximo cy.wait('@pstList')
    // corresponda a una acción del test y no al listado de arranque.
    visit() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: sel.api.method, hostname: sel.api.host, pathname: sel.api.listPath }).as('pstList')
            cy.intercept({ method: sel.api.method, hostname: sel.api.host, pathname: sel.api.searchPath }).as('pstSearch')
            cy.gotoPSTUrl('/')
            cy.wait('@pstList', T)
        })
    }

    verifyInitialCatalog() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productCard, T).should('have.length', sel.data.pageSize)
            cy.get(sel.searchInput).should('be.visible')
            cy.get(sel.sortSelect).should('be.visible')
            cy.get(sel.filtersPanel).should('exist')
        })
    }

    // ─── Búsqueda ─────────────────────────────────────────────────────────────

    search(term) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.searchInput).clear()
            if (term) cy.get(sel.searchInput).type(term)
            cy.get(sel.searchSubmit).click()
        })
    }

    clearSearch() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.searchReset).click())
    }

    verifySearchCaption(term) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.searchCaption, T).should('contain.text', sel.texts.searchCaptionPrefix)
            cy.get(sel.searchTerm).should('have.text', term)
        })
    }

    verifyResultCount(count, term) {
        cy.fixture(FIXTURE).then(sel => {
            const text = count === 1
                ? sel.texts.resultCountOne.replace('{query}', term)
                : sel.texts.resultCountOther.replace('{count}', count).replace('{query}', term)
            cy.get(sel.searchResultCount, T).should('contain.text', text)
        })
    }

    verifyNoSearchCaption() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.searchCaption).should('not.exist'))
    }

    // Con un término inválido el formulario no se envía: el campo queda
    // inválido y no sale ninguna búsqueda a la API.
    verifySearchNotPerformed() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.searchInput).should('have.class', 'ng-invalid')
            cy.get(sel.searchCaption).should('not.exist')
            cy.get(sel.productCard).should('have.length', sel.data.pageSize)
            cy.get('@pstSearch.all').should('have.length', 0)
        })
    }

    // ─── Orden ────────────────────────────────────────────────────────────────

    sortBy(optionKey) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.sortSelect).select(sel.sortOptions[optionKey]))
    }

    // Para verificar que un listado NO cambia tras una acción: sin esperar
    // la respuesta, la aserción pasaría con el estado previo.
    waitForListResponse() {
        cy.wait('@pstList', T)
    }

    // ─── Filtros ──────────────────────────────────────────────────────────────

    checkCategory(categoryKey) {
        cy.fixture(FIXTURE).then(sel => {
            filterOption(sel, sel.data.categories[categoryKey]).check()
        })
    }

    uncheckCategory(categoryKey) {
        cy.fixture(FIXTURE).then(sel => {
            filterOption(sel, sel.data.categories[categoryKey]).uncheck()
        })
    }

    verifyCategoriesChecked(categoryKeys) {
        cy.fixture(FIXTURE).then(sel => {
            categoryKeys.forEach(key => {
                filterOption(sel, sel.data.categories[key]).should('be.checked')
            })
        })
    }

    checkBrand(brandKey) {
        cy.fixture(FIXTURE).then(sel => {
            filterOption(sel, sel.data.brands[brandKey]).check()
        })
    }

    checkEcoFriendly() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.ecoFriendlyCheckbox).check())
    }

    // El slider (ngx-slider) no tiene data-test ni input: se opera con el
    // teclado sobre cada extremo. Cada tecla dispara una consulta al soltarse
    // y el front no cancela la anterior, así que se espera la respuesta de
    // cada tecla antes de la siguiente (si no, una respuesta vieja puede
    // pisar a la última).
    setMinPriceToFloor() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.priceSliderMinHandle).focus().type('{home}')
            cy.wait('@pstList', T)
        })
    }

    // Requiere el mínimo ya en 0: Home lleva el máximo a 0 y cada flecha
    // derecha suma 1.
    setMaxPrice(value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.priceSliderMaxHandle).focus().type('{home}')
            cy.wait('@pstList', T)
            Cypress._.times(value, () => {
                cy.get(sel.priceSliderMaxHandle).type('{rightarrow}')
                cy.wait('@pstList', T)
            })
        })
    }

    verifyPriceRange(min, max) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.priceSliderMinLabel).should($l => expect($l.text().trim()).to.equal(String(min)))
            cy.get(sel.priceSliderMaxLabel).should($l => expect($l.text().trim()).to.equal(String(max)))
        })
    }

    // ─── Verificaciones del listado ───────────────────────────────────────────

    verifyProductCount(count) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.productCard, T).should('have.length', count))
    }

    // Conjunto exacto de productos, sin importar el orden.
    verifyExactProducts(names) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productCard, T).should('have.length', names.length)
            cy.get(`${sel.productCard} ${sel.productName}`).should($names => {
                const shown = [...$names].map(el => el.innerText.trim()).sort()
                expect(shown).to.deep.equal([...names].sort())
            })
        })
    }

    verifyContainsProducts(names) {
        cy.fixture(FIXTURE).then(sel => {
            names.forEach(name => cy.contains(`${sel.productCard} ${sel.productName}`, name, T).should('be.visible'))
        })
    }

    verifyFirstProduct(name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(`${sel.productCard} ${sel.productName}`, T).should($names => expect($names.first().text().trim()).to.equal(name))
        })
    }

    verifyLastProduct(name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(`${sel.productCard} ${sel.productName}`, T).should($names => expect($names.last().text().trim()).to.equal(name))
        })
    }

    verifyFirstProductPrice(price) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productCard, T).first().find(sel.productPrice).should($p => {
                expect(priceOf($p)).to.equal(price)
            })
        })
    }

    verifyPricesSorted(direction) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(`${sel.productCard} ${sel.productPrice}`).should($prices => {
                const prices = [...$prices].map(el => priceOf(Cypress.$(el)))
                const sorted = [...prices].sort((a, b) => direction === 'asc' ? a - b : b - a)
                expect(prices).to.deep.equal(sorted)
            })
        })
    }

    verifyNamesSorted(direction) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(`${sel.productCard} ${sel.productName}`).should($names => {
                const names = [...$names].map(el => el.innerText.trim())
                const cmp = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })
                const sorted = [...names].sort((a, b) => direction === 'asc' ? cmp(a, b) : cmp(b, a))
                expect(names).to.deep.equal(sorted)
            })
        })
    }

    verifyAllPricesAtMost(max) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(`${sel.productCard} ${sel.productPrice}`).each($p => {
                expect(priceOf($p)).to.be.at.most(max)
            })
        })
    }

    verifyAllProductsEcoFriendly() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productCard).each($card => {
                expect($card.find(sel.ecoBadge), 'insignia ECO').to.have.length(1)
            })
        })
    }

    verifyNoResults() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.noResults, T).should('contain.text', sel.texts.noResults)
            cy.get(sel.productCard).should('not.exist')
        })
    }

    verifyPageCount(count) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.paginationNumbers, T).should('have.length', count))
    }

    verifyFullCatalogPagination() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.paginationNumbers, T).should('have.length.greaterThan', 1)
            cy.get(sel.paginationNext).should('exist')
        })
    }

    verifyNoPagination() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.paginationNumbers).should('not.exist'))
    }

    // ─── Apertura de un producto ──────────────────────────────────────────────

    // Por nombre exacto: los ids cambian en cada re-siembra de la demo, así
    // que nunca se entra a la ficha por URL.
    openProduct(name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(`${sel.productCard} ${sel.productName}`, new RegExp(`^\\s*${escapeRegex(name)}\\s*$`), T).click()
        })
    }
}

export default PSTCatalogPage
