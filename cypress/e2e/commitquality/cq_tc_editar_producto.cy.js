// Modulo: Gestion de productos - Editar producto
// Sitio bajo prueba: https://commitquality.com
// Ticket Jira: SCRUM-317 (CA-01/CA-02/CA-03/CA-04, Test Cycle SCRUM-318)
//
// Editar SI requiere sesion iniciada (columna "Actions" solo se renderiza
// con isLoggedIn=true - ver docs/discovery/commitquality.md). Se edita
// sobre productos seed fijos (id=2 "Product 2"/15/2021-02-01, id=3
// "Product 1"/10/2021-01-01). Hallazgo real: el precio seed es un NUMBER
// en el estado inicial (15.0/10.0), por eso el formulario lo precarga
// como "15"/"10" (sin ceros decimales), a diferencia de un producto
// creado via el formulario de Agregar (que siempre guarda el precio como
// el string tal cual se tipeo).

import CommitQualityLoginPage from '../../pages/commitquality/CommitQualityLoginPage'
import CommitQualityProductListPage from '../../pages/commitquality/CommitQualityProductListPage'
import CommitQualityProductFormPage from '../../pages/commitquality/CommitQualityProductFormPage'

const loginPage = new CommitQualityLoginPage()
const listPage = new CommitQualityProductListPage()
const formPage = new CommitQualityProductFormPage()

const toISODate = (d) => d.toISOString().slice(0, 10)
const today = new Date()
const TOMORROW = toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))

describe('Editar producto [SCRUM-317]', () => {

    beforeEach(() => {
        loginPage.visit()
        loginPage.login('test', 'test')
        loginPage.verifyLoggedIn()
    })

    it('[CA-01][TC-01.1][SCRUM-319] Debe actualizar nombre y precio conservando el mismo ID', () => {
        listPage.clickEditForProduct(2)
        formPage.verifyFormVisible()

        formPage.fillFields({ name: 'Producto Editado', price: '50.00' })
        formPage.clickSubmit()

        formPage.verifyRedirectedToHome()
        listPage.verifyProductRow(2, { name: 'Producto Editado', price: '50.00' })
    })

    it('[CA-01][TC-01.2][SCRUM-320] Debe actualizar unicamente la fecha, dejando el resto intacto', () => {
        listPage.clickEditForProduct(2)
        formPage.verifyFormVisible()

        formPage.fillFields({ date: '2022-05-10' })
        formPage.clickSubmit()

        formPage.verifyRedirectedToHome()
        listPage.verifyProductRow(2, { name: 'Product 2', price: '15', date: '2022-05-10' })
    })

    it('[CA-02][TC-02.1][SCRUM-321] El formulario debe precargar los datos actuales del producto', () => {
        listPage.clickEditForProduct(2)

        formPage.verifyFieldValues({ name: 'Product 2', price: '15', date: '2021-02-01' })
    })

    it('[CA-02][TC-02.2][SCRUM-322] La precarga de un producto no debe arrastrar datos de otro', () => {
        listPage.clickEditForProduct(2)
        formPage.verifyFieldValues({ name: 'Product 2', price: '15', date: '2021-02-01' })
        formPage.clickCancel()

        listPage.clickEditForProduct(3)
        formPage.verifyFieldValues({ name: 'Product 1', price: '10', date: '2021-01-01' })
    })

    it('[CA-03][TC-03.1][SCRUM-323] Debe validar el nombre vacio al editar', () => {
        listPage.clickEditForProduct(2)

        formPage.fillFields({ name: '' })
        formPage.blurName()

        formPage.verifyFieldError('Name must be at least 2 characters.')
    })

    it('[CA-03][TC-03.2][SCRUM-324] Debe validar un precio con formato invalido al editar', () => {
        listPage.clickEditForProduct(2)

        formPage.fillFields({ price: '15.5.5' })
        formPage.blurPrice()

        formPage.verifyFieldError('Price must not be empty and within 10 digits')
    })

    it('[CA-03][TC-03.3][SCRUM-325] Debe validar una fecha futura al editar', () => {
        listPage.clickEditForProduct(2)

        formPage.fillFields({ date: TOMORROW })
        formPage.blurDate()

        formPage.verifyFieldError('Date must not be in the future.')
    })

    it('[CA-04][TC-04.1][SCRUM-326] Cancelar tras modificar campos debe conservar los valores originales', () => {
        listPage.clickEditForProduct(2)

        formPage.fillFields({ name: 'Cambio Descartado', price: '999.99' })
        formPage.clickCancel()

        formPage.verifyRedirectedToHome()
        listPage.verifyProductRow(2, { name: 'Product 2', price: '15', date: '2021-02-01' })
    })

    it('[CA-04][TC-04.2][SCRUM-327] Cancelar sin modificar nada debe dejar el producto sin cambios', () => {
        listPage.clickEditForProduct(2)

        formPage.clickCancel()

        formPage.verifyRedirectedToHome()
        listPage.verifyProductRow(2, { name: 'Product 2', price: '15', date: '2021-02-01' })
    })
})
