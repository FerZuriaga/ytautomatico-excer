// Modulo: Empleados - PIM - OrangeHRM
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Agrupa: OH-TC3 [SCRUM-46], OH-TC5 [SCRUM-48], OH-TC7 [SCRUM-49],
// OH-TC8 [SCRUM-50], OH-TC9 [SCRUM-51]

import OrangeHRMEmployeeListPage from '../../pages/orangehrm/OrangeHRMEmployeeListPage'
import OrangeHRMAddEmployeePage from '../../pages/orangehrm/OrangeHRMAddEmployeePage'
import OrangeHRMContactDetailsPage from '../../pages/orangehrm/OrangeHRMContactDetailsPage'

const employeeListPage = new OrangeHRMEmployeeListPage()
const addEmployeePage = new OrangeHRMAddEmployeePage()
const contactDetailsPage = new OrangeHRMContactDetailsPage()

describe('OH-TC3 - Busqueda Exitosa de Empleado por Nombre - PIM [SCRUM-46]', () => {

    beforeEach(() => {
        // Precondicion: el usuario inicia sesion exitosamente y navega al modulo PIM
        cy.loginAsOHAdmin()

        employeeListPage.navigateToPim()
        employeeListPage.verifyEmployeeListVisible()
    })

    it('Debe mostrar unicamente al empleado cuyo nombre coincide de forma exacta con el criterio, junto con su informacion basica', () => {

        // Paso 1: Realizar una busqueda amplia para identificar un empleado existente
        // con informacion basica completa (Id, nombre, cargo, estado)
        employeeListPage.searchEmployeeByName('a')

        employeeListPage.getFirstEmployeeWithCompleteData().then((employee) => {

            // Paso 2: Buscar por el nombre completo de ese empleado (coincidencia exacta)
            employeeListPage.searchEmployeeByName(employee.fullName)

            // Paso 3: Verificar que la tabla muestra unicamente empleados cuyo nombre coincide
            employeeListPage.verifyResultsMatchName(employee.fullName)

            // Paso 4: Verificar que se muestra la informacion basica (Id, nombre, cargo, estado)
            employeeListPage.verifyEmployeeBasicInfoDisplayed(employee)
        })
    })

    it('Debe mostrar los empleados cuyo nombre coincide parcialmente con el criterio ingresado', () => {

        // Paso 1: Identificar un empleado existente con informacion basica completa
        employeeListPage.searchEmployeeByName('a')

        employeeListPage.getFirstEmployeeWithCompleteData().then((employee) => {
            const partialName = employee.fullName.substring(0, Math.max(3, Math.floor(employee.fullName.length / 2)))

            // Paso 2: Buscar utilizando solo una parte del nombre del empleado, sin
            // seleccionar el autocomplete (colapsaria la busqueda a un solo empleado)
            employeeListPage.searchEmployeeByName(partialName, { selectAutocomplete: false })

            // Paso 3: Verificar que todos los resultados contienen el criterio parcial ingresado
            employeeListPage.verifyResultsMatchName(partialName)
        })
    })

    it('No debe mostrar empleados cuando el nombre ingresado no coincide con ningun empleado existente', () => {

        // Paso 1: Buscar un nombre que no corresponde a ningun empleado registrado
        employeeListPage.searchEmployeeByName('ZzqqNoExisteEmpleado123')

        // Paso 2: Verificar que el sistema no muestra empleados en la tabla de resultados
        employeeListPage.verifyNoRecordsFound()
    })
})

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

