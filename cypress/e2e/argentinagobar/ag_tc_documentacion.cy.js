// Test Case AG-TC-DOCUMENTACION - Guía de preguntas frecuentes de Documentación
// ciudadana en Argentina.gob.ar
// Sitio bajo prueba: https://www.argentina.gob.ar/tema/documentacion
// Ticket Jira: SCRUM-65
//
// Flujo público, de solo lectura y sin autenticación sobre el sitio de
// produccion real del Estado argentino. Cubre los 8 Test Cases del Modelo
// Canonico publicados en Zephyr (SCRUM-T90 a SCRUM-T97, Test Cycle
// SCRUM-R14), en 4 criterios de aceptacion atomicos:
// - CA-01 (Estado inicial colapsado): TC-01.1, TC-01.2
// - CA-02 (Expansion de una pregunta): TC-02.1, TC-02.2
// - CA-03 (Colapso de una pregunta expandida): TC-03.1, TC-03.2
// - CA-04 (Independencia entre multiples preguntas): TC-04.1, TC-04.2

import ArgentinaDocumentacionPage from '../../pages/argentinagobar/ArgentinaDocumentacionPage'

const documentacionPage = new ArgentinaDocumentacionPage()

const PREGUNTA_DNI = '¿Necesitás sacar o renovar el DNI?'
const PREGUNTA_CUIL = '¿Necesitás sacar el CUIL?'

describe('AG-TC-DOCUMENTACION - Preguntas frecuentes de Documentación ciudadana [SCRUM-65]', () => {

    beforeEach(() => {
        cy.gotoArgentinaDocumentacion()
    })

    it('[CA-01][TC-01.1][SCRUM-T92] Se muestra el breadcrumb y el título de la página', () => {
        documentacionPage.verifyTituloYBreadcrumb()
    })

    it('[CA-01][TC-01.2][SCRUM-T93] Todas las preguntas frecuentes se muestran colapsadas al cargar la página', () => {
        documentacionPage.verifyTodasColapsadas()
    })

    it('[CA-02][TC-02.1][SCRUM-T97] Al hacer clic en una pregunta colapsada, se expande su contenido', () => {
        documentacionPage.togglePregunta(PREGUNTA_DNI)
        documentacionPage.verifyPreguntaExpandida(PREGUNTA_DNI)
    })

    it('[CA-02][TC-02.2][SCRUM-T94] El contenido expandido de una pregunta incluye el enlace al trámite correspondiente', () => {
        documentacionPage.togglePregunta(PREGUNTA_CUIL)
        documentacionPage.verifyContenidoTieneEnlace(PREGUNTA_CUIL)
    })

    it('[CA-03][TC-03.1][SCRUM-T90] Al hacer clic nuevamente sobre una pregunta expandida, se colapsa', () => {
        documentacionPage.togglePregunta(PREGUNTA_DNI)
        documentacionPage.verifyPreguntaExpandida(PREGUNTA_DNI)

        documentacionPage.togglePregunta(PREGUNTA_DNI)
        documentacionPage.verifyPreguntaColapsada(PREGUNTA_DNI)
    })

    it('[CA-03][TC-03.2][SCRUM-T91] Colapsar una pregunta no afecta a otra pregunta que permanece cerrada', () => {
        documentacionPage.togglePregunta(PREGUNTA_DNI)
        documentacionPage.togglePregunta(PREGUNTA_DNI)

        documentacionPage.verifyPreguntaColapsada(PREGUNTA_CUIL)
    })

    it('[CA-04][TC-04.1][SCRUM-T96] Expandir dos preguntas distintas mantiene ambas abiertas simultáneamente', () => {
        documentacionPage.togglePregunta(PREGUNTA_DNI)
        documentacionPage.togglePregunta(PREGUNTA_CUIL)

        documentacionPage.verifyPreguntaExpandida(PREGUNTA_DNI)
        documentacionPage.verifyPreguntaExpandida(PREGUNTA_CUIL)
    })

    it('[CA-04][TC-04.2][SCRUM-T95] Colapsar una de dos preguntas abiertas no colapsa la otra', () => {
        documentacionPage.togglePregunta(PREGUNTA_DNI)
        documentacionPage.togglePregunta(PREGUNTA_CUIL)

        documentacionPage.togglePregunta(PREGUNTA_DNI)

        documentacionPage.verifyPreguntaColapsada(PREGUNTA_DNI)
        documentacionPage.verifyPreguntaExpandida(PREGUNTA_CUIL)
    })
})
