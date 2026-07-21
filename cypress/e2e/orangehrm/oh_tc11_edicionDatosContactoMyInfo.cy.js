// Test Case OH-TC11 - Edicion de Datos de Contacto en My Info
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-53
//
// Cubre los 10 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T10 a SCRUM-T19, Test Cycle SCRUM-R2): 5 de persistencia de datos
// validos (Mobile, Home Telephone, Street 1, combinado, y tras navegacion) y
// 5 de validacion de formato de email invalido.
//
// A diferencia de PIM (SCRUM-49), "My Info" edita la cuenta Admin compartida
// del entorno demo publico, no un empleado propio y aislado. Por eso cada
// test que persiste un cambio real restaura el valor original en el
// afterEach, para no dejar residuos que afecten a otros usuarios de la demo.

import OrangeHRMDashboardPage from '../../pages/orangehrm/OrangeHRMDashboardPage'
import OrangeHRMMyInfoContactDetailsPage from '../../pages/orangehrm/OrangeHRMMyInfoContactDetailsPage'

const dashboardPage = new OrangeHRMDashboardPage()
const myInfoContactDetailsPage = new OrangeHRMMyInfoContactDetailsPage()

describe('OH-TC11 - Edicion de Datos de Contacto en My Info', () => {

    let originalValues

    beforeEach(() => {
        originalValues = undefined

        // Precondicion: el usuario inicia sesion exitosamente y navega a
        // My Info > Contact Details
        cy.loginAsOHAdmin()

        dashboardPage.navigateToMyInfo()
        myInfoContactDetailsPage.navigateToContactDetailsTab()
        myInfoContactDetailsPage.verifyContactDetailsVisible()

        myInfoContactDetailsPage.captureOriginalContactValues().then((values) => {
            originalValues = values
        })
    })

    afterEach(() => {
        // Restaura los valores originales al finalizar cada test. Es seguro
        // ejecutarlo tambien tras los tests negativos de email invalido (no
        // modificaron el valor real), y es la unica forma de garantizar que
        // la cuenta compartida del entorno demo publico queda intacta.
        if (originalValues) {
            myInfoContactDetailsPage.restoreOriginalContactValues(originalValues)
        }
    })

    it('[SCRUM-T10] Debe modificar el numero de Mobile y mantener el nuevo valor tras recargar la pagina', () => {
        const newMobile = myInfoContactDetailsPage.generateUniqueDigits('555')

        myInfoContactDetailsPage.updateMobile(newMobile)
        myInfoContactDetailsPage.saveContactDetails()
        myInfoContactDetailsPage.verifySaveConfirmationVisible()

        cy.reload()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyMobileValue(newMobile)
    })

    it('[SCRUM-T11] Debe modificar el Home Telephone y mantener el nuevo valor tras recargar la pagina', () => {
        const newHomeTelephone = myInfoContactDetailsPage.generateUniqueDigits('444')

        myInfoContactDetailsPage.updateHomeTelephone(newHomeTelephone)
        myInfoContactDetailsPage.saveContactDetails()
        myInfoContactDetailsPage.verifySaveConfirmationVisible()

        cy.reload()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyHomeTelephoneValue(newHomeTelephone)
    })

    it('[SCRUM-T12] Debe modificar Street 1 y mantener el nuevo valor tras recargar la pagina', () => {
        const newStreet1 = `Calle QA ${Date.now()}`

        myInfoContactDetailsPage.updateStreet1(newStreet1)
        myInfoContactDetailsPage.saveContactDetails()
        myInfoContactDetailsPage.verifySaveConfirmationVisible()

        cy.reload()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyStreet1Value(newStreet1)
    })

    it('[SCRUM-T13] Debe modificar Mobile y Street 1 en un mismo guardado y mantener ambos valores tras recargar la pagina', () => {
        const newMobile = myInfoContactDetailsPage.generateUniqueDigits('555')
        const newStreet1 = `Calle QA ${Date.now()}`

        myInfoContactDetailsPage.updateMobile(newMobile)
        myInfoContactDetailsPage.updateStreet1(newStreet1)
        myInfoContactDetailsPage.saveContactDetails()
        myInfoContactDetailsPage.verifySaveConfirmationVisible()

        cy.reload()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyMobileValue(newMobile)
        myInfoContactDetailsPage.verifyStreet1Value(newStreet1)
    })

    it('[SCRUM-T14] Debe modificar Mobile y mantener el nuevo valor tras navegar a Dashboard y volver a My Info > Contact Details', () => {
        const newMobile = myInfoContactDetailsPage.generateUniqueDigits('555')

        myInfoContactDetailsPage.updateMobile(newMobile)
        myInfoContactDetailsPage.saveContactDetails()
        myInfoContactDetailsPage.verifySaveConfirmationVisible()

        // Sale de My Info hacia Dashboard y vuelve a ingresar a Contact Details
        cy.gotoOHUrl('/web/index.php/dashboard/index')
        dashboardPage.navigateToMyInfo()
        myInfoContactDetailsPage.navigateToContactDetailsTab()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyMobileValue(newMobile)
    })

    it('[SCRUM-T15] Debe aceptar y persistir un email con formato valido', () => {
        const newEmail = `usuario.valido${Date.now()}@dominio.com`

        myInfoContactDetailsPage.updateEmail(newEmail)
        myInfoContactDetailsPage.saveContactDetails()
        myInfoContactDetailsPage.verifySaveConfirmationVisible()

        cy.reload()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyEmailValue(newEmail)
    })

    it('[SCRUM-T16] Debe rechazar un email sin "@" y no persistir el cambio', () => {
        myInfoContactDetailsPage.updateEmail('usuariodominio.com')
        myInfoContactDetailsPage.saveContactDetails({ expectRequest: false })

        myInfoContactDetailsPage.verifyEmailErrorVisible()
        cy.get('.oxd-toast-content--success').should('not.exist')

        cy.reload()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyEmailValue(originalValues.email)
    })

    it('[SCRUM-T17] Debe rechazar un email sin dominio y no persistir el cambio', () => {
        myInfoContactDetailsPage.updateEmail('usuario@')
        myInfoContactDetailsPage.saveContactDetails({ expectRequest: false })

        myInfoContactDetailsPage.verifyEmailErrorVisible()
        cy.get('.oxd-toast-content--success').should('not.exist')

        cy.reload()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyEmailValue(originalValues.email)
    })

    it('[SCRUM-T18] Debe rechazar un email con espacio y no persistir el cambio', () => {
        myInfoContactDetailsPage.updateEmail('usuario invalido@dominio.com')
        myInfoContactDetailsPage.saveContactDetails({ expectRequest: false })

        myInfoContactDetailsPage.verifyEmailErrorVisible()
        cy.get('.oxd-toast-content--success').should('not.exist')

        cy.reload()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyEmailValue(originalValues.email)
    })

    it('[SCRUM-T19] Debe rechazar un email con caracteres invalidos y no persistir el cambio', () => {
        myInfoContactDetailsPage.updateEmail('usuario@@dominio..com')
        myInfoContactDetailsPage.saveContactDetails({ expectRequest: false })

        myInfoContactDetailsPage.verifyEmailErrorVisible()
        cy.get('.oxd-toast-content--success').should('not.exist')

        cy.reload()
        myInfoContactDetailsPage.verifyContactDetailsVisible()
        myInfoContactDetailsPage.verifyEmailValue(originalValues.email)
    })
})
