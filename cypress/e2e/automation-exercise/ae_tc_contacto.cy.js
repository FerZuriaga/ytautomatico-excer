// Modulo: Contacto (Contact Us) - AutomationExercise
// Sitio bajo prueba: https://automationexercise.com
// Agrupa: TC6 - Contact Us Form

import ContactPage from '../../pages/automation-exercise/ContactPage'

const contactPage = new ContactPage()

describe('Contact Us Form - Page Object Model', () => {

    // Datos de prueba fijos
    const NAME = 'Test User'
    const EMAIL = 'test@test.com'
    const SUBJECT = 'Test Subject'
    const MESSAGE = 'Test message for automation'

    beforeEach(() => {
        // Navegar a la home antes de cada test usando el comando custom del proyecto
        cy.gotoAEUrl('/')
    })

    it('Debe enviar el formulario Contact Us y verificar el mensaje de éxito', () => {

        // Paso 1: Verificar que la home page cargó
        cy.get('#slider').should('be.visible')

        // Paso 2: Click en "Contact us" en la navegación
        contactPage.clickContactUs()

        // Paso 3: Verificar que "GET IN TOUCH" es visible
        contactPage.verifyGetInTouch()

        // Paso 4: Llenar el formulario con datos de prueba
        contactPage.fillForm(NAME, EMAIL, SUBJECT, MESSAGE)

        // Paso 5 y 6: Registrar el handler del confirm antes de hacer Submit y hacer click
        contactPage.submitForm()

        // Paso 7: Verificar mensaje de éxito
        contactPage.verifySuccessMessage()

        // Paso 8: Click en el botón Home
        contactPage.clickHomeButton()

        // Paso 9: Verificar que la URL contiene '/' y el slider/hero de la home es visible
        cy.validateAEUrl('/')
        cy.get('#slider').should('be.visible')
    })
})
