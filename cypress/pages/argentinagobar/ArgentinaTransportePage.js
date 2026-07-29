class ArgentinaTransportePage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get breadcrumb() {
        return cy.get('ol.breadcrumb')
    }

    get titulo() {
        return cy.get('#encabezado h1')
    }

    get preguntas() {
        return cy.get('details.ar-details')
    }

    preguntaPorTexto(texto) {
        return cy.contains('summary.ar-details__title', texto).parents('details.ar-details')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    togglePregunta(texto) {
        cy.contains('summary.ar-details__title', texto).click()
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyTituloYBreadcrumb() {
        this.titulo.should('have.text', 'Transporte')
        this.breadcrumb.should('contain.text', 'Inicio')
        this.breadcrumb.should('contain.text', 'Temas y servicios')
        this.breadcrumb.should('contain.text', 'Transporte')
    }

    verifyCantidadDePreguntas(cantidad) {
        this.preguntas.should('have.length', cantidad)
    }

    verifyTodasColapsadas() {
        this.preguntas.each(($pregunta) => {
            cy.wrap($pregunta).should('not.have.attr', 'open')
        })
    }

    verifyPreguntaExpandida(texto) {
        this.preguntaPorTexto(texto).should('have.attr', 'open')
    }

    verifyPreguntaColapsada(texto) {
        this.preguntaPorTexto(texto).should('not.have.attr', 'open')
    }

    verifyContenidoTieneMasDeUnEnlace(texto) {
        this.preguntaPorTexto(texto).find('.ar-details__content a').should('have.length.greaterThan', 1)
    }

    verifyContenidoTieneExactamenteUnEnlace(texto) {
        this.preguntaPorTexto(texto).find('.ar-details__content a').should('have.length', 1)
    }

    verifyContenidoTieneEnlaceConHref(texto, hrefIncluye) {
        this.preguntaPorTexto(texto).find(`.ar-details__content a[href*="${hrefIncluye}"]`)
            .should('have.length.greaterThan', 0)
    }
}

export default ArgentinaTransportePage
