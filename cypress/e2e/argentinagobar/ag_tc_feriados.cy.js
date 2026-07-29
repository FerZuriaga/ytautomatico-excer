// Test Case AG-TC-FERIADOS - Calendario de feriados nacionales en Argentina.gob.ar
// Sitio bajo prueba: https://www.argentina.gob.ar/feriados
// Ticket Jira: SCRUM-64
//
// Flujo público, de solo lectura y sin autenticación sobre el sitio de
// produccion real del Estado argentino. Cubre los 8 Test Cases del Modelo
// Canonico publicados en Zephyr (SCRUM-T81 a SCRUM-T89, Test Cycle
// SCRUM-R13), en 4 criterios de aceptacion atomicos:
// - CA-01 (Visualizacion del calendario del anio actual): TC-01.1, TC-01.2
// - CA-02 (Indicador del estado del dia actual): TC-02.1, TC-02.2
// - CA-03 (Seleccion de otro anio): TC-03.1, TC-03.2
// - CA-04 (Clasificacion de feriados por tipo): TC-04.1, TC-04.2

import ArgentinaFeriadosPage from '../../pages/argentinagobar/ArgentinaFeriadosPage'

const feriadosPage = new ArgentinaFeriadosPage()

const ANIO_ACTUAL = new Date().getFullYear()
const ANIO_ANTERIOR = ANIO_ACTUAL - 1

describe('AG-TC-FERIADOS - Calendario de feriados nacionales en Argentina.gob.ar [SCRUM-64]', () => {

    beforeEach(() => {
        cy.gotoArgentinaFeriados()
        feriadosPage.esperarCalendarioCargado()
    })

    it('[CA-01][TC-01.1][SCRUM-T84] Debe mostrar el año actual al ingresar sin parámetros', () => {
        feriadosPage.verifyAnioMostradoEs(ANIO_ACTUAL)
    })

    it('[CA-01][TC-01.2][SCRUM-T86] Debe renderizar los 12 meses con el listado de feriados correspondiente', () => {
        feriadosPage.verifyCantidadDeMeses(12)
        feriadosPage.verifyPrimerFeriadoListadoIndicaSuTipo()
    })

    it('[CA-02][TC-02.1][SCRUM-T85] Se muestra un único indicador de estado del día actual', () => {
        feriadosPage.verifyIndicadorDeDiaEsMutuamenteExcluyente()
    })

    it('[CA-02][TC-02.2][SCRUM-T87] El conteo regresivo incluye días restantes y el próximo feriado', () => {
        feriadosPage.verifyConteoRegresivoValido()
    })

    it('[CA-03][TC-03.1][SCRUM-T81] Seleccionar otro año actualiza el calendario mostrado', () => {
        feriadosPage.seleccionarAnio(ANIO_ANTERIOR)
        feriadosPage.verifyUrlTieneAnio(ANIO_ANTERIOR)
        feriadosPage.verifyAnioMostradoEs(ANIO_ANTERIOR)
    })

    it('[CA-03][TC-03.2][SCRUM-T83] Un año distinto al actual no muestra el indicador de estado del día', () => {
        cy.gotoArgentinaFeriados(ANIO_ANTERIOR)
        feriadosPage.esperarCalendarioCargado()
        feriadosPage.verifyIndicadoresDeDiaOcultos()
    })

    it('[CA-04][TC-04.1][SCRUM-T88] La leyenda de referencias muestra las 4 categorías de feriados', () => {
        feriadosPage.verifyReferenciasMuestranLos4Tipos()
    })

    it('[CA-04][TC-04.2][SCRUM-T89] Cada feriado listado indica su tipo junto al nombre', () => {
        feriadosPage.verifyPrimerFeriadoListadoIndicaSuTipo()
    })
})
