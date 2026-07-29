// Test Case AG-TC-DISCAPACIDAD - Trámites destacados de la Secretaría
// Nacional de Discapacidad en Argentina.gob.ar
// Sitio bajo prueba: https://www.argentina.gob.ar/salud/senadis
// Ticket Jira: SCRUM-69
//
// Flujo público, de solo lectura y sin autenticación sobre el sitio de
// produccion real del Estado argentino. Cubre los 8 Test Cases del Modelo
// Canonico publicados en Zephyr (SCRUM-T122 a SCRUM-T129, Test Cycle
// SCRUM-R18), en 4 criterios de aceptacion atomicos:
// - CA-01 (Titulo y encabezado de la seccion): TC-01.1, TC-01.2
// - CA-02 (Cantidad y contenido de los accesos): TC-02.1, TC-02.2
// - CA-03 (Integridad de los enlaces): TC-03.1, TC-03.2
// - CA-04 (Correspondencia acceso -> tramite real): TC-04.1, TC-04.2

import ArgentinaDiscapacidadPage from '../../pages/argentinagobar/ArgentinaDiscapacidadPage'

const discapacidadPage = new ArgentinaDiscapacidadPage()

describe('AG-TC-DISCAPACIDAD - Trámites destacados de la Secretaría Nacional de Discapacidad [SCRUM-69]', () => {

    beforeEach(() => {
        cy.gotoArgentinaDiscapacidad()
    })

    it('[CA-01][TC-01.1][SCRUM-T124] Se muestra el título de la página', () => {
        discapacidadPage.verifyTitulo()
    })

    it('[CA-01][TC-01.2][SCRUM-T125] Se muestra el encabezado de la sección Trámites destacados', () => {
        discapacidadPage.verifyEncabezadoTramitesDestacados()
    })

    it('[CA-02][TC-02.1][SCRUM-T126] La sección Trámites destacados contiene exactamente 3 accesos directos', () => {
        discapacidadPage.verifyCantidadDeAccesos(3)
    })

    it('[CA-02][TC-02.2][SCRUM-T122] Cada acceso directo tiene un título no vacío', () => {
        discapacidadPage.verifyTodosLosTitulosNoVacios()
    })

    it('[CA-03][TC-03.1][SCRUM-T127] Los 3 accesos directos tienen enlaces no vacíos', () => {
        discapacidadPage.verifyTodosLosHrefsNoVacios()
    })

    it('[CA-03][TC-03.2][SCRUM-T129] Los enlaces de los 3 accesos directos son todos distintos entre sí', () => {
        discapacidadPage.verifyHrefsSonDistintos()
    })

    it('[CA-04][TC-04.1][SCRUM-T128] El acceso de Pensiones (PNC) enlaza al trámite de pensiones', () => {
        discapacidadPage.verifyAccesoTieneHrefConTexto('Pensiones (PNC)', 'pensiones')
    })

    it('[CA-04][TC-04.2][SCRUM-T123] El acceso del Certificado Único de Discapacidad enlaza al trámite del CUD', () => {
        discapacidadPage.verifyAccesoTieneHrefConTexto('Certificado Único de Discapacidad (CUD)', 'certificado-unico-de-discapacidad')
    })
})
