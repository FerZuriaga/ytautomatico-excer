// PASO 1 (Discovery) del pipeline de CLAUDE.md: releva selectores reales
// del buscador de productos (home + pagina de resultados) via cy.reconPage
// antes de escribir codigo, y los persiste como artefacto permanente en
// cypress/fixtures/selectors/busqueda-productos.json.

describe('Recon - Busqueda de productos', () => {
    const base = Cypress.env('automationTestStoreUrl')

    it('releva el formulario real del buscador en la home', () => {
        cy.reconPage('busqueda_productos', `${base}/`).then(result => {
            const searchForm = result.forms.find(f =>
                f.fields.some(field => field.name === 'filter_keyword')
            )
            cy.writeFile('cypress/fixtures/selectors/_recon_busqueda_home.json', {
                formId: searchForm.id,
                fields: searchForm.fields
            })
        })
    })

    // El boton de lupa de la home es un <div> sin selector de submit real
    // (reconPage no lo lista en result.buttons por eso, mismo gotcha ya
    // documentado con el link de "quitar producto" del carrito). Confirmado
    // por click real: navega via GET directo a rt=product/search con
    // parametros keyword/category_id (no AJAX, no coincide con los nombres
    // de campo del form: filter_keyword/filter_category_id -> keyword/
    // category_id).
    it('confirma el comportamiento real al hacer click en la lupa (no es un submit estandar)', () => {
        cy.visit(`${base}/`)
        cy.get('#filter_keyword').type('bronzer')
        cy.get('.button-in-search').click()
        cy.url().should('include', 'rt=product/search&keyword=bronzer')
    })

    // La pagina de resultados (rt=product/search) navega por GET, no por un
    // <form> con submit real desde la home -- se releva visitando la URL
    // directo con distintos parametros en vez de cy.reconSubmit (pensado
    // para formularios con submit real).
    const searchUrl = (keyword, categoryId = 0) =>
        `${base}/index.php?rt=product/search&keyword=${encodeURIComponent(keyword)}&category_id=${categoryId}`

    function dumpSearchResult(label, url) {
        cy.visit(url)
        cy.get('body').then($body => {
            cy.writeFile(`cypress/fixtures/selectors/_recon_busqueda_${label}.json`, {
                urlAfter: url,
                heading: $body.find('h1').first().text().trim(),
                productCount: $body.find('.thumbnails .thumbnail').length
            })
        })
    }

    it('PASO 2 - keyword con resultados reales', () => {
        dumpSearchResult('con_resultados', searchUrl('bronzer'))
    })

    it('PASO 2 - keyword sin resultados', () => {
        dumpSearchResult('sin_resultados', searchUrl('zzzzzznoexiste999'))
        cy.contains('h4', 'Products meeting the search criteria').next().invoke('text').then(text => {
            cy.writeFile('cypress/fixtures/selectors/_recon_busqueda_sin_resultados_msg.json', { message: text.trim() })
        })
    })

    it('PASO 2 - keyword vacio', () => {
        dumpSearchResult('vacio', searchUrl(''))
    })

    it('PASO 2 - keyword con filtro de categoria que no contiene el producto', () => {
        // "bronzer" pertenece a Makeup (category_id=36); filtrar por Books (65)
        dumpSearchResult('categoria_sin_match', searchUrl('bronzer', 65))
    })

    it('PASO 2 - keyword con filtro de categoria que si contiene el producto', () => {
        dumpSearchResult('categoria_con_match', searchUrl('bronzer', 36))
    })

    // Confirma que el formulario de "refinar busqueda" embebido en la propia
    // pagina de resultados (id keyword/category_id/description/model +
    // #search_button) tambien navega por GET real, igual que el buscador de
    // la home -- ambos puntos de entrada llevan al mismo comportamiento.
    it('PASO 2 - confirma que el formulario de refinar busqueda tambien es GET real', () => {
        cy.visit(searchUrl('bronzer'))
        cy.get('#keyword').clear().type('bronzer')
        cy.get('#category_id').select('Makeup')
        cy.get('#search_button').click()
        // El select de categoria del refine form usa "path" (0,36), no el id
        // simple que usa el buscador de la home (category_id=36) -- 2
        // formatos reales distintos para el mismo filtro segun el punto de
        // entrada, confirmado por la URL real resultante.
        cy.url().should('include', 'category_id=0%2C36')
        cy.get('.thumbnails .thumbnail').should('have.length', 4)
    })
})
