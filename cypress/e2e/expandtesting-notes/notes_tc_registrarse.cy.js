// Modulo: Cuenta - Registrarse
// Sitio bajo prueba: https://practice.expandtesting.com/notes/app (Expand Testing - Notes App)
// Ticket Jira: SCRUM-766 (CA-01..CA-06, Test Cycle SCRUM-767)
//
// Cada test abre el registro sin sesión y usa un email nuevo; el caso del
// email repetido registra antes esa cuenta por API.

import NotesPage from '../../pages/expandtesting-notes/NotesPage'
import NotesRegisterPage from '../../pages/expandtesting-notes/NotesRegisterPage'
import NotesSessionPage from '../../pages/expandtesting-notes/NotesSessionPage'

const notes = new NotesPage()
const register = new NotesRegisterPage()
const session = new NotesSessionPage()

const PASSWORD = 'Qa!Notes2026'
const NAME = 'Qa Registro'
const PASSWORD_30 = 'Abcdefghij1234567890Abcdefghij'

// Datos válidos con un email nuevo; `changes` reemplaza o quita campos
// (undefined = el campo queda vacío).
const validData = (changes = {}) => ({ email: register.newEmail(), name: NAME, password: PASSWORD, confirmPassword: PASSWORD, ...changes })

const submitAndExpectError = (data, field, textKey) => {
    register.open()
    register.fill(data)
    register.submit()
    register.verifyFieldError(field, textKey)
}

const submitAndExpectCreated = data => {
    register.open()
    register.fill(data)
    register.submit()
    register.verifyCreated()
}

describe('[SCRUM-766] Notes App - Registrarse', () => {

    // CA-01: Con datos válidos y un email que no tiene cuenta, al registrarse se crea la cuenta.

    it('[CA-01][TC-01.1][SCRUM-768] Crear una cuenta con datos válidos', () => {
        submitAndExpectCreated(validData())
    })

    it('[CA-01][TC-01.2][SCRUM-769] Ingresar con la cuenta recién creada', () => {
        const data = validData()
        submitAndExpectCreated(data)
        session.registerAliases()
        register.openLoginFromSuccess()
        session.typeEmail(data.email)
        session.typePassword(data.password)
        session.submit()
        session.loginSucceeds()
    })

    // CA-02: Al registrarse, un email vacío o sin formato válido se avisa debajo del campo y no se crea la cuenta.

    it('[CA-02][TC-02.1][SCRUM-771] No se envía el registro sin email', () => {
        submitAndExpectError(validData({ email: undefined }), 'email', 'emailRequired')
    })

    it('[CA-02][TC-02.2][SCRUM-772] No se envía el registro con un email sin formato válido', () => {
        submitAndExpectError(validData({ email: 'usuario.sin.arroba' }), 'email', 'emailInvalid')
    })

    // CA-03: Al registrarse, un nombre vacío o con menos de 4 o más de 30 caracteres se avisa debajo del campo.

    it('[CA-03][TC-03.1][SCRUM-773] No se envía el registro sin nombre', () => {
        submitAndExpectError(validData({ name: undefined }), 'name', 'nameRequired')
    })

    it('[CA-03][TC-03.2][SCRUM-774] No se envía el registro con un nombre de 3 caracteres', () => {
        submitAndExpectError(validData({ name: 'Ana' }), 'name', 'nameLength')
    })

    it('[CA-03][TC-03.3][SCRUM-775] No se envía el registro con un nombre de 31 caracteres', () => {
        submitAndExpectError(validData({ name: 'A'.repeat(31) }), 'name', 'nameLength')
    })

    it('[CA-03][TC-03.4][SCRUM-776] Un nombre de 4 caracteres permite crear la cuenta', () => {
        submitAndExpectCreated(validData({ name: 'Anab' }))
    })

    it('[CA-03][TC-03.5][SCRUM-777] Un nombre de 30 caracteres permite crear la cuenta', () => {
        submitAndExpectCreated(validData({ name: 'A'.repeat(30) }))
    })

    // CA-04: Al registrarse, una contraseña vacía o con menos de 6 o más de 30 caracteres se avisa debajo del campo.

    it('[CA-04][TC-04.1][SCRUM-778] No se envía el registro sin contraseña', () => {
        submitAndExpectError(validData({ password: undefined }), 'password', 'passwordRequired')
    })

    it('[CA-04][TC-04.2][SCRUM-779] No se envía el registro con una contraseña de 5 caracteres', () => {
        submitAndExpectError(validData({ password: 'Ab123', confirmPassword: 'Ab123' }), 'password', 'passwordLength')
    })

    it('[CA-04][TC-04.3][SCRUM-780] No se envía el registro con una contraseña de 31 caracteres', () => {
        submitAndExpectError(validData({ password: `${PASSWORD_30}1`, confirmPassword: `${PASSWORD_30}1` }), 'password', 'passwordLength')
    })

    it('[CA-04][TC-04.4][SCRUM-781] Una contraseña de 6 caracteres permite crear la cuenta', () => {
        submitAndExpectCreated(validData({ password: 'Abc123', confirmPassword: 'Abc123' }))
    })

    it('[CA-04][TC-04.5][SCRUM-782] Una contraseña de 30 caracteres permite crear la cuenta', () => {
        submitAndExpectCreated(validData({ password: PASSWORD_30, confirmPassword: PASSWORD_30 }))
    })

    // CA-05: Al registrarse, una confirmación vacía o distinta de la contraseña se avisa debajo del campo.

    it('[CA-05][TC-05.1][SCRUM-783] No se envía el registro sin confirmar la contraseña', () => {
        submitAndExpectError(validData({ confirmPassword: undefined }), 'confirmPassword', 'confirmRequired')
    })

    it('[CA-05][TC-05.2][SCRUM-784] No se envía el registro con una confirmación distinta de la contraseña', () => {
        submitAndExpectError(validData({ confirmPassword: 'Qa!Notes2027' }), 'confirmPassword', 'confirmMismatch')
    })

    // CA-06: Un email que ya tiene cuenta no se puede registrar otra vez, aunque se escriba con otras mayúsculas.

    const submitExistingEmail = toEmail => notes.prepareUser().then(user => {
        register.open()
        register.fill(validData({ email: toEmail(user.email) }))
        register.submit()
        register.verifyRejectedByServer()
    })

    it('[CA-06][TC-06.1][SCRUM-770] No se crea una cuenta con un email que ya está registrado', () => {
        submitExistingEmail(email => email)
    })

    it('[CA-06][TC-06.2][SCRUM-785] No se crea una cuenta con un email registrado escrito con otras mayúsculas', () => {
        // qa.notes.<n>@example.com -> QA.Notes.<n>@Example.com
        submitExistingEmail(email => email.replace('qa.notes', 'QA.Notes').replace('example.com', 'Example.com'))
    })
})
