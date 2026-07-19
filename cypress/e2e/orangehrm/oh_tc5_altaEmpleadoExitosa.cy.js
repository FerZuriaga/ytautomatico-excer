// Test Case OH-TC5 - Alta exitosa de empleado con datos obligatorios - PIM
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-48

import OrangeHRMAddEmployeePage from '../../pages/orangehrm/OrangeHRMAddEmployeePage'
import OrangeHRMEmployeeListPage from '../../pages/orangehrm/OrangeHRMEmployeeListPage'

const addEmployeePage = new OrangeHRMAddEmployeePage()
const employeeListPage = new OrangeHRMEmployeeListPage()

describe('OH-TC5 - Alta Exitosa de Empleado con Datos Obligatorios - PIM [SCRUM-48]', () => {

    beforeEach(() => {
        // Precondicion: el usuario inicia sesion exitosamente y navega al modulo
        // PIM, opcion "Add Employee"
        cy.loginAsOHAdmin()

        employeeListPage.navigateToPim()
        addEmployeePage.navigateToAddEmployeeTab()
        addEmployeePage.verifyAddEmployeeFormVisible()
    })

    it('Debe registrar un nuevo empleado y mostrarlo en Personal Details y en Employee List', () => {

        // Paso 1: Generar un nombre y apellido unicos para esta ejecucion (evita
        // colisiones de datos en el entorno demo publico y compartido)
        const { firstName, lastName } = addEmployeePage.generateUniqueEmployeeName()
        const fullName = `${firstName} ${lastName}`

        // Paso 2: Ingresar First Name y Last Name validos, sin modificar el
        // Employee Id autogenerado
        addEmployeePage.enterEmployeeNames(firstName, lastName)

        addEmployeePage.getGeneratedEmployeeId().then((generatedId) => {
            expect(generatedId, 'Employee Id autogenerado antes de guardar').to.not.be.empty

            // Paso 3: Confirmar el guardado del nuevo empleado
            addEmployeePage.saveEmployee()

            // Paso 4: Verificar que el sistema redirige a "Personal Details" del
            // empleado recien creado
            addEmployeePage.verifyPersonalDetailsVisible(fullName)

            // Paso 5: Navegar a "Employee List" y verificar que el empleado
            // creado quede visible en el listado
            employeeListPage.navigateToEmployeeList()
            employeeListPage.verifyEmployeeListVisible()
            employeeListPage.searchEmployeeByName(fullName)
            employeeListPage.verifyEmployeeInList(fullName)
        })
    })
})
