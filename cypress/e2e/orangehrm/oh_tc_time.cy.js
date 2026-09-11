import OrangeHRMTimePage from '../../pages/orangehrm/OrangeHRMTimePage'

const timePage = new OrangeHRMTimePage()

describe('[SCRUM-88] Time - Marcar entrada y salida (Punch In/Out)', () => {

    beforeEach(() => {
        cy.loginAsOHAdmin()
    })

    it('[CA-01][TC-01.1][SCRUM-93] Debe registrar la Entrada con la hora sugerida y mostrar el formulario de Salida', () => {
        timePage.ensurePunchedOut()

        timePage.verifyPunchState('In')
        timePage.confirmPunch()
        timePage.verifyPunchState('Out')
    })

    it('[CA-01][TC-01.2][SCRUM-95] El registro de Entrada debe aparecer en el historial como marca abierta', () => {
        timePage.ensurePunchedOut()

        timePage.confirmPunch()

        timePage.navigateToMyRecords()
        timePage.verifyLatestRecordIsOpen()
    })

    it('[CA-02][TC-02.1][SCRUM-91] Debe registrar la Salida con la hora sugerida y mostrar el formulario de Entrada', () => {
        timePage.ensurePunchedIn()

        timePage.verifyPunchState('Out')
        timePage.confirmPunch()
        timePage.verifyPunchState('In')
    })

    it('[CA-02][TC-02.2][SCRUM-96] El registro de Salida debe cerrar la marca en el historial', () => {
        timePage.ensurePunchedIn()

        timePage.confirmPunch()

        timePage.navigateToMyRecords()
        timePage.verifyLatestRecordIsClosed()
    })

    it('[CA-03][TC-03.1][SCRUM-90] El estado de marca abierta debe persistir al recargar la pagina', () => {
        timePage.ensurePunchedIn()
        timePage.verifyPunchState('Out')

        cy.reload()
        timePage.verifyPunchState('Out')
    })

    it('[CA-03][TC-03.2][SCRUM-92] El estado de marca abierta debe persistir al navegar y volver', () => {
        timePage.ensurePunchedIn()
        timePage.verifyPunchState('Out')

        cy.gotoOHUrl('/web/index.php/dashboard/index')
        timePage.navigateToPunchInOut()
        timePage.verifyPunchState('Out')
    })
})
