// Test Case AG-TC-TRANSPORTE - Guía de preguntas frecuentes de Transporte en
// Argentina.gob.ar
// Sitio bajo prueba: https://www.argentina.gob.ar/tema/transito-transporte
// Ticket Jira: SCRUM-68
//
// Flujo público, de solo lectura y sin autenticación sobre el sitio de
// produccion real del Estado argentino. Cubre los 8 Test Cases del Modelo
// Canonico publicados en Zephyr (SCRUM-T114 a SCRUM-T121, Test Cycle
// SCRUM-R17), en 4 criterios de aceptacion atomicos:
// - CA-01 (Estado inicial colapsado): TC-01.1, TC-01.2
// - CA-02 (Respuesta con multiples enlaces - horarios de tren): TC-02.1, TC-02.2
// - CA-03 (Respuesta con un unico enlace - proximo colectivo): TC-03.1, TC-03.2
// - CA-04 (Independencia entre multiples preguntas): TC-04.1, TC-04.2

import ArgentinaTransportePage from '../../pages/argentinagobar/ArgentinaTransportePage'

const transportePage = new ArgentinaTransportePage()

const PREGUNTA_SUBE = '¿Necesitás hacer una gestión con la tarjeta SUBE?'
const PREGUNTA_TREN = '¿Querés saber los horarios y las tarifas del tren?'
const PREGUNTA_COLECTIVO = '¿Querés saber cuándo llega el próximo colectivo?'

describe('AG-TC-TRANSPORTE - Preguntas frecuentes de Transporte [SCRUM-68]', () => {

    beforeEach(() => {
        cy.gotoArgentinaTransporte()
    })

    it('[CA-01][TC-01.1][SCRUM-T117] Se muestra el título y breadcrumb de la página', () => {
        transportePage.verifyTituloYBreadcrumb()
    })

    it('[CA-01][TC-01.2][SCRUM-T119] Se listan las 6 preguntas frecuentes, todas colapsadas por defecto', () => {
        transportePage.verifyCantidadDePreguntas(6)
        transportePage.verifyTodasColapsadas()
    })

    it('[CA-02][TC-02.1][SCRUM-T115] Expandir la pregunta sobre horarios de tren muestra múltiples enlaces', () => {
        transportePage.togglePregunta(PREGUNTA_TREN)
        transportePage.verifyContenidoTieneMasDeUnEnlace(PREGUNTA_TREN)
    })

    it('[CA-02][TC-02.2][SCRUM-T121] Uno de los enlaces de la pregunta sobre trenes apunta a la sección de trenes argentinos', () => {
        transportePage.togglePregunta(PREGUNTA_TREN)
        transportePage.verifyContenidoTieneEnlaceConHref(PREGUNTA_TREN, 'trenes-argentinos')
    })

    it('[CA-03][TC-03.1][SCRUM-T116] Expandir la pregunta sobre el próximo colectivo muestra un único enlace', () => {
        transportePage.togglePregunta(PREGUNTA_COLECTIVO)
        transportePage.verifyContenidoTieneExactamenteUnEnlace(PREGUNTA_COLECTIVO)
    })

    it('[CA-03][TC-03.2][SCRUM-T118] El enlace de la pregunta sobre el próximo colectivo apunta a la app Cuándo Subo', () => {
        transportePage.togglePregunta(PREGUNTA_COLECTIVO)
        transportePage.verifyContenidoTieneEnlaceConHref(PREGUNTA_COLECTIVO, 'cuandosubo')
    })

    it('[CA-04][TC-04.1][SCRUM-T114] Expandir la pregunta sobre SUBE no afecta a la pregunta sobre colectivos', () => {
        transportePage.togglePregunta(PREGUNTA_SUBE)
        transportePage.verifyPreguntaColapsada(PREGUNTA_COLECTIVO)
    })

    it('[CA-04][TC-04.2][SCRUM-T120] Colapsar la pregunta sobre SUBE no colapsa la pregunta sobre trenes que está expandida', () => {
        transportePage.togglePregunta(PREGUNTA_SUBE)
        transportePage.togglePregunta(PREGUNTA_TREN)

        transportePage.togglePregunta(PREGUNTA_SUBE)

        transportePage.verifyPreguntaColapsada(PREGUNTA_SUBE)
        transportePage.verifyPreguntaExpandida(PREGUNTA_TREN)
    })
})
