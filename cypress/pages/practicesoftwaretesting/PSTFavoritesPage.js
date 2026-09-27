import PSTCatalogPage from './PSTCatalogPage'
import PSTLoginPage from './PSTLoginPage'

const FIXTURE = 'selectors/practicesoftwaretesting/favoritos.json'

const T = { timeout: 15000 }

const JSON_HEADERS = { Accept: 'application/json' }

const normalize = (text) => text.replace(/\s+/g, ' ').trim()

// Favoritos del cliente: alta desde la ficha del producto y la pantalla
// "My favorites" de su cuenta. Cada test usa un cliente propio (la lista es
// por cliente y la re-siembra de la demo borra los usuarios registrados).
class PSTFavoritesPage {

    constructor() {
        this.catalog = new PSTCatalogPage()
        this.login = new PSTLoginPage()
    }

    // ─── Precondiciones por API ───────────────────────────────────────────────

    // Guarda los productos en favoritos del cliente buscándolos por nombre
    // exacto (los ids cambian en cada re-siembra).
    seedFavorites(customer, names) {
        this.login.apiLogin(customer.email, customer.password, 200).then(({ access_token }) => {
            cy.fixture(FIXTURE).then(sel => {
                const api = `https://${sel.api.host}`
                const headers = { ...JSON_HEADERS, Authorization: `Bearer ${access_token}` }
                names.forEach(name => {
                    cy.request({ url: `${api}/products/search`, qs: { q: name }, headers: JSON_HEADERS }).then(({ body }) => {
                        const product = body.data.find(p => p.name === name)
                        expect(product, `producto semilla "${name}"`).to.exist
                        cy.request({ method: 'POST', url: `${api}${sel.api.favoritesPath}`, headers, body: { product_id: product.id } })
                            .its('status').should('eq', 201)
                    })
                })
            })
        })
    }

    // Registra un cliente con los favoritos indicados y deja su sesión lista
    // para la próxima carga de página (la primera visita del test).
    prepareCustomer(names = []) {
        return this.login.createCustomer().then(customer => {
            if (names.length) this.seedFavorites(customer, names)
            this.login.prepareSession(customer)
            return cy.wrap(customer)
        })
    }

    visitHome() {
        this.catalog.visit()
        this.catalog.verifyInitialCatalog()
    }

    verifySignedOut() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navSignIn, T).should('be.visible')
            cy.get(sel.navMenu).should('not.exist')
        })
    }

    // ─── Ficha del producto ───────────────────────────────────────────────────

    // Entra por la Home y busca el producto por nombre: los ids cambian en
    // cada re-siembra, nunca se entra a la ficha por URL.
    openProductDetail(name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'POST', hostname: sel.api.host, pathname: sel.api.favoritesPath }).as('favoriteAdd')
            this.visitHome()
            this.catalog.search(name)
            cy.wait('@pstSearch', T)
            this.catalog.openProduct(name)
            cy.get(sel.addToFavorites, T).should('be.visible')
        })
    }

    // Espera la respuesta de la API antes de afirmar el aviso.
    addToFavorites(expectedStatus) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.addToFavorites).click()
            cy.wait('@favoriteAdd', T).its('response.statusCode').should('eq', expectedStatus)
        })
    }

    verifyToast(textKey, kind) {
        cy.fixture(FIXTURE).then(sel => {
            const container = kind === 'error' ? sel.toastError : sel.toastSuccess
            cy.contains(container, sel.texts[textKey], T).should('be.visible')
        })
    }

    verifyStillOnProduct(name) {
        cy.location('pathname').should('match', /^\/product\//)
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productName).should($n => expect(normalize($n.text())).to.equal(name))
        })
    }

    // ─── Pantalla "My favorites" ──────────────────────────────────────────────

    // Registra los alias de la lista antes de entrar: cada baja (DELETE)
    // recarga la lista (GET) y se esperan ambas antes de afirmar.
    registerListAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.favoritesPath }).as('favoritesList')
            cy.intercept({ method: 'DELETE', hostname: sel.api.host, pathname: new RegExp(`${sel.api.favoritesPath}/[^/]+$`) }).as('favoriteDelete')
        })
    }

    openUserMenu() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navMenu, T).click()
            cy.get(sel.navMyFavorites, T).should('be.visible').and('contain.text', 'My favorites')
        })
    }

    clickMyFavorites() {
        this.registerListAliases()
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navMyFavorites).click()
            cy.wait('@favoritesList', T)
            cy.location('pathname').should('eq', sel.path)
            cy.get(sel.pageTitle, T).should('have.text', sel.texts.title)
        })
    }

    openFromMenu() {
        this.openUserMenu()
        this.clickMyFavorites()
    }

    removeFavorite(name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(`${sel.favoriteCard} ${sel.productName}`, name, T).parents(sel.favoriteCard).find(sel.deleteButton).click()
            cy.wait('@favoriteDelete', T).its('response.statusCode').should('eq', 204)
            cy.wait('@favoritesList', T)
        })
    }

    reload() {
        this.registerListAliases()
        cy.reload()
        cy.wait('@favoritesList', T)
    }

    // Lista exacta de productos en favoritos, sin repetidos.
    verifyFavorites(names) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.pageTitle, T).should('have.text', sel.texts.title)
            cy.get(`${sel.favoriteCard} ${sel.productName}`, T).should($names => {
                expect([...$names].map(el => normalize(el.innerText)).sort()).to.deep.equal([...names].sort())
            })
            cy.get(sel.favoriteCard).find(sel.productDescription).each($d => expect(normalize($d.text())).not.to.be.empty)
        })
    }

    verifyEmpty() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.texts.empty, T).should('be.visible')
            cy.get(sel.favoriteCard).should('not.exist')
        })
    }

    openFavoritesByAddress() {
        cy.fixture(FIXTURE).then(sel => cy.gotoPSTUrl(sel.path))
    }
}

export default PSTFavoritesPage
