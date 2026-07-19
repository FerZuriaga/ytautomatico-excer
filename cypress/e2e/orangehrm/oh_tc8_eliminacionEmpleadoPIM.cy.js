// Test Case OH-TC8 - Eliminacion de empleado - PIM
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-50

import OrangeHRMAddEmployeePage from '../../pages/orangehrm/OrangeHRMAddEmployeePage'
import OrangeHRMEmployeeListPage from '../../pages/orangehrm/OrangeHRMEmployeeListPage'

const addEmployeePage = new OrangeHRMAddEmployeePage()
const employeeListPage = new OrangeHRMEmployeeListPage()

// Da de alta un empleado propio de la suite (prefijo "QaAuto") reutilizando
// addEmployeePage.createEmployee(), y ademas verifica que quede visible en
// Employee List (necesario en este spec porque la eliminacion actua sobre esa
// misma vista). Se ejecuta siempre antes de intentar eliminar, tanto en el
// escenario de eliminacion exitosa como en el de cancelacion: el entorno demo
// es publico y compartido, por lo que nunca se opera sobre un registro
// preexistente ajeno a esta suite (mismo criterio ya aplicado en oh_tc5/oh_tc7).
function crearEmpleadoPropio() {
    const fullName = addEmployeePage.createEmployee()

    employeeListPage.navigateToEmployeeList()
    employeeListPage.verifyEmployeeListVisible()
    employeeListPage.searchEmployeeByName(fullName)
    employeeListPage.verifyEmployeeInList(fullName)

    return fullName
}

describe('OH-TC8 - Eliminacion de Empleado - PIM [SCRUM-50]', () => {

    beforeEach(() => {
        // Precondicion: el usuario inicia sesion exitosamente y navega al modulo
        // PIM, con al menos un empleado existente disponible
        cy.loginAsOHAdmin()

        employeeListPage.navigateToPim()
        employeeListPage.verifyEmployeeListVisible()
    })

    it('Debe eliminar exitosamente a un empleado y dejar de mostrarlo en el listado y en busquedas posteriores', () => {

        const fullName = crearEmpleadoPropio()

        // Paso 1: localizar la fila del empleado y hacer clic en la accion de eliminar
        employeeListPage.clickDeleteEmployee(fullName)

        // Paso 2: el sistema muestra un dialogo de confirmacion
        employeeListPage.verifyDeleteConfirmationDialogVisible()

        // Paso 3: confirmar la eliminacion en el dialogo
        employeeListPage.confirmDeleteEmployee()

        // Paso 4: el sistema muestra confirmacion de eliminacion exitosa
        employeeListPage.verifyDeleteConfirmationVisible()

        // Paso 5: el empleado deja de aparecer en el listado actual
        cy.contains('.oxd-table-body .oxd-table-row', fullName).should('not.exist')

        // Paso 6: una nueva busqueda por su nombre no devuelve resultados
        employeeListPage.searchEmployeeByName(fullName, { selectAutocomplete: false })
        employeeListPage.verifyNoRecordsFound()
    })

    it('Debe cancelar la eliminacion y mantener al empleado visible en el listado y en busquedas posteriores', () => {

        const fullName = crearEmpleadoPropio()

        // Paso 1: localizar la fila del empleado y hacer clic en la accion de eliminar
        employeeListPage.clickDeleteEmployee(fullName)

        // Paso 2: el sistema muestra un dialogo de confirmacion
        employeeListPage.verifyDeleteConfirmationDialogVisible()

        // Paso 3: cancelar en el dialogo de confirmacion en lugar de confirmar
        employeeListPage.cancelDeleteEmployee()

        // Paso 4: el empleado no fue eliminado y sigue visible en el listado actual
        employeeListPage.verifyEmployeeInList(fullName)

        // Paso 5: una busqueda por su nombre sigue devolviendo el resultado
        employeeListPage.searchEmployeeByName(fullName, { selectAutocomplete: false })
        employeeListPage.verifyEmployeeInList(fullName)
    })
})
