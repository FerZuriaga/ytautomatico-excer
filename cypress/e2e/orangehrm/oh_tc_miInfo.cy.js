// Modulo: Mi Info (My Info) - OrangeHRM
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Agrupa: OH-TC11 [SCRUM-53]
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
import OrangeHRMMyInfoPersonalDetailsPage from '../../pages/orangehrm/OrangeHRMMyInfoPersonalDetailsPage'

const dashboardPage = new OrangeHRMDashboardPage()
const myInfoContactDetailsPage = new OrangeHRMMyInfoContactDetailsPage()
const myInfoPersonalDetailsPage = new OrangeHRMMyInfoPersonalDetailsPage()

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

describe('[SCRUM-70] Edicion de Personal Details en My Info', () => {

    let originalValues

    beforeEach(() => {
        originalValues = undefined

        // Precondicion: el usuario inicia sesion exitosamente y My Info abre
        // por defecto en la pestana Personal Details (no requiere navegacion
        // a un tab adicional, a diferencia de Contact Details)
        cy.loginAsOHAdmin()

        dashboardPage.navigateToMyInfo()
        myInfoPersonalDetailsPage.verifyPersonalDetailsVisible()

        myInfoPersonalDetailsPage.captureOriginalPersonalValues().then((values) => {
            originalValues = values
        })
    })

    afterEach(() => {
        // Restaura los valores originales al finalizar cada test, mismo
        // criterio que Contact Details: la cuenta Admin es compartida por el
        // entorno demo publico y no debe quedar con residuos.
        if (originalValues) {
            myInfoPersonalDetailsPage.restoreOriginalPersonalValues(originalValues)
        }
    })

    it('[CA-01][TC-01.1][SCRUM-84] Debe modificar la Nacionalidad y mantener el nuevo valor tras recargar la pagina', () => {
        const newNationality = originalValues.nationality.includes('Afghan') ? 'American' : 'Afghan'

        myInfoPersonalDetailsPage.selectNationality(newNationality)
        myInfoPersonalDetailsPage.savePersonalDetails()
        myInfoPersonalDetailsPage.verifySaveConfirmationVisible()

        cy.reload()
        myInfoPersonalDetailsPage.verifyPersonalDetailsVisible()
        myInfoPersonalDetailsPage.verifyNationalityValue(newNationality)
    })

    it('[CA-01][TC-01.2][SCRUM-79] Debe modificar Nacionalidad y Estado Civil en un mismo guardado y mantener ambos valores tras recargar la pagina', () => {
        const newNationality = originalValues.nationality.includes('Afghan') ? 'American' : 'Afghan'
        const newMaritalStatus = originalValues.maritalStatus.includes('Single') ? 'Married' : 'Single'

        myInfoPersonalDetailsPage.selectNationality(newNationality)
        myInfoPersonalDetailsPage.selectMaritalStatus(newMaritalStatus)
        myInfoPersonalDetailsPage.savePersonalDetails()
        myInfoPersonalDetailsPage.verifySaveConfirmationVisible()

        cy.reload()
        myInfoPersonalDetailsPage.verifyPersonalDetailsVisible()
        myInfoPersonalDetailsPage.verifyNationalityValue(newNationality)
        myInfoPersonalDetailsPage.verifyMaritalStatusValue(newMaritalStatus)
    })

    it('[CA-02][TC-02.1][SCRUM-83] Debe rechazar una Fecha de Nacimiento futura y no persistir el cambio', () => {
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1)
        const futureDateText = `${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}-${futureDate.getFullYear()}`

        myInfoPersonalDetailsPage.updateDateOfBirth(futureDateText)
        myInfoPersonalDetailsPage.savePersonalDetails({ expectRequest: false })

        myInfoPersonalDetailsPage.verifyDateOfBirthErrorVisible()
        cy.get('.oxd-toast-content--success').should('not.exist')

        cy.reload()
        myInfoPersonalDetailsPage.verifyPersonalDetailsVisible()
        myInfoPersonalDetailsPage.verifyDateOfBirthValue(originalValues.dateOfBirth)
    })

    it('[CA-02][TC-02.2][SCRUM-80] Debe rechazar un formato de Fecha de Nacimiento invalido y no persistir el cambio', () => {
        myInfoPersonalDetailsPage.updateDateOfBirth('99-99-9999')
        myInfoPersonalDetailsPage.savePersonalDetails({ expectRequest: false })

        myInfoPersonalDetailsPage.verifyDateOfBirthErrorVisible()
        cy.get('.oxd-toast-content--success').should('not.exist')

        cy.reload()
        myInfoPersonalDetailsPage.verifyPersonalDetailsVisible()
        myInfoPersonalDetailsPage.verifyDateOfBirthValue(originalValues.dateOfBirth)
    })

    it('[CA-03][TC-03.1][SCRUM-81] Debe mantener la Nacionalidad original al salir sin guardar y volver a ingresar a My Info', () => {
        const unsavedNationality = originalValues.nationality.includes('Afghan') ? 'American' : 'Afghan'

        myInfoPersonalDetailsPage.selectNationality(unsavedNationality)

        // Sale de My Info hacia Dashboard sin guardar y vuelve a ingresar
        cy.gotoOHUrl('/web/index.php/dashboard/index')
        dashboardPage.navigateToMyInfo()
        myInfoPersonalDetailsPage.verifyPersonalDetailsVisible()
        myInfoPersonalDetailsPage.verifyNationalityValue(originalValues.nationality)
    })

    it('[CA-03][TC-03.2][SCRUM-82] Debe mantener el Estado Civil original al recargar la pagina sin guardar', () => {
        const unsavedMaritalStatus = originalValues.maritalStatus.includes('Single') ? 'Married' : 'Single'

        myInfoPersonalDetailsPage.selectMaritalStatus(unsavedMaritalStatus)

        cy.reload()
        myInfoPersonalDetailsPage.verifyPersonalDetailsVisible()
        myInfoPersonalDetailsPage.verifyMaritalStatusValue(originalValues.maritalStatus)
    })
})
