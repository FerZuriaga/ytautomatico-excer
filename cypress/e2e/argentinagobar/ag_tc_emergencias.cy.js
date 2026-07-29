// Test Case AG-TC-EMERGENCIAS - Directorio de números de emergencia en
// Argentina.gob.ar
// Sitio bajo prueba: https://www.argentina.gob.ar/tema/emergencias
// Ticket Jira: SCRUM-66
//
// Flujo público, de solo lectura y sin autenticación sobre el sitio de
// produccion real del Estado argentino. Cubre los 8 Test Cases del Modelo
// Canonico publicados en Zephyr (SCRUM-T98 a SCRUM-T105, Test Cycle
// SCRUM-R15), en 4 criterios de aceptacion atomicos:
// - CA-01 (Listado completo colapsado por defecto): TC-01.1, TC-01.2
// - CA-02 (Expansion muestra boton de llamada): TC-02.1, TC-02.2
// - CA-03 (Coherencia tel: vs numero anunciado, sin duplicados): TC-03.1, TC-03.2
// - CA-04 (Organismos relacionados): TC-04.1, TC-04.2

import ArgentinaEmergenciasPage from '../../pages/argentinagobar/ArgentinaEmergenciasPage'

const emergenciasPage = new ArgentinaEmergenciasPage()

describe('AG-TC-EMERGENCIAS - Directorio de números de emergencia [SCRUM-66]', () => {

    beforeEach(() => {
        cy.gotoArgentinaEmergencias()
    })

    it('[CA-01][TC-01.1][SCRUM-T98] Se muestra el título y breadcrumb de la página', () => {
        emergenciasPage.verifyTituloYBreadcrumb()
    })

    it('[CA-01][TC-01.2][SCRUM-T102] Se listan los 9 números de emergencia, todos colapsados por defecto', () => {
        emergenciasPage.verifyCantidadDeItems(9)
        emergenciasPage.verifyTodosColapsados()
    })

    it('[CA-02][TC-02.1][SCRUM-T100] Expandir el número 911 muestra su botón de llamada', () => {
        emergenciasPage.expandirItem('911 Central de Emergencias Nacional')
        emergenciasPage.verifyItemExpandidoConTel('911 Central de Emergencias Nacional', '911')
    })

    it('[CA-02][TC-02.2][SCRUM-T103] Expandir el número 144 muestra su botón de llamada', () => {
        emergenciasPage.expandirItem('144 Atención a víctimas de violencia de género')
        emergenciasPage.verifyItemExpandidoConTel('144 Atención a víctimas de violencia de género', '144')
    })

    it('[CA-03][TC-03.1][SCRUM-T101] El enlace de llamada de cada uno de los 9 números coincide con el número anunciado', () => {
        emergenciasPage.verifyTelCoincideConNumeroEnTodos()
    })

    it('[CA-03][TC-03.2][SCRUM-T105] No existen números de emergencia duplicados en el listado', () => {
        emergenciasPage.verifyNumerosSinDuplicados()
    })

    it('[CA-04][TC-04.1][SCRUM-T104] La sección Organismos relacionados muestra al menos un enlace externo', () => {
        emergenciasPage.verifyOrganismosRelacionadosTieneEnlaces()
    })

    it('[CA-04][TC-04.2][SCRUM-T99] Todos los enlaces de Organismos relacionados tienen un destino válido', () => {
        emergenciasPage.verifyOrganismosRelacionadosEnlacesValidos()
    })
})
