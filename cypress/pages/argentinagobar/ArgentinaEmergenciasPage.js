const NUMEROS_ESPERADOS = ['911', '100', '103', '105', '106', '144', '107', '135', '142']

class ArgentinaEmergenciasPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get breadcrumb() {
        return cy.get('ol.breadcrumb')
    }

    get titulo() {
        return cy.get('#encabezado h1')
    }

    get items() {
        return cy.get('details.ar-details')
    }

    get organismosRelacionados() {
        return cy.contains('h2', 'Organismos relacionados').parent()
    }

    itemPorTexto(texto) {
        return cy.contains('summary.ar-details__title', texto).parents('details.ar-details')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    expandirItem(texto) {
        cy.contains('summary.ar-details__title', texto).click()
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyTituloYBreadcrumb() {
        this.titulo.should('have.text', 'Emergencias')
        this.breadcrumb.should('contain.text', 'Inicio')
        this.breadcrumb.should('contain.text', 'Temas y servicios')
        this.breadcrumb.should('contain.text', 'Emergencias')
    }

    verifyCantidadDeItems(cantidad) {
        this.items.should('have.length', cantidad)
    }

    verifyTodosColapsados() {
        this.items.each(($item) => {
            cy.wrap($item).should('not.have.attr', 'open')
        })
    }

    verifyItemExpandidoConTel(texto, numero) {
        this.itemPorTexto(texto).should('have.attr', 'open')
        this.itemPorTexto(texto).find(`a[href="tel:${numero}"]`).should('have.length.greaterThan', 0)
    }

    // Expande cada uno de los 9 items y compara el numero del titulo con el
    // sufijo del href "tel:" de su boton de llamada.
    verifyTelCoincideConNumeroEnTodos() {
        this.items.each(($item) => {
            cy.wrap($item).find('summary.ar-details__title .figure').invoke('text').then((numero) => {
                cy.wrap($item).click()
                cy.wrap($item).find('a[href^="tel:"]').invoke('attr', 'href').should('eq', `tel:${numero.trim()}`)
            })
        })
    }

    verifyNumerosSinDuplicados() {
        const numeros = []
        cy.get('details.ar-details summary.ar-details__title .figure').each(($span) => {
            numeros.push($span.text().trim())
        }).then(() => {
            const unicos = new Set(numeros)
            expect(numeros).to.deep.equal(NUMEROS_ESPERADOS)
            expect(unicos.size, 'numeros sin duplicados').to.eq(numeros.length)
        })
    }

    verifyOrganismosRelacionadosTieneEnlaces() {
        this.organismosRelacionados.find('a').should('have.length.greaterThan', 0)
    }

    verifyOrganismosRelacionadosEnlacesValidos() {
        this.organismosRelacionados.find('a').each(($a) => {
            expect($a.attr('href'), 'href del organismo relacionado').to.not.be.empty
        })
    }
}

export default ArgentinaEmergenciasPage
