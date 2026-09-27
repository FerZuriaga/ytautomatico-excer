// Modulo: Registro - Alta de clientes
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-545 (CA-01..CA-04, Test Cycle SCRUM-546)
//
// Cada test registra un email unico. El texto exacto de los errores de la
// contrasena no se controla (Bug SCRUM-562) ni los mensajes duplicados del
// formulario vacio (Bug SCRUM-563).

import PSTRegisterPage from '../../pages/practicesoftwaretesting/PSTRegisterPage'
import PSTLoginPage from '../../pages/practicesoftwaretesting/PSTLoginPage'

const registration = new PSTRegisterPage()
const login = new PSTLoginPage()

describe('Registro: alta de clientes [SCRUM-545]', () => {

    beforeEach(() => {
        registration.open()
    })

    it('[CA-01][TC-01.1][SCRUM-547] Debe crear la cuenta con datos validos y volver a Login', () => {
        registration.register(registration.buildCustomer())

        registration.verifyBackToLogin()
    })

    it('[CA-01][TC-01.2][SCRUM-548] Debe permitir ingresar al cliente recien registrado', () => {
        const customer = registration.buildCustomer()
        registration.register(customer)
        registration.verifyBackToLogin()

        login.loginWith(customer.email, customer.password)
        login.verifyLoggedIn(customer)
    })

    it('[CA-01][TC-01.3][SCRUM-549] No debe registrar un email que ya tiene cuenta', () => {
        login.createCustomer().then(existing => {
            registration.register(registration.buildCustomer({ email: existing.email }))

            registration.verifyServerError('emailInUse', 409)
        })
    })

    it('[CA-02][TC-02.1][SCRUM-550] No debe enviar el formulario vacio', () => {
        registration.submit()

        registration.verifyAllRequired()
    })

    it('[CA-02][TC-02.2][SCRUM-551] No debe aceptar un email con formato invalido', () => {
        registration.register(registration.buildCustomer({ email: 'qa.registro@' }))

        registration.verifyFieldError('email', 'emailFormat')
    })

    it('[CA-02][TC-02.3][SCRUM-552] No debe aceptar un telefono con letras', () => {
        registration.register(registration.buildCustomer({ phone: '12ab34' }))

        registration.verifyFieldError('phone', 'phoneFormat')
    })

    it('[CA-02][TC-02.4][SCRUM-553] No debe aceptar una fecha de nacimiento con otro formato', () => {
        registration.register(registration.buildCustomer({ dob: '1990/01/01' }))

        registration.verifyFieldError('dob', 'dobFormat')
    })

    it('[CA-03][TC-03.1][SCRUM-554] No debe aceptar una contrasena de menos de 8 caracteres', () => {
        registration.register(registration.buildCustomer({ password: 'abc' }))

        registration.verifyPasswordRejected()
    })

    it('[CA-03][TC-03.2][SCRUM-555] No debe aceptar una contrasena sin mayuscula ni simbolo', () => {
        registration.register(registration.buildCustomer({ password: 'registro2026' }))

        registration.verifyPasswordRejected()
    })

    it('[CA-03][TC-03.3][SCRUM-556] No debe aceptar una contrasena filtrada en una fuga de datos', () => {
        registration.register(registration.buildCustomer({ password: 'Password1!' }))

        registration.verifyServerError('leakedPassword', 422)
    })

    it('[CA-04][TC-04.1][SCRUM-557] No debe registrar a un menor de 18 anos', () => {
        registration.register(registration.buildCustomer({ dob: '2015-01-01' }))

        registration.verifyServerError('underage', 422)
    })

    it('[CA-04][TC-04.2][SCRUM-558] Debe registrar a un cliente que ya cumplio 18 anos', () => {
        registration.register(registration.buildCustomer({ dob: PSTRegisterPage.isoDateYearsAgo(18, 1) }))

        registration.verifyBackToLogin()
    })

    it.skip('[CA-04][TC-04.3][SCRUM-559] No debe registrar a un mayor de 75 anos (bug conocido: SCRUM-560)', () => {
        registration.register(registration.buildCustomer({ dob: '1940-01-01' }))

        registration.verifyServerError('overage', 422)
    })
})
