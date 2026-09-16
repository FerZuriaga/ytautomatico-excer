// Modulo: Autenticacion y cuenta - Registro
// Sitio bajo prueba: https://automationteststore.com
// Ticket Jira: SCRUM-135 (CA-01 a CA-06, Test Cycle SCRUM-136)

import AutomationTestStoreRegisterPage from '../../pages/automation-test-store/AutomationTestStoreRegisterPage'

const registerPage = new AutomationTestStoreRegisterPage()

function uniqueSuffix() {
    return `${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

function buildValidData(suffix) {
    return {
        firstName: 'QA',
        lastName: 'Tester',
        email: `qatester_reg_${suffix}@example.com`,
        address1: 'Test Street 123',
        city: 'Buenos Aires',
        country: 'Argentina',
        zone: 'Buenos Aires',
        postcode: '1000',
        loginName: `qatester_reg_${suffix}`,
        password: 'Qatest123!'
    }
}

describe('Registro de cuenta [SCRUM-135]', () => {

    let existingAccount

    before(() => {
        cy.registerATSTestAccount().then((creds) => {
            existingAccount = creds
        })
    })

    beforeEach(() => {
        registerPage.visit()
    })

    it('[CA-01][TC-01.1][SCRUM-137] Debe crear la cuenta completando solo los campos obligatorios', () => {
        const data = buildValidData(uniqueSuffix())

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: data.loginName,
            password: data.password,
            confirmPassword: data.password,
            agreePrivacy: true
        })
        registerPage.submit()
        registerPage.verifyAccountCreated()
    })

    it('[CA-01][TC-01.2][SCRUM-138] Debe crear la cuenta completando tambien los campos opcionales', () => {
        const data = buildValidData(uniqueSuffix())

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            telephone: '1234567890',
            fax: '1234567891',
            company: 'Test Co',
            address1: data.address1,
            address2: 'Piso 2',
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: data.loginName,
            password: data.password,
            confirmPassword: data.password,
            agreePrivacy: true
        })
        registerPage.submit()
        registerPage.verifyAccountCreated()
    })

    it('[CA-02][TC-02.1][SCRUM-139] Debe rechazar el registro cuando falta completar un campo obligatorio', () => {
        const data = buildValidData(uniqueSuffix())

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            // email queda sin completar a proposito
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: data.loginName,
            password: data.password,
            confirmPassword: data.password,
            agreePrivacy: true
        })
        registerPage.submit()
        registerPage.verifyRegistrationRejected()
    })

    it('[CA-02][TC-02.2][SCRUM-140] Debe rechazar el registro cuando Password y Confirmar Password no coinciden', () => {
        const data = buildValidData(uniqueSuffix())

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: data.loginName,
            password: data.password,
            confirmPassword: 'OtraClave456!',
            agreePrivacy: true
        })
        registerPage.submit()
        registerPage.verifyRegistrationRejected()
    })

    it('[CA-02][TC-02.3][SCRUM-141] Debe rechazar el registro cuando no se acepta la Politica de Privacidad', () => {
        const data = buildValidData(uniqueSuffix())

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: data.loginName,
            password: data.password,
            confirmPassword: data.password
            // agreePrivacy queda sin marcar a proposito
        })
        registerPage.submit()
        registerPage.verifyRegistrationRejected()
    })

    it('[CA-03][TC-03.1][SCRUM-142] Debe rechazar el registro con un Email ya registrado', () => {
        const data = buildValidData(uniqueSuffix())

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: existingAccount.email,
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: data.loginName,
            password: data.password,
            confirmPassword: data.password,
            agreePrivacy: true
        })
        registerPage.submit()
        registerPage.verifyRegistrationRejected()
    })

    it('[CA-03][TC-03.2][SCRUM-143] Debe comportarse de forma consistente con un Email ya registrado en distinta capitalizacion', () => {
        const data = buildValidData(uniqueSuffix())

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: existingAccount.email.toUpperCase(),
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: data.loginName,
            password: data.password,
            confirmPassword: data.password,
            agreePrivacy: true
        })
        registerPage.submit()

        // Verificacion exploratoria (ver RIESGOS del escenario funcional):
        // se documenta el comportamiento real, sea cual sea, en vez de asumirlo.
        cy.url().then((url) => {
            if (url.includes('rt=account/success')) {
                registerPage.verifyAccountCreated()
            } else {
                registerPage.verifyRegistrationRejected()
            }
        })
    })

    it('[CA-04][TC-04.1][SCRUM-144] Debe rechazar el registro con un Login name ya utilizado', () => {
        const data = buildValidData(uniqueSuffix())

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: existingAccount.loginName,
            password: data.password,
            confirmPassword: data.password,
            agreePrivacy: true
        })
        registerPage.submit()
        registerPage.verifyRegistrationRejected()
    })

    it('[CA-04][TC-04.2][SCRUM-145] Debe comportarse de forma consistente con un Login name ya utilizado en distinta capitalizacion', () => {
        const data = buildValidData(uniqueSuffix())

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: existingAccount.loginName.toUpperCase(),
            password: data.password,
            confirmPassword: data.password,
            agreePrivacy: true
        })
        registerPage.submit()

        cy.url().then((url) => {
            if (url.includes('rt=account/success')) {
                registerPage.verifyAccountCreated()
            } else {
                registerPage.verifyRegistrationRejected()
            }
        })
    })

    it('[CA-05][TC-05.1][SCRUM-146] Debe cargar las regiones correspondientes al pais seleccionado', () => {
        registerPage.selectCountry('Argentina')
        registerPage.getZoneOptionsText().then((options) => {
            expect(options.length).to.be.greaterThan(1)
            expect(options).to.include('Buenos Aires')
        })
    })

    it('[CA-05][TC-05.2][SCRUM-147] Debe reemplazar la lista de regiones al cambiar de pais', () => {
        registerPage.selectCountry('Argentina')
        registerPage.getZoneOptionsText().then((argentinaZones) => {
            registerPage.selectCountry('United States')
            registerPage.getZoneOptionsText().then((usZones) => {
                expect(usZones).to.not.deep.equal(argentinaZones)
            })
        })
    })

    it('[CA-06][TC-06.1][SCRUM-148] Debe rechazar el registro cuando el Login name tiene espacios al inicio o al fin', () => {
        const data = buildValidData(uniqueSuffix())
        const loginNameWithSpaces = ` ${data.loginName} `

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: loginNameWithSpaces,
            password: data.password,
            confirmPassword: data.password,
            agreePrivacy: true
        })
        registerPage.loginNameInput.should('have.value', loginNameWithSpaces)
        registerPage.submit()
        registerPage.verifyErrorMessage('Login name must be alphanumeric only')
    })

    it('[CA-06][TC-06.2][SCRUM-149] Debe rechazar el registro cuando el Email tiene espacios al inicio o al fin', () => {
        const data = buildValidData(uniqueSuffix())
        const emailWithSpaces = ` ${data.email} `

        registerPage.fillFields({
            firstName: data.firstName,
            lastName: data.lastName,
            email: emailWithSpaces,
            address1: data.address1,
            city: data.city,
            country: data.country,
            zone: data.zone,
            postcode: data.postcode,
            loginName: data.loginName,
            password: data.password,
            confirmPassword: data.password,
            agreePrivacy: true
        })
        registerPage.emailInput.should('have.value', emailWithSpaces)
        registerPage.submit()
        registerPage.verifyErrorMessage('Email Address does not appear to be valid')
    })
})
