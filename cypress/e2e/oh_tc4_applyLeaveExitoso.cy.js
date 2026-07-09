// Test Case OH-TC4 - Solicitud de permiso exitosa - Modulo Leave (Apply Leave)
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-47

import OrangeHRMLoginPage from '../pages/OrangeHRMLoginPage'
import OrangeHRMLeavePage from '../pages/OrangeHRMLeavePage'

const loginPage = new OrangeHRMLoginPage()
const leavePage = new OrangeHRMLeavePage()

describe('OH-TC4 - Solicitud de Permiso Exitosa - Apply Leave [SCRUM-47]', () => {

    beforeEach(() => {
        // Precondicion: el usuario inicia sesion exitosamente y navega al modulo Leave, opcion "Apply"
        cy.gotoOHUrl('/web/index.php/auth/login')
        loginPage.enterCredentials('Admin', 'admin123')
        loginPage.clickLoginButton()
        loginPage.verifyDashboardVisible()

        leavePage.navigateToLeave()
        leavePage.navigateToApplyTab()
        leavePage.verifyApplyFormVisible()
    })

    it('Debe registrar una solicitud de permiso y mostrarla en My Leave con estado Pending Approval', () => {

        // Paso 1: Seleccionar un tipo de permiso disponible
        leavePage.selectAvailableLeaveType().then((leaveTypeText) => {

            // Paso 2: Calcular y completar una fecha de inicio y fecha de fin validas
            // (fin posterior o igual a inicio), usando fechas dinamicas relativas a hoy
            const { fromDate, toDate } = leavePage._getFutureDateRange(10, 1)
            leavePage.enterDates(fromDate, toDate)

            // Paso 3: Confirmar el envio de la solicitud
            leavePage.submitApplyLeave()

            // Paso 4: Verificar que el sistema muestra confirmacion del registro exitoso
            leavePage.verifyConfirmationVisible()

            // Paso 5: Navegar a "My Leave" y verificar que la solicitud quede visible
            // con estado "Pending Approval"
            leavePage.navigateToMyLeave()
            leavePage.verifyMyLeaveListVisible()
            leavePage.verifyLeaveRequestPending(leaveTypeText)
        })
    })
})
