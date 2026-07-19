// Test Case OH-TC3 - Busqueda exitosa de empleado por nombre - Modulo PIM
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-46

import OrangeHRMEmployeeListPage from '../../pages/orangehrm/OrangeHRMEmployeeListPage'

const pimPage = new OrangeHRMEmployeeListPage()

describe('OH-TC3 - Busqueda Exitosa de Empleado por Nombre - PIM [SCRUM-46]', () => {

    beforeEach(() => {
        // Precondicion: el usuario inicia sesion exitosamente y navega al modulo PIM
        cy.loginAsOHAdmin()

        pimPage.navigateToPim()
        pimPage.verifyEmployeeListVisible()
    })

    it('Debe mostrar unicamente al empleado cuyo nombre coincide de forma exacta con el criterio, junto con su informacion basica', () => {

        // Paso 1: Realizar una busqueda amplia para identificar un empleado existente
        // con informacion basica completa (Id, nombre, cargo, estado)
        pimPage.searchEmployeeByName('a')

        pimPage.getFirstEmployeeWithCompleteData().then((employee) => {

            // Paso 2: Buscar por el nombre completo de ese empleado (coincidencia exacta)
            pimPage.searchEmployeeByName(employee.fullName)

            // Paso 3: Verificar que la tabla muestra unicamente empleados cuyo nombre coincide
            pimPage.verifyResultsMatchName(employee.fullName)

            // Paso 4: Verificar que se muestra la informacion basica (Id, nombre, cargo, estado)
            pimPage.verifyEmployeeBasicInfoDisplayed(employee)
        })
    })

    it('Debe mostrar los empleados cuyo nombre coincide parcialmente con el criterio ingresado', () => {

        // Paso 1: Identificar un empleado existente con informacion basica completa
        pimPage.searchEmployeeByName('a')

        pimPage.getFirstEmployeeWithCompleteData().then((employee) => {
            const partialName = employee.fullName.substring(0, Math.max(3, Math.floor(employee.fullName.length / 2)))

            // Paso 2: Buscar utilizando solo una parte del nombre del empleado, sin
            // seleccionar el autocomplete (colapsaria la busqueda a un solo empleado)
            pimPage.searchEmployeeByName(partialName, { selectAutocomplete: false })

            // Paso 3: Verificar que todos los resultados contienen el criterio parcial ingresado
            pimPage.verifyResultsMatchName(partialName)
        })
    })

    it('No debe mostrar empleados cuando el nombre ingresado no coincide con ningun empleado existente', () => {

        // Paso 1: Buscar un nombre que no corresponde a ningun empleado registrado
        pimPage.searchEmployeeByName('ZzqqNoExisteEmpleado123')

        // Paso 2: Verificar que el sistema no muestra empleados en la tabla de resultados
        pimPage.verifyNoRecordsFound()
    })
})
