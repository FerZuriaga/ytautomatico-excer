const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

class RentasVencimientosPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get mesTitulo() {
        return cy.get('#mesTitulo')
    }

    get btnAnterior() {
        return cy.get('.controles').contains('button', 'Anterior')
    }

    get btnSiguiente() {
        return cy.get('.controles').contains('button', 'Siguiente')
    }

    get listadoContenido() {
        return cy.get('#listadoContenido')
    }

    get vencimientoItems() {
        return cy.get('#listadoContenido .vencimiento')
    }

    get diasDelMesConVencimiento() {
        return cy.get('.calendario-grid .dia.con-vencimiento:not(.otro-mes)')
    }

    get diasDelMesSinVencimiento() {
        return cy.get('.calendario-grid .dia:not(.otro-mes):not(.con-vencimiento)')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    filtrarPorCategoria(categoria) {
        cy.get('.filtros').contains('button.filtro-btn', categoria).click()
    }

    irAMesSiguiente() {
        this.btnSiguiente.click()
    }

    irAMesAnterior() {
        this.btnAnterior.click()
    }

    // Avanza mes a mes hasta encontrar uno sin vencimientos, o hasta agotar
    // los intentos. El horizonte de datos publicados es una condicion del
    // sitio (no del test), por eso se navega dinamicamente en vez de asumir
    // una cantidad fija de meses hacia adelante.
    navegarHaciaAdelanteHastaMesVacio(intentosRestantes = 15) {
        this.listadoContenido.invoke('text').then((texto) => {
            if (texto.includes('No hay vencimientos') || intentosRestantes <= 0) {
                return
            }
            this.irAMesSiguiente()
            cy.wrap(null).then(() => this.navegarHaciaAdelanteHastaMesVacio(intentosRestantes - 1))
        })
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyMesTituloEsElMesActual() {
        const ahora = new Date()
        const etiquetaEsperada = `${MESES[ahora.getMonth()]} ${ahora.getFullYear()}`
        this.mesTitulo.should('have.text', etiquetaEsperada)
    }

    verifyMesTituloCambioRespectoA(mesOriginal) {
        this.mesTitulo.invoke('text').should('not.eq', mesOriginal)
    }

    verifyMesTituloEsIgualA(mesEsperado) {
        this.mesTitulo.should('have.text', mesEsperado)
    }

    verifyListadoTieneItems() {
        this.vencimientoItems.should('have.length.greaterThan', 0)
    }

    verifyListadoVacio() {
        this.listadoContenido.should('contain.text', 'No hay vencimientos')
    }

    verifyTodosLosItemsSonDeCategoria(categoria) {
        this.vencimientoItems.each(($item) => {
            cy.wrap($item).find('.venc-cat').should('have.text', categoria)
        })
    }

    // Compara la cantidad de dias marcados como "con vencimiento" en el mes
    // visible contra la cantidad de fechas distintas listadas en el detalle.
    verifyCoherenciaEntreCalendarioYListado() {
        this.diasDelMesConVencimiento.its('length').then((cantidadDiasMarcados) => {
            this.vencimientoItems.then(($items) => {
                const fechasUnicas = new Set(
                    [...$items].map((item) => item.querySelector('.venc-fecha').innerText.trim())
                )
                expect(fechasUnicas.size).to.eq(cantidadDiasMarcados)
            })
        })
    }

    verifyPrimerDiaSinVencimientoNoTieneBadge() {
        this.diasDelMesSinVencimiento.first().find('.dia-badge').should('not.exist')
    }
}

export default RentasVencimientosPage
