// Test Case OH-TC8 - Eliminacion de empleado - PIM
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-50

import OrangeHRMAddEmployeePage from '../pages/OrangeHRMAddEmployeePage'

const pimPage = new OrangeHRMAddEmployeePage()

// Da de alta un empleado propio de la suite (prefijo "QaAuto") reutilizando
// pimPage.createEmployee(), y ademas verifica que quede visible en Employee
// List (necesario en este spec porque la eliminacion actua sobre esa misma
// vista). Se ejecuta siempre antes de intentar eliminar, tanto en el
// escenario de eliminacion exitosa como en el de cancelacion: el entorno demo
// es publico y compartido, por lo que nunca se opera sobre un registro
// preexistente ajeno a esta suite (mismo criterio ya aplicado en oh_tc5/oh_tc7).
function crearEmpleadoPropio() {
    const fullName = pimPage.createEmployee()

    pimPage.navigateToEmployeeList()
    pimPage.verifyEmployeeListVisible()
    pimPage.searchEmployeeByName(fullName)
    pimPage.verifyEmployeeInList(fullName)

    return fullName
}

describe('OH-TC8 - Eliminacion de Empleado - PIM [SCRUM-50]', () => {

    beforeEach(() => {
        // Precondicion: el usuario inicia sesion exitosamente y navega al modulo
        // PIM, con al menos un empleado existente disponible
        cy.loginAsOHAdmin()

        pimPage.navigateToPim()
        pimPage.verifyEmployeeListVisible()
    })

    it('Debe eliminar exitosamente a un empleado y dejar de mostrarlo en el listado y en busquedas posteriores', () => {

        const fullName = crearEmpleadoPropio()

        // Paso 1: localizar la fila del empleado y hacer clic en la accion de eliminar
        pimPage.clickDeleteEmployee(fullName)

        // Paso 2: el sistema muestra un dialogo de confirmacion
        pimPage.verifyDeleteConfirmationDialogVisible()

        // Paso 3: confirmar la eliminacion en el dialogo
        pimPage.confirmDeleteEmployee()

        // Paso 4: el sistema muestra confirmacion de eliminacion exitosa
        pimPage.verifyDeleteConfirmationVisible()

        // Paso 5: el empleado deja de aparecer en el listado actual
        cy.contains('.oxd-table-body .oxd-table-row', fullName).should('not.exist')

        // Paso 6: una nueva busqueda por su nombre no devuelve resultados
        pimPage.searchEmployeeByName(fullName, { selectAutocomplete: false })
        pimPage.verifyNoRecordsFound()
    })

    it('Debe cancelar la eliminacion y mantener al empleado visible en el listado y en busquedas posteriores', () => {

        const fullName = crearEmpleadoPropio()

        // Paso 1: localizar la fila del empleado y hacer clic en la accion de eliminar
        pimPage.clickDeleteEmployee(fullName)

        // Paso 2: el sistema muestra un dialogo de confirmacion
        pimPage.verifyDeleteConfirmationDialogVisible()

        // Paso 3: cancelar en el dialogo de confirmacion en lugar de confirmar
        pimPage.cancelDeleteEmployee()

        // Paso 4: el empleado no fue eliminado y sigue visible en el listado actual
        pimPage.verifyEmployeeInList(fullName)

        // Paso 5: una busqueda por su nombre sigue devolviendo el resultado
        pimPage.searchEmployeeByName(fullName, { selectAutocomplete: false })
        pimPage.verifyEmployeeInList(fullName)
    })
})