// Ejecuta la edicion del numero de telefono movil sobre la ficha del empleado
// actualmente abierta y verifica tanto la confirmacion de guardado como la
// persistencia del nuevo valor tras recargar la pagina y tras reingresar a la
// ficha mas adelante. Se extrae a una funcion compartida porque se invoca desde
// las dos ramas posibles de seleccion del empleado (encontrado vs. creado).
function editarMobileYVerificarPersistencia(fullName, newMobile) {

    // Paso 2: acceder a la seccion de datos personales (Contact Details) y
    // verificar que el sistema muestra la informacion actual del empleado,
    // incluyendo el dato que se desea modificar
    contactDetailsPage.navigateToContactDetailsTab()
    contactDetailsPage.verifyContactDetailsVisible()

    // Paso 3: modificar el valor del dato simple (telefono movil) por uno nuevo y
    // valido, y confirmar el guardado
    contactDetailsPage.updateMobileNumber(newMobile)
    contactDetailsPage.saveContactDetails()

    // Paso 4: verificar que el sistema muestra una confirmacion de que el cambio
    // se guardo exitosamente
    contactDetailsPage.verifySaveConfirmationVisible()

    // Paso 5: recargar la pagina de la ficha del empleado y verificar que el nuevo
    // valor permanece visible
    cy.reload()
    contactDetailsPage.verifyContactDetailsVisible()
    contactDetailsPage.verifyMobileNumberValue(newMobile)

    // Paso 6: salir de la ficha del empleado (Employee List) y volver a ingresar a
    // la misma ficha mas adelante, verificando que el nuevo valor sigue visible
    employeeListPage.navigateToEmployeeList()
    employeeListPage.verifyEmployeeListVisible()
    employeeListPage.searchEmployeeByName(fullName)
    employeeListPage.openEmployeeByName(fullName)
    contactDetailsPage.navigateToContactDetailsTab()
    contactDetailsPage.verifyContactDetailsVisible()
    contactDetailsPage.verifyMobileNumberValue(newMobile)
}

describe('OH-TC7 - Edicion Exitosa de Datos Personales de Empleado Existente - PIM [SCRUM-49]', () => {

    beforeEach(() => {
        // Precondicion: el usuario inicia sesion exitosamente y navega al modulo
        // PIM, con al menos un empleado existente disponible
        cy.loginAsOHAdmin()

        employeeListPage.navigateToPim()
        employeeListPage.verifyEmployeeListVisible()
    })

    it('Debe modificar el numero de telefono movil de un empleado existente y mantener el nuevo valor visible tras recargar la pagina y tras volver a ingresar a la ficha', () => {

        const newMobile = contactDetailsPage.generateUniqueMobileNumber()

        // Paso 1: priorizar un empleado ya existente propio de la suite de
        // automatizacion (prefijo "QaAuto", generado por SCRUM-46/SCRUM-48) para
        // minimizar la interferencia de otros usuarios del entorno demo publico y
        // compartido. Si no hay ninguno disponible en este momento, se crea uno
        // nuevo como respaldo reutilizando el flujo de alta ya automatizado
        // (OH-TC5), garantizando igualmente un empleado propio de la suite.
        employeeListPage.searchEmployeeByName('QaAuto', { selectAutocomplete: false })

        employeeListPage.hasSearchResults().then((hasOwnEmployee) => {
            if (hasOwnEmployee) {
                employeeListPage.getFirstEmployeeFullName().then((fullName) => {
                    employeeListPage.openEmployeeByName(fullName)
                    editarMobileYVerificarPersistencia(fullName, newMobile)
                })
            } else {
                const fullName = addEmployeePage.createEmployee()

                editarMobileYVerificarPersistencia(fullName, newMobile)
            }
        })
    })
})

// Da de alta un empleado propio de la suite (prefijo "QaAuto") reutilizando
// addEmployeePage.createEmployee(), y ademas verifica que quede visible en
// Employee List (necesario en este spec porque la eliminacion actua sobre esa
// misma vista). Se ejecuta siempre antes de intentar eliminar, tanto en el
// escenario de eliminacion exitosa como en el de cancelacion: el entorno demo
// es publico y compartido, por lo que nunca se opera sobre un registro
// preexistente ajeno a esta suite (mismo criterio ya aplicado en OH-TC5/OH-TC7).
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
    // en SCRUM-50 / OH-TC8).
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
