// Modulo: Catalogo - Alquiler de maquinaria por horas
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-448 (CA-01/CA-02/CA-03, Test Cycle SCRUM-449)
//
// Los 3 equipos figuran sin stock de venta pero son alquilables: la ficha
// reemplaza la cantidad por una duracion de 1 a 10 horas (ngx-slider, se
// opera con el teclado).

import PSTCatalogPage from '../../pages/practicesoftwaretesting/PSTCatalogPage'
import PSTNavigationPage from '../../pages/practicesoftwaretesting/PSTNavigationPage'
import PSTRentalsPage from '../../pages/practicesoftwaretesting/PSTRentalsPage'
import PSTProductDetailPage from '../../pages/practicesoftwaretesting/PSTProductDetailPage'

const catalog = new PSTCatalogPage()
const nav = new PSTNavigationPage()
const rentals = new PSTRentalsPage()
const detail = new PSTProductDetailPage()

const openExcavator = () => {
    nav.openMenuItem('Rentals')
    rentals.verifyTitle()
    rentals.openRental('Excavator')
    detail.verifyProductName('Excavator')
    detail.verifyDuration(1)
}

describe('Catalogo: alquiler de maquinaria por horas [SCRUM-448]', () => {

    beforeEach(() => {
        catalog.visit()
        catalog.verifyInitialCatalog()
    })

    it('[CA-01][TC-01.1][SCRUM-450] La seccion Rentals debe listar los equipos en alquiler', () => {
        nav.openMenuItem('Rentals')

        rentals.verifyTitle()
        rentals.verifyExactRentals()
    })

    it('[CA-01][TC-01.2][SCRUM-451] Debe abrir la ficha de un equipo desde Rentals', () => {
        nav.openMenuItem('Rentals')
        rentals.verifyTitle()

        rentals.openRental('Excavator')

        detail.verifyProductName('Excavator')
    })

    it('[CA-02][TC-02.1][SCRUM-452] La ficha de alquiler debe cotizarse por hora con duracion inicial de 1 hora', () => {
        nav.openMenuItem('Rentals')
        rentals.openRental('Excavator')

        detail.verifyProductName('Excavator')
        detail.verifyPerHourPrice()
        detail.verifyDuration(1)
        detail.verifyNoQuantityField()
    })

    it('[CA-02][TC-02.2][SCRUM-453] Debe permitir elegir una duracion de alquiler', () => {
        openExcavator()

        detail.pressDurationKey('rightarrow', 2)

        detail.verifyDuration(3)
    })

    it('[CA-02][TC-02.3][SCRUM-454] La duracion no debe superar las 10 horas', () => {
        openExcavator()

        detail.pressDurationKey('end')
        detail.verifyDuration(10)

        detail.pressDurationKey('rightarrow')
        detail.verifyDuration(10)
    })

    it('[CA-02][TC-02.4][SCRUM-455] La duracion no debe bajar de 1 hora', () => {
        openExcavator()

        detail.pressDurationKey('leftarrow')

        detail.verifyDuration(1)
    })

    it('[CA-03][TC-03.1][SCRUM-456] Debe agregar un alquiler al carrito por la duracion elegida', () => {
        openExcavator()
        detail.pressDurationKey('rightarrow')
        detail.verifyDuration(2)

        detail.addToCart()

        detail.verifyToast('addedToCart')
        detail.verifyCartQuantity(2)
    })

    it('[CA-03][TC-03.2][SCRUM-457] Un equipo de alquiler debe poder agregarse aunque no haya stock de venta', () => {
        nav.openMenuItem('Rentals')
        rentals.openRental('Excavator')

        detail.verifyProductName('Excavator')
        detail.verifyNoOutOfStock()
        detail.verifyAddToCartEnabled()
    })
})
