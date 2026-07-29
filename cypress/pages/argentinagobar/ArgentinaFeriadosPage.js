const TIPOS_FERIADO = [
    'Feriado inamovible',
    'Feriado trasladable',
    'Día no laborable',
    'Feriado turístico'
]

class ArgentinaFeriadosPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get anioActualTitulo() {
        return cy.get('.js-current-year')
    }

    get meses() {
        return cy.get('#calendar-container article.month')
    }

    get listadosDeFeriados() {
        return cy.get('#calendar-container .js-tpl-holidays')
    }

    get btnVerOtroAnio() {
        return cy.get('#share-table-data')
    }

    get dropdownAnios() {
        return cy.get('.js-dropdown-years-menu')
    }

    get bloqueConteoRegresivo() {
        return cy.get('#js-hoynoes')
    }

    get bloqueHoyEsFeriado() {
        return cy.get('#js-hoyes')
    }

    get diasFaltan() {
        return cy.get('#js-faltan')
    }

    get proximoFeriado() {
        return cy.get('#js-proximo')
    }

    get referencias() {
        return cy.get('.references')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    abrirSelectorDeAnio() {
        this.btnVerOtroAnio.click()
    }

    seleccionarAnio(anio) {
        this.abrirSelectorDeAnio()
        this.dropdownAnios.contains('a', `Ver calendario ${anio}`).click()
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    // El calendario se renderiza tras un fetch asincrono de los feriados del
    // anio. Esperar a que los 12 meses existan es la senal estable de que
    // ese fetch termino (daysLeft() se ejecuta en el mismo bloque, antes de
    // pintar los meses), evitando leer el indicador del dia a mitad de carga.
    esperarCalendarioCargado() {
        this.verifyCantidadDeMeses(12)
    }

    verifyAnioMostradoEs(anio) {
        this.anioActualTitulo.should('have.text', String(anio))
    }

    verifyUrlTieneAnio(anio) {
        cy.url().should('include', `year=${anio}`)
    }

    verifyCantidadDeMeses(cantidad) {
        this.meses.should('have.length', cantidad)
    }

    // Recorre los listados mensuales y devuelve, vía callback, el primero
    // que tenga al menos un feriado (no todos los meses tienen).
    conElPrimerListadoConFeriados(callback) {
        this.listadosDeFeriados.then(($listados) => {
            const conFeriados = [...$listados].find((el) => el.querySelectorAll('li').length > 0)
            expect(conFeriados, 'al menos un mes con feriados listados').to.exist
            cy.wrap(conFeriados).within(callback)
        })
    }

    verifyIndicadorDeDiaEsMutuamenteExcluyente() {
        this.bloqueConteoRegresivo.then(($conteo) => {
            this.bloqueHoyEsFeriado.then(($hoyEsFeriado) => {
                const conteoVisible = !$conteo.hasClass('hidden')
                const hoyVisible = !$hoyEsFeriado.hasClass('hidden')
                expect(conteoVisible !== hoyVisible, 'exactamente un indicador visible').to.be.true
            })
        })
    }

    verifyIndicadoresDeDiaOcultos() {
        this.bloqueConteoRegresivo.should('have.class', 'hidden')
        this.bloqueHoyEsFeriado.should('have.class', 'hidden')
    }

    verifyConteoRegresivoValido() {
        this.bloqueConteoRegresivo.then(($conteo) => {
            if ($conteo.hasClass('hidden')) return

            this.diasFaltan.invoke('text').then((texto) => {
                expect(Number(texto.trim())).to.be.greaterThan(0)
            })
            this.proximoFeriado.invoke('text').should('not.be.empty')
        })
    }

    verifyReferenciasMuestranLos4Tipos() {
        TIPOS_FERIADO.forEach((tipo) => {
            const tipoPlural = tipo === 'Feriado inamovible' ? 'Feriados inamovibles'
                : tipo === 'Feriado trasladable' ? 'Feriados trasladables'
                    : tipo === 'Día no laborable' ? 'Días no laborables'
                        : 'Turísticos'
            this.referencias.should('contain.text', tipoPlural)
        })
    }

    verifyPrimerFeriadoListadoIndicaSuTipo() {
        this.conElPrimerListadoConFeriados(() => {
            cy.get('li').first().invoke('text').then((texto) => {
                const incluyeUnTipo = TIPOS_FERIADO.some((tipo) => texto.includes(tipo))
                expect(incluyeUnTipo, `el texto "${texto}" incluye un tipo de feriado`).to.be.true
            })
        })
    }
}

export default ArgentinaFeriadosPage
