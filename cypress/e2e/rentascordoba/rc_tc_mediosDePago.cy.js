// Test Case RC-TC-MEDIOSPAGO - Medios de pago en Rentas Córdoba
// Sitio bajo prueba: https://www.rentascordoba.gob.ar/cms/formas-de-pago/
// Ticket Jira: SCRUM-63
//
// Flujo público, de solo lectura y sin autenticación sobre el sitio de
// produccion real de Rentas Cordoba. Cubre los 6 Test Cases del Modelo
// Canonico publicados en Zephyr (SCRUM-T75 a SCRUM-T80, Test Cycle
// SCRUM-R12), en 2 criterios de aceptacion atomicos:
// - CA-01 (Visualizacion de la pestana activa por defecto): TC-01.1, TC-01.2
// - CA-02 (Cambio de contenido al seleccionar una pestana): TC-02.1, TC-02.2, TC-02.3, TC-02.4

import MediosDePagoPage from '../../pages/rentascordoba/MediosDePagoPage'

const mediosDePagoPage = new MediosDePagoPage()

describe('RC-TC-MEDIOSPAGO - Medios de pago en Rentas Córdoba [SCRUM-63]', () => {

    beforeEach(() => {
        cy.gotoRentasCordobaMediosDePago()
    })

    it('[CA-01][TC-01.1][SCRUM-T79] Debe mostrar activa la pestaña Tarjetas de crédito por defecto', () => {
        mediosDePagoPage.verifyPestanaActivaEs('Tarjetas de crédito')
        mediosDePagoPage.verifyContenidoActivoContiene('MASTERCARD')
    })

    it('[CA-01][TC-01.2][SCRUM-T76] Las demás pestañas no deben mostrar contenido por defecto', () => {
        mediosDePagoPage.verifyUnicoPanelVisible()
        mediosDePagoPage.verifyContenidoActivoContiene('MASTERCARD')
    })

    it('[CA-02][TC-02.1][SCRUM-T75] Seleccionar Tarjetas de débito debe mostrar su contenido', () => {
        mediosDePagoPage.seleccionarPestana('Tarjetas de débito')

        mediosDePagoPage.verifyPestanaActivaEs('Tarjetas de débito')
        mediosDePagoPage.verifyContenidoActivoContiene('Débito Automático')
    })

    it('[CA-02][TC-02.2][SCRUM-T77] Seleccionar Plataformas de pago debe mostrar su contenido', () => {
        mediosDePagoPage.seleccionarPestana('Plataformas de pago')

        mediosDePagoPage.verifyPestanaActivaEs('Plataformas de pago')
        mediosDePagoPage.verifyContenidoActivoContiene('CIDI')
    })

    it('[CA-02][TC-02.3][SCRUM-T80] Cambiar entre varias pestañas consecutivas debe actualizar el contenido en cada cambio', () => {
        mediosDePagoPage.seleccionarPestana('Tarjetas de débito')
        mediosDePagoPage.verifyContenidoActivoContiene('Débito Automático')

        mediosDePagoPage.seleccionarPestana('Plan de Pagos')
        mediosDePagoPage.verifyContenidoActivoContiene('BANELCO')

        mediosDePagoPage.seleccionarPestana('Cajero Automático')
        mediosDePagoPage.verifyContenidoActivoContiene('cajero más cercano')
    })

    it('[CA-02][TC-02.4][SCRUM-T78] El contenido de otras pestañas no debe quedar visible al seleccionar una', () => {
        mediosDePagoPage.seleccionarPestana('Efectivo')

        mediosDePagoPage.verifyUnicoPanelVisible()
        mediosDePagoPage.verifyContenidoActivoContiene('Pago Fácil')
    })
})
