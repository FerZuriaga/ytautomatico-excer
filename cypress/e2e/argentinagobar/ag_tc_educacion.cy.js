// Test Case AG-TC-EDUCACION - Guía de preguntas frecuentes de Educación en
// Argentina.gob.ar
// Sitio bajo prueba: https://www.argentina.gob.ar/tema/educacion
// Ticket Jira: SCRUM-67
//
// Flujo público, de solo lectura y sin autenticación sobre el sitio de
// produccion real del Estado argentino. Cubre los 8 Test Cases del Modelo
// Canonico publicados en Zephyr (SCRUM-T106 a SCRUM-T113, Test Cycle
// SCRUM-R16), en 4 criterios de aceptacion atomicos:
// - CA-01 (Estado inicial colapsado): TC-01.1, TC-01.2
// - CA-02 (Expansion de una pregunta): TC-02.1, TC-02.2
// - CA-03 (Enlace al boleto estudiantil / SUBE): TC-03.1, TC-03.2
// - CA-04 (Independencia entre multiples preguntas): TC-04.1, TC-04.2

import ArgentinaEducacionPage from '../../pages/argentinagobar/ArgentinaEducacionPage'

const educacionPage = new ArgentinaEducacionPage()

const PREGUNTA_CALENDARIO = '¿Querés saber cuándo comienzan y finalizan las clases en tu provincia?'
const PREGUNTA_BECAS = '¿Buscás una beca para poder estudiar una carrera científica o técnica?'
const PREGUNTA_BOLETO = '¿Querés pagar el boleto estudiantil?'
const PREGUNTA_CARRERA = '¿Estás buscando una carrera universitaria?'

describe('AG-TC-EDUCACION - Preguntas frecuentes de Educación [SCRUM-67]', () => {

    beforeEach(() => {
        cy.gotoArgentinaEducacion()
    })

    it('[CA-01][TC-01.1][SCRUM-T109] Se muestra el título y breadcrumb de la página', () => {
        educacionPage.verifyTituloYBreadcrumb()
    })

    it('[CA-01][TC-01.2][SCRUM-T112] Se listan las 12 preguntas frecuentes, todas colapsadas por defecto', () => {
        educacionPage.verifyCantidadDePreguntas(12)
        educacionPage.verifyTodasColapsadas()
    })

    it('[CA-02][TC-02.1][SCRUM-T110] Al expandir la pregunta sobre el calendario escolar, se muestra su contenido', () => {
        educacionPage.togglePregunta(PREGUNTA_CALENDARIO)
        educacionPage.verifyPreguntaExpandida(PREGUNTA_CALENDARIO)
    })

    it('[CA-02][TC-02.2][SCRUM-T106] El contenido expandido de la pregunta sobre becas incluye un enlace', () => {
        educacionPage.togglePregunta(PREGUNTA_BECAS)
        educacionPage.verifyContenidoTieneEnlace(PREGUNTA_BECAS)
    })

    it('[CA-03][TC-03.1][SCRUM-T111] El contenido de la pregunta sobre el boleto estudiantil enlaza al servicio de SUBE', () => {
        educacionPage.togglePregunta(PREGUNTA_BOLETO)
        educacionPage.verifyContenidoTieneEnlaceConHref(PREGUNTA_BOLETO, 'sube')
    })

    it('[CA-03][TC-03.2][SCRUM-T107] El enlace de la pregunta sobre el boleto estudiantil no está vacío', () => {
        educacionPage.togglePregunta(PREGUNTA_BOLETO)
        educacionPage.verifyContenidoTieneEnlace(PREGUNTA_BOLETO)
    })

    it('[CA-04][TC-04.1][SCRUM-T108] Expandir dos preguntas distintas mantiene ambas abiertas simultáneamente', () => {
        educacionPage.togglePregunta(PREGUNTA_BOLETO)
        educacionPage.togglePregunta(PREGUNTA_CARRERA)

        educacionPage.verifyPreguntaExpandida(PREGUNTA_BOLETO)
        educacionPage.verifyPreguntaExpandida(PREGUNTA_CARRERA)
    })

    it('[CA-04][TC-04.2][SCRUM-T113] Colapsar una de dos preguntas abiertas no colapsa la otra', () => {
        educacionPage.togglePregunta(PREGUNTA_BOLETO)
        educacionPage.togglePregunta(PREGUNTA_CARRERA)

        educacionPage.togglePregunta(PREGUNTA_BOLETO)

        educacionPage.verifyPreguntaColapsada(PREGUNTA_BOLETO)
        educacionPage.verifyPreguntaExpandida(PREGUNTA_CARRERA)
    })
})
