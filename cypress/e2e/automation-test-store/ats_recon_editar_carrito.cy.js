// PASO 1 (Discovery) del pipeline de CLAUDE.md: releva selectores reales
// del carrito con productos (editar cantidad / quitar) via cy.reconPage y
// los persiste como artefacto permanente en
// cypress/fixtures/selectors/carrito.json. No se adivina ningun selector:
// se agrega un producto real primero para poder reconocer los controles
// que solo existen con el carrito no vacio.

describe('Recon - Carrito con productos (editar/quitar)', () => {
    it('agrega un producto y releva los controles reales del carrito', () => {
        const base = Cypress.env('automationTestStoreUrl')
        const productId = 68

        cy.gotoATSUrl(`/index.php?rt=product/product&product_id=${productId}`)
        cy.get('#product a.cart').click()
        cy.url().should('include', 'checkout/cart')

        cy.reconPage('carrito_con_producto', `${base}/index.php?rt=checkout/cart`).then(result => {
            // Selectores confirmados contra el resultado real de reconPage:
            // form#cart (POST, contiene el input de cantidad) y boton
            // #cart_update aparecen tal cual en result.forms/result.buttons.
            // El link de "Remove" es icon-only (sin texto visible), por eso
            // reconPage no lo lista en result.links -- se confirmo su href
            // real (".../remove={id}") inspeccionando el DOM directamente.
            const cartForm = result.forms.find(f => f.id === 'cart')
            const updateButton = result.buttons.find(b => b.id === 'cart_update')
            const quantityField = cartForm.fields.find(f => f.id === `cart_quantity${productId}`)

            const selectors = {
                cartTable: '.cart-info table',
                cartRow: '.cart-info table tbody tr',
                quantityInput: `#${quantityField.id}`,
                quantityInputPattern: 'input[name^="quantity["]',
                removeLink: `a[href*="remove=${productId}"]`,
                updateButton: `#${updateButton.id}`,
                headerCartCount: '.topcart .label-orange',
                headerCartTotal: '.topcart .cart_total',
                heading: result.heading
            }
            cy.writeFile('cypress/fixtures/selectors/carrito.json', selectors)
        })
    })

    it('PASO 2 - mapea la respuesta real de actualizar la cantidad (reconSubmit)', () => {
        const base = Cypress.env('automationTestStoreUrl')
        const productId = 68

        cy.gotoATSUrl(`/index.php?rt=product/product&product_id=${productId}`)
        cy.get('#product a.cart').click()
        cy.url().should('include', 'checkout/cart')

        cy.fixture('selectors/carrito.json').then(sel => {
            cy.reconSubmit(
                'actualizar_cantidad',
                `${base}/index.php?rt=checkout/cart`,
                { [sel.quantityInput]: '4' },
                sel.updateButton
            ).then(res => {
                cy.get(sel.quantityInput).then($input => {
                    cy.get(sel.cartRow).find('td.align_right').last().then($total => {
                        cy.writeFile('cypress/fixtures/selectors/_recon_update_response.json', {
                            ...res,
                            quantityValueAfterUpdate: $input.val(),
                            rowTotalAfterUpdate: $total.text().trim()
                        })
                    })
                })
            })
        })
    })

    it('PASO 2 - mapea la respuesta real de quitar el producto (link real, no form)', () => {
        const base = Cypress.env('automationTestStoreUrl')
        const productId = 68

        cy.gotoATSUrl(`/index.php?rt=product/product&product_id=${productId}`)
        cy.get('#product a.cart').click()
        cy.url().should('include', 'checkout/cart')

        cy.fixture('selectors/carrito.json').then(sel => {
            cy.get(sel.removeLink).click()
            cy.get('body').then($body => {
                cy.writeFile('cypress/fixtures/selectors/_recon_remove_response.json', {
                    urlAfter: window.location.href,
                    heading: $body.find('h1').first().text().trim(),
                    contentPanelText: $body.find('.contentpanel').first().text().trim().slice(0, 300),
                    headerCartCount: $body.find('.topcart .label-orange').first().text().trim(),
                    headerCartTotal: $body.find('.topcart .cart_total').first().text().trim()
                })
            })
        })
    })
})
