// Modulo: Facturas - Consultar mis facturas
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-586 (CA-01..CA-04, Test Cycle SCRUM-587)
//
// Cada test registra su propio cliente y sus compras por API (en el orden
// de compra); la sesion se inyecta en la primera carga de pagina. Cada
// test afirma solo lo que promete su Test Case: el contenido completo de
// una fila es regla del CA-01 y el detalle completo, del CA-02.

import PSTInvoicesPage, { CASH, CARD } from '../../pages/practicesoftwaretesting/PSTInvoicesPage'

const invoices = new PSTInvoicesPage()

const TOOLS = { items: [{ name: 'Combination Pliers', quantity: 2 }, { name: 'Wood Saw', quantity: 1 }], payment: CASH }
const SAW = { items: [{ name: 'Wood Saw', quantity: 1 }], payment: CASH }
const PLIERS = { items: [{ name: 'Combination Pliers', quantity: 1 }], payment: CASH }
const SAW_CARD = { items: [{ name: 'Wood Saw', quantity: 1 }], payment: CARD }

describe('Facturas: consultar mis facturas [SCRUM-586]', () => {

    it('[CA-01][TC-01.1][SCRUM-588] Debe listar las compras de la mas reciente a la mas antigua', () => {
        invoices.prepareCustomer([TOOLS, SAW]).then(customer => {
            invoices.visitHome()
            invoices.openFromMenu()
            // Orden de compra: TOOLS y despues SAW; el listado empieza por la ultima.
            invoices.verifyList([customer.invoices[1], customer.invoices[0]])

            invoices.openDetails(customer.invoices[1])
            invoices.verifyInvoiceOpened(customer.invoices[1], '11.57')
        })
    })

    it('[CA-01][TC-01.2][SCRUM-589] Debe mostrar el listado vacio a un cliente sin compras', () => {
        invoices.prepareCustomer()
        invoices.visitHome()

        invoices.openUserMenu()
        invoices.clickMyInvoices()
        invoices.verifyEmptyList()
    })

    it('[CA-02][TC-02.1][SCRUM-590] Debe mostrar todos los datos de una compra en efectivo', () => {
        invoices.prepareCustomer([TOOLS]).then(customer => {
            invoices.visitHome()
            invoices.openFromMenu()
            invoices.verifyListTotals(['$40.48'])

            invoices.openDetails(customer.invoices[0])
            invoices.verifyDetail(customer.invoices[0], {
                total: '40.48', paymentMethod: 'Cash on Delivery',
                lines: [['2', 'Combination Pliers', '$14.15', '$28.30'], ['1', 'Wood Saw', '$12.18', '$12.18']]
            })
        })
    })

    it('[CA-02][TC-02.2][SCRUM-591] Debe mostrar el subtotal y el descuento ecologico de la compra', () => {
        invoices.prepareCustomer([SAW]).then(customer => {
            invoices.visitHome()
            invoices.openFromMenu()
            invoices.verifyListTotals(['$11.57'])

            invoices.openDetails(customer.invoices[0])
            invoices.verifyDetail(customer.invoices[0], {
                total: '11.57', subtotal: '12.18', eco: '0.61', paymentMethod: 'Cash on Delivery',
                lines: [['1', 'Wood Saw', '$12.18', '$12.18']]
            })
        })
    })

    it('[CA-02][TC-02.3][SCRUM-593] Debe avisar que una factura inexistente no existe', () => {
        invoices.prepareCustomer([SAW])
        invoices.visitHome()
        invoices.openFromMenu()
        invoices.verifyListTotals(['$11.57'])

        invoices.visitInvoice('01zzzzzzzzzzzzzzzzzzzzzzzz')
        invoices.verifyNotExist()
    })

    it('[CA-03][TC-03.1][SCRUM-592] Debe impedir ver la factura de otro cliente', () => {
        invoices.createForeignInvoice(SAW).then(foreign => {
            invoices.prepareCustomer()
            invoices.visitHome()
            invoices.openFromMenu()
            invoices.verifyEmptyList()

            invoices.visitInvoice(foreign.id)
            invoices.verifyNotExist()
        })
    })

    it('[CA-03][TC-03.2][SCRUM-597] Debe listar solo las facturas del propio cliente', () => {
        invoices.createForeignInvoice(PLIERS).then(foreign => {
            invoices.prepareCustomer([SAW]).then(customer => {
                invoices.visitHome()
                invoices.openFromMenu()
                invoices.verifyListTotals(['$11.57'])
                invoices.verifyNotListed(foreign)

                invoices.openDetails(customer.invoices[0])
                invoices.verifyInvoiceOpened(customer.invoices[0], '11.57')
                invoices.verifyProducts(['Wood Saw'])
            })
        })
    })

    it.skip('[CA-04][TC-04.1][SCRUM-594] Debe ocultar el numero completo de la tarjeta (bug conocido: SCRUM-596)', () => {
        invoices.prepareCustomer([SAW_CARD]).then(customer => {
            invoices.visitHome()
            invoices.openFromMenu()
            invoices.verifyListTotals(['$11.57'])

            invoices.openDetails(customer.invoices[0])
            invoices.verifyCardNumberHidden()
        })
    })

    it.skip('[CA-04][TC-04.2][SCRUM-595] Debe ocultar el codigo de seguridad de la tarjeta (bug conocido: SCRUM-596)', () => {
        invoices.prepareCustomer([SAW_CARD]).then(customer => {
            invoices.visitHome()
            invoices.openFromMenu()
            invoices.verifyListTotals(['$11.57'])

            invoices.openDetails(customer.invoices[0])
            invoices.verifyCvvHidden()
        })
    })
})
