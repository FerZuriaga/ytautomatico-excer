// ─── Practice Software Testing (Toolshop v5) Commands ───────────────────────

// El front pide productos con el metodo HTTP QUERY (listado y busqueda). El
// Node que trae Cypress 14 (20.18.1) no reconoce QUERY: su proxy no puede
// reenviar esas requests y el catalogo nunca carga dentro de Cypress.
// Adaptador de test (aprobado por el usuario 2026-09-25): cada XHR QUERY
// sale como GET con el body JSON pasado a query string. La API responde lo
// mismo por GET (verificado con curl). Lo unico que queda sin cubrir es el
// metodo QUERY en si. Ver docs/discovery/practicesoftwaretesting.md.
const sendQueryAsGet = (win) => {
    const proto = win.XMLHttpRequest.prototype
    const open = proto.open
    const send = proto.send
    const setRequestHeader = proto.setRequestHeader

    proto.open = function (method, url, ...rest) {
        if (String(method).toUpperCase() !== 'QUERY') return open.call(this, method, url, ...rest)
        // open() se difiere hasta send(): recien ahi se conoce el body.
        this.__pstQuery = { url, rest, headers: [] }
    }

    proto.setRequestHeader = function (name, value) {
        if (!this.__pstQuery) return setRequestHeader.call(this, name, value)
        this.__pstQuery.headers.push([name, value])
    }

    proto.send = function (body) {
        const query = this.__pstQuery
        if (!query) return send.call(this, body)
        this.__pstQuery = null

        const url = new win.URL(query.url, win.location.href)
        const params = typeof body === 'string' && body ? JSON.parse(body) : (body || {})
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) url.searchParams.set(key, value)
        })

        open.call(this, 'GET', url.toString(), ...query.rest)
        query.headers
            .filter(([name]) => name.toLowerCase() !== 'content-type')
            .forEach(([name, value]) => setRequestHeader.call(this, name, value))
        return send.call(this)
    }
}

// La app elige el idioma por localStorage "language" y, si no existe, por
// el idioma del navegador (en una PC en espanol abre en espanol). Los Test
// Cases estan escritos con los textos en ingles: se fija "en" antes de
// cargar. `sessionStorage` (opcional) precarga claves de la sesion, ej. el
// cart_id de un carrito preparado con cy.pstSeedCart.
Cypress.Commands.add("gotoPSTUrl", (route, { sessionStorage = {} } = {}) => {
    cy.visit(`${Cypress.env('practicesoftwaretestingUrl')}${route}`, {
        onBeforeLoad(win) {
            win.localStorage.setItem('language', 'en')
            Object.entries(sessionStorage).forEach(([key, value]) => win.sessionStorage.setItem(key, value))
            sendQueryAsGet(win)
        }
    })
})

// Prepara un carrito por API (precondicion de los Test Cases del Carrito):
// crea el carrito y agrega cada producto buscandolo por su nombre exacto
// (los ids cambian en cada re-siembra de la demo). Devuelve el cart_id,
// que la app lee de sessionStorage. Sin "Accept: application/json" la API
// responde con una redireccion HTML en vez del error.
Cypress.Commands.add("pstSeedCart", (items) => {
    const headers = { Accept: 'application/json' }
    return cy.fixture('selectors/practicesoftwaretesting/carrito.json').then(sel => {
        const api = `https://${sel.api.host}`
        return cy.request({ method: 'POST', url: `${api}${sel.api.cartsPath}`, headers }).then(({ body: cart }) => {
            items.forEach(({ name, quantity }) => {
                cy.request({ url: `${api}/products/search`, qs: { q: name }, headers }).then(({ body }) => {
                    const product = body.data.find(p => p.name === name)
                    expect(product, `producto semilla "${name}"`).to.exist
                    cy.request({ method: 'POST', url: `${api}${sel.api.cartsPath}/${cart.id}`, headers, body: { product_id: product.id, quantity } })
                })
            })
            return cy.wrap(cart.id)
        })
    })
})
