// Test Case OH-TC9 - Eliminacion Multiple y Busqueda de Empleado - PIM
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-51

import OrangeHRMAddEmployeePage from '../../pages/orangehrm/OrangeHRMAddEmployeePage'
import OrangeHRMEmployeeListPage from '../../pages/orangehrm/OrangeHRMEmployeeListPage'

const addEmployeePage = new OrangeHRMAddEmployeePage()
const employeeListPage = new OrangeHRMEmployeeListPage()

describe('OH-TC9 - Eliminacion Multiple y Busqueda de Empleado - PIM [SCRUM-51]', () => {

    beforeEach(() => {
        // Precondicion: el usuario inicia sesion exitosamente y navega al modulo
        // PIM > Employee List
        cy.loginAsOHAdmin()

        employeeListPage.navigateToPim()
        employeeListPage.verifyEmployeeListVisible()
    })

    // CA-02: eliminacion de empleado tras busqueda. Se ejecuta primero por ser la
    // variante de menor riesgo (reutiliza casi por completo el flujo ya validado
    // en SCRUM-50 / oh_tc8).
    it('CA-02: Debe eliminar exitosamente a un empleado localizado por busqueda, y el listado filtrado debe actualizarse sin repetir la busqueda', () => {

        const fullName = addEmployeePage.createEmployee()

        employeeListPage.navigateToEmployeeList()
        employeeListPage.verifyEmployeeListVisible()

        // TC-02.1: la busqueda por nombre filtra correctamente
        employeeListPage.searchEmployeeByName(fullName)
        employeeListPage.verifyEmployeeInList(fullName)
        employeeListPage.verifyResultsMatchName(fullName)

        // Eliminar al empleado desde su fila en el listado filtrado
        employeeListPage.clickDeleteEmployee(fullName)
        employeeListPage.verifyDeleteConfirmationDialogVisible()
        employeeListPage.confirmDeleteEmployee()

        // TC-02.2: confirmacion de exito
        employeeListPage.verifyDeleteConfirmationVisible()

        // TC-02.3: el listado filtrado se actualiza automaticamente, sin mostrar
        // al empleado eliminado y sin necesidad de repetir la busqueda
        cy.contains('.oxd-table-body .oxd-table-row', fullName).should('not.exist')
    })

    // CA-01: eliminacion multiple de empleados. Crea dos empleados propios de la
    // suite (prefijo "QaAuto" via createEmployee) y los elimina en una unica
    // accion masiva.
    it('CA-01: Debe eliminar exitosamente a multiples empleados seleccionados, sin que ninguno vuelva a aparecer en el listado ni en busquedas posteriores', () => {

        const fullName1 = addEmployeePage.createEmployee()
        employeeListPage.navigateToEmployeeList()
        employeeListPage.verifyEmployeeListVisible()

        const fullName2 = addEmployeePage.createEmployee()
        employeeListPage.navigateToEmployeeList()
        employeeListPage.verifyEmployeeListVisible()

        const fullNames = [fullName1, fullName2]

        // Ubicar a ambos empleados propios de la suite mediante una busqueda
        // amplia por el prefijo comun "QaAuto" (usado por
        // generateUniqueEmployeeName para todos los empleados creados por esta
        // suite), sin seleccionar sugerencia del autocomplete para no acotar la
        // busqueda a un unico resultado. Solo se seleccionan los checkboxes de
        // los nombres exactos generados en este test (fullNames); nunca el
        // checkbox "seleccionar todos" del encabezado, para no afectar otros
        // registros del entorno demo publico y compartido.
        employeeListPage.searchEmployeeByName('QaAuto', { selectAutocomplete: false })
        fullNames.forEach((fullName) => employeeListPage.verifyEmployeeInList(fullName))

        employeeListPage.selectEmployeesByName(fullNames)
        employeeListPage.verifyBulkDeleteButtonAvailable()
        employeeListPage.clickBulkDeleteButton()

        employeeListPage.verifyDeleteConfirmationDialogVisible()
        employeeListPage.confirmDeleteEmployee()

        // TC-01.1: confirmacion de exito al eliminar 2+ empleados seleccionados
        employeeListPage.verifyDeleteConfirmationVisible()

        // TC-01.2: ninguno de los empleados eliminados vuelve a aparecer en el
        // listado actual
        fullNames.forEach((fullName) => {
            cy.contains('.oxd-table-body .oxd-table-row', fullName).should('not.exist')
        })

        // TC-01.3: ninguno aparece en busquedas posteriores por nombre
        fullNames.forEach((fullName) => {
            employeeListPage.searchEmployeeByName(fullName, { selectAutocomplete: false })
            employeeListPage.verifyNoRecordsFound()
        })
    })

    // CA-03: validacion de disponibilidad del control de eliminacion masiva. Se
    // ejecuta al final porque depende de que el control ya este resuelto (mismo
    // control de UI usado en CA-01).
    it('CA-03: El control de eliminacion masiva no debe estar disponible sin seleccion, y debe pasar a estar disponible al seleccionar un empleado', () => {

        const fullName = addEmployeePage.createEmployee()

        employeeListPage.navigateToEmployeeList()
        employeeListPage.verifyEmployeeListVisible()
        employeeListPage.searchEmployeeByName(fullName)
        employeeListPage.verifyEmployeeInList(fullName)

        // TC-03.1: sin seleccion, el control no esta disponible
        employeeListPage.verifyBulkDeleteButtonNotAvailable()

        // TC-03.2: al seleccionar al menos un empleado, el control pasa a estar
        // disponible
        employeeListPage.selectEmployeesByName([fullName])
        employeeListPage.verifyBulkDeleteButtonAvailable()
    })
})
