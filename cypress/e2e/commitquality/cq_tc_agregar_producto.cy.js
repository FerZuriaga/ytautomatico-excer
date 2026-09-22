// Modulo: Gestion de productos - Agregar producto
// Sitio bajo prueba: https://commitquality.com
// Ticket Jira: SCRUM-305 (CA-01/CA-02/CA-03/CA-04, Test Cycle SCRUM-306)
//
// Agregar producto NO requiere sesion iniciada (ver docs/discovery/
// commitquality.md). Cada test arranca con un cy.visit() nuevo a
// /add-product, lo que remonta la SPA entera y resetea el estado en
// memoria a los 11 productos seed - el proximo producto creado siempre
// obtiene id=12, de forma deterministica.

import CommitQualityProductFormPage from '../../pages/commitquality/CommitQualityProductFormPage'
import CommitQualityProductListPage from '../../pages/commitquality/CommitQualityProductListPage'

const formPage = new CommitQualityProductFormPage()
const listPage = new CommitQualityProductListPage()

const toISODate = (d) => d.toISOString().slice(0, 10)
const today = new Date()
const TODAY = toISODate(today)
const TOMORROW = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))
const TOO_OLD = toISODate(new Date(today.getFullYear() - 101, today.getMonth(), today.getDate()))

describe('Agregar producto [SCRUM-305]', () => {

    beforeEach(() => {
        formPage.visitAdd()
        formPage.verifyFormVisible()
    })

    it('[CA-01][TC-01.1][SCRUM-307] Debe crear el producto con datos validos y mostrarlo en el listado', () => {
        formPage.fillFields({ name: 'Producto QA 1', price: '25.50', date: TODAY })
        formPage.clickSubmit()

        formPage.verifyRedirectedToHome()
        listPage.verifyProductRow(12, { name: 'Producto QA 1', price: '25.50', date: TODAY })
    })

    it('[CA-01][TC-01.2][SCRUM-308] Debe guardar el precio con 2 decimales exactos, sin redondear', () => {
        formPage.fillFields({ name: 'Producto QA 2', price: '9.99', date: TODAY })
        formPage.clickSubmit()

        formPage.verifyRedirectedToHome()
        listPage.verifyProductRow(12, { name: 'Producto QA 2', price: '9.99', date: TODAY })
    })

    it('[CA-02][TC-02.1][SCRUM-309] Debe rechazar el envio con todos los campos vacios', () => {
        formPage.clickSubmit()

        formPage.verifyMissingFieldsError()
        formPage.verifyStillOnForm('/add-product')
    })

    it('[CA-02][TC-02.2][SCRUM-310] Debe rechazar el envio si falta unicamente la fecha', () => {
        formPage.fillFields({ name: 'Producto QA 3', price: '10.00' })
        formPage.clickSubmit()

        formPage.verifyMissingFieldsError()
        formPage.verifyStillOnForm('/add-product')
    })

    it('[CA-03][TC-03.1][SCRUM-311] Debe validar el nombre con menos de 2 caracteres', () => {
        formPage.fillFields({ name: 'A' })
        formPage.blurName()

        formPage.verifyFieldError('Name must be at least 2 characters.')
    })

    it('[CA-03][TC-03.2][SCRUM-312] Debe validar un precio con formato invalido', () => {
        formPage.fillFields({ price: '1.2.3' })
        formPage.blurPrice()

        formPage.verifyFieldError('Price must not be empty and within 10 digits')
    })

    it('[CA-03][TC-03.3][SCRUM-313] Debe validar una fecha futura', () => {
        formPage.fillFields({ date: TOMORROW })
        formPage.blurDate()

        formPage.verifyFieldError('Date must not be in the future.')
    })

    it('[CA-03][TC-03.4][SCRUM-314] Debe validar una fecha de mas de 100 anios atras', () => {
        formPage.fillFields({ date: TOO_OLD })
        formPage.blurDate()

        formPage.verifyFieldError('Date must not be older than 100 years.')
    })

    it('[CA-04][TC-04.1][SCRUM-315] Cancelar sin completar datos no debe crear ningun producto', () => {
        formPage.clickCancel()

        formPage.verifyRedirectedToHome()
        listPage.verifyRowCount(10)
    })

    it('[CA-04][TC-04.2][SCRUM-316] Cancelar con datos parcialmente completados no debe crear el producto', () => {
        formPage.fillFields({ name: 'Producto Descartado' })
        formPage.clickCancel()

        formPage.verifyRedirectedToHome()
        listPage.verifyProductNotPresent('Producto Descartado')
    })
})
