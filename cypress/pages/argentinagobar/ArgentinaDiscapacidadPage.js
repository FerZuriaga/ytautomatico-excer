class ArgentinaDiscapacidadPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get titulo() {
        return cy.get('#encabezado h1')
    }

    get tramitesDestacadosEncabezado() {
        return cy.contains('h2', 'Trámites destacados')
    }

    get tramitesDestacadosSeccion() {
        return this.tramitesDestacadosEncabezado.parents('.panel-pane').nextAll('.pane-atajos').first()
    }

    get tramitesDestacadosCards() {
        return this.tramitesDestacadosSeccion.find('a.panel')
    }

    accesoPorTitulo(texto) {
        return cy.contains('h3', texto).parents('a.panel')
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyTitulo() {
        this.titulo.should('have.text', 'Secretaría Nacional de Discapacidad')
    }

    verifyEncabezadoTramitesDestacados() {
        this.tramitesDestacadosEncabezado.should('exist')
    }

    verifyCantidadDeAccesos(cantidad) {
        this.tramitesDestacadosCards.should('have.length', cantidad)
    }

    verifyTodosLosTitulosNoVacios() {
        this.tramitesDestacadosCards.each(($card) => {
            cy.wrap($card).find('h3').invoke('text').should('not.be.empty')
        })
    }

    verifyTodosLosHrefsNoVacios() {
        this.tramitesDestacadosCards.each(($card) => {
            expect($card.attr('href'), 'href del acceso directo').to.not.be.empty
        })
    }

    verifyHrefsSonDistintos() {
        this.tramitesDestacadosCards.then(($cards) => {
            const hrefs = [...$cards].map((card) => card.getAttribute('href'))
            const unicos = new Set(hrefs)
            expect(unicos.size, 'hrefs sin duplicados').to.eq(hrefs.length)
        })
    }

    verifyAccesoTieneHrefConTexto(texto, hrefIncluye) {
        this.accesoPorTitulo(texto).should('have.attr', 'href').and('include', hrefIncluye)
    }
}

export default ArgentinaDiscapacidadPage
