// Test Case RC-TC-VENCIMIENTOS - Calendario de vencimientos en Rentas Córdoba
// Sitio bajo prueba: https://www.rentascordoba.gob.ar/cms/vencimientos/
// Ticket Jira: SCRUM-62
//
// Flujo público, de solo lectura y sin autenticación sobre el sitio de
// produccion real de Rentas Cordoba. Cubre los 10 Test Cases del Modelo
// Canonico publicados en Zephyr (SCRUM-T63 a SCRUM-T74, Test Cycle
// SCRUM-R11), en 3 criterios de aceptacion atomicos:
// - CA-01 (Visualizacion del calendario del mes actual): TC-01.1, TC-01.2
// - CA-02 (Navegacion entre meses): TC-02.1, TC-02.2, TC-02.3, TC-02.4
// - CA-03 (Filtrado de vencimientos por categoria): TC-03.1, TC-03.2, TC-03.3, TC-03.4

import RentasVencimientosPage from '../../pages/rentascordoba/RentasVencimientosPage'

const vencimientosPage = new RentasVencimientosPage()

describe('RC-TC-VENCIMIENTOS - Calendario de vencimientos en Rentas Córdoba [SCRUM-62]', () => {

    beforeEach(() => {
        cy.gotoRentasCordobaVencimientos()
    })

    it('[CA-01][TC-01.1][SCRUM-T65] Debe mostrar el mes actual con el listado de vencimientos coherente con el calendario', () => {
        vencimientosPage.verifyMesTituloEsElMesActual()
        vencimientosPage.verifyListadoTieneItems()
        vencimientosPage.verifyCoherenciaEntreCalendarioYListado()
    })

    it('[CA-01][TC-01.2][SCRUM-T63] Un día sin vencimientos no debe mostrar ningún indicador', () => {
        vencimientosPage.verifyPrimerDiaSinVencimientoNoTieneBadge()
    })

    it('[CA-02][TC-02.1][SCRUM-T72] Debe avanzar al mes siguiente al usar el control Siguiente', () => {
        vencimientosPage.mesTitulo.invoke('text').then((mesOriginal) => {
            vencimientosPage.irAMesSiguiente()
            vencimientosPage.verifyMesTituloCambioRespectoA(mesOriginal)
        })
    })

    it('[CA-02][TC-02.2][SCRUM-T68] Debe retroceder al mes anterior al usar el control Anterior', () => {
        vencimientosPage.mesTitulo.invoke('text').then((mesOriginal) => {
            vencimientosPage.irAMesAnterior()
            vencimientosPage.verifyMesTituloCambioRespectoA(mesOriginal)
        })
    })

    it('[CA-02][TC-02.3][SCRUM-T69] Navegar de ida y vuelta entre meses debe volver al mes original', () => {
        vencimientosPage.mesTitulo.invoke('text').then((mesOriginal) => {
            vencimientosPage.irAMesSiguiente()
            vencimientosPage.irAMesAnterior()
            vencimientosPage.verifyMesTituloEsIgualA(mesOriginal)
        })
    })

    it('[CA-02][TC-02.4][SCRUM-T71] Navegar hasta un mes sin vencimientos debe mostrar un listado vacío sin errores', () => {
        vencimientosPage.navegarHaciaAdelanteHastaMesVacio()
        vencimientosPage.verifyListadoVacio()
    })

    it('[CA-03][TC-03.1][SCRUM-T73] Filtrar por una categoría específica debe mostrar solo sus vencimientos', () => {
        vencimientosPage.filtrarPorCategoria('AUTOMOTOR')
        vencimientosPage.verifyTodosLosItemsSonDeCategoria('AUTOMOTOR')
    })

    it('[CA-03][TC-03.2][SCRUM-T66] Volver a Todos tras un filtro debe restaurar el listado completo', () => {
        vencimientosPage.vencimientoItems.its('length').then((cantidadOriginal) => {
            vencimientosPage.filtrarPorCategoria('AUTOMOTOR')
            vencimientosPage.filtrarPorCategoria('Todos')
            vencimientosPage.vencimientoItems.should('have.length', cantidadOriginal)
        })
    })

    it('[CA-03][TC-03.3][SCRUM-T70] Filtrar una categoría sin vencimientos en un mes vacío debe mostrar un estado vacío coherente', () => {
        vencimientosPage.navegarHaciaAdelanteHastaMesVacio()
        vencimientosPage.filtrarPorCategoria('AUTOMOTOR')
        vencimientosPage.verifyListadoVacio()
    })

    it('[CA-03][TC-03.4][SCRUM-T74] Cambiar entre categorías consecutivas debe actualizar el listado en cada cambio', () => {
        vencimientosPage.filtrarPorCategoria('AUTOMOTOR')
        vencimientosPage.verifyTodosLosItemsSonDeCategoria('AUTOMOTOR')

        vencimientosPage.filtrarPorCategoria('INMOBILIARIO')
        vencimientosPage.verifyTodosLosItemsSonDeCategoria('INMOBILIARIO')

        vencimientosPage.filtrarPorCategoria('AGENTES')
        vencimientosPage.verifyTodosLosItemsSonDeCategoria('AGENTES')
    })
})
