// PASO 1 (Discovery) del pipeline de CLAUDE.md: releva selectores reales
// de "Forgot your login?" (Recuperar login name) via cy.reconPage antes de
// escribir codigo, y los persiste como artefacto permanente en
// cypress/fixtures/selectors/recuperar-login-name.json.

import AutomationTestStoreAccountPage from '../../pages/automation-test-store/AutomationTestStoreAccountPage'

const accountPage = new AutomationTestStoreAccountPage()

describe('Recon - Recuperar login name', () => {
    it('releva el formulario real de Forgot your login?', () => {
        const base = Cypress.env('automationTestStoreUrl')

        cy.reconPage('recuperar_login_name', `${base}/index.php?rt=account/forgotten/loginname`).then(result => {
            cy.writeFile('cypress/fixtures/selectors/_recon_recuperar_login_name.json', result)

            const form = result.forms.find(f => f.id === 'forgottenFrm')
            const submitButton = result.buttons.find(b => b.text === 'Continue')

            const selectors = {
                formId: form.id,
                fields: form.fields,
                submitButton,
                heading: result.heading
            }
            cy.writeFile('cypress/fixtures/selectors/recuperar-login-name.json', selectors)
        })
    })

    const base = Cypress.env('automationTestStoreUrl')
    const url = `${base}/index.php?rt=account/forgotten/loginname`
    let submitSelector

    before(() => {
        cy.fixture('selectors/recuperar-login-name.json').then(sel => {
            submitSelector = `#${sel.formId} button[type="submit"], #${sel.formId} input[type="submit"]`
        })
    })

    it('PASO 2 - mapea la respuesta real de lastname vacio', () => {
        cy.reconSubmit('lastname_vacio', url, {
            '#forgottenFrm_lastname': '',
            '#forgottenFrm_email': 'cualquiera@example.com'
        }, submitSelector).then(res => {
            cy.writeFile('cypress/fixtures/selectors/_recon_lastname_vacio.json', res)
        })
    })

    it('PASO 2 - mapea la respuesta real de email vacio', () => {
        cy.reconSubmit('email_vacio', url, {
            '#forgottenFrm_lastname': 'CualquierApellido',
            '#forgottenFrm_email': ''
        }, submitSelector).then(res => {
            cy.writeFile('cypress/fixtures/selectors/_recon_email_vacio.json', res)
        })
    })

    it('PASO 2 - mapea la respuesta real de datos que no coinciden', () => {
        cy.reconSubmit('no_encontrado', url, {
            '#forgottenFrm_lastname': 'ApellidoInexistente999',
            '#forgottenFrm_email': 'noexiste_999@example.com'
        }, submitSelector).then(res => {
            cy.writeFile('cypress/fixtures/selectors/_recon_no_encontrado.json', res)
        })
    })

    it('PASO 2 - mapea la respuesta real de exito (cuenta registrada real)', () => {
        cy.registerATSTestAccount().then((creds) => {
            accountPage.logout()
            cy.url().should('include', 'rt=account/logout')

            cy.reconSubmit('exito', url, {
                '#forgottenFrm_lastname': creds.lastName,
                '#forgottenFrm_email': creds.email
            }, submitSelector).then(res => {
                cy.writeFile('cypress/fixtures/selectors/_recon_exito.json', res)
            })
        })
    })

    it('PASO 2 - confirma si el lastname es case-insensitive', () => {
        cy.registerATSTestAccount().then((creds) => {
            accountPage.logout()
            cy.url().should('include', 'rt=account/logout')

            cy.reconSubmit('mayusculas', url, {
                '#forgottenFrm_lastname': creds.lastName.toUpperCase(),
                '#forgottenFrm_email': creds.email
            }, submitSelector).then(res => {
                cy.writeFile('cypress/fixtures/selectors/_recon_mayusculas.json', res)
            })
        })
    })

    it('PASO 2 - confirma si el lastname es sensible a espacios', () => {
        cy.registerATSTestAccount().then((creds) => {
            accountPage.logout()
            cy.url().should('include', 'rt=account/logout')

            cy.reconSubmit('espacios', url, {
                '#forgottenFrm_lastname': `  ${creds.lastName}  `,
                '#forgottenFrm_email': creds.email
            }, submitSelector).then(res => {
                cy.writeFile('cypress/fixtures/selectors/_recon_espacios.json', res)
            })
        })
    })
})
