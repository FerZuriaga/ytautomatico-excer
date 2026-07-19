// Test Case OH-TC7 - Edicion exitosa de datos personales de un empleado existente - PIM
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-49

import OrangeHRMAddEmployeePage from '../../pages/orangehrm/OrangeHRMAddEmployeePage'

const pimPage = new OrangeHRMAddEmployeePage()

// Ejecuta la edicion del numero de telefono movil sobre la ficha del empleado
// actualmente abierta y verifica tanto la confirmacion de guardado como la
// persistencia del nuevo valor tras recargar la pagina y tras reingresar a la
// ficha mas adelante. Se extrae a una funcion compartida porque se invoca desde
// las dos ramas posibles de seleccion del empleado (encontrado vs. creado).
function editarMobileYVerificarPersistencia(fullName, newMobile) {

    // Paso 2: acceder a la seccion de datos personales (Contact Details) y
    // verificar que el sistema muestra la informacion actual del empleado,
    // incluyendo el dato que se desea modificar
    pimPage.navigateToContactDetailsTab()
    pimPage.verifyContactDetailsVisible()

    // Paso 3: modificar el valor del dato simple (telefono movil) por uno nuevo y
    // valido, y confirmar el guardado
    pimPage.updateMobileNumber(newMobile)
    pimPage.saveContactDetails()

    // Paso 4: verificar que el sistema muestra una confirmacion de que el cambio
    // se guardo exitosamente
    pimPage.verifySaveConfirmationVisible()

    // Paso 5: recargar la pagina de la ficha del empleado y verificar que el nuevo
    // valor permanece visible
    cy.reload()
    pimPage.verifyContactDetailsVisible()
    pimPage.verifyMobileNumberValue(newMobile)

    // Paso 6: salir de la ficha del empleado (Employee List) y volver a ingresar a
    // la misma ficha mas adelante, verificando que el nuevo valor sigue visible
    pimPage.navigateToEmployeeList()
    pimPage.verifyEmployeeListVisible()
    pimPage.searchEmployeeByName(fullName)
    pimPage.openEmployeeByName(fullName)
    pimPage.navigateToContactDetailsTab()
    pimPage.verifyContactDetailsVisible()
    pimPage.verifyMobileNumberValue(newMobile)
}

describe('OH-TC7 - Edicion Exitosa de Datos Personales de Empleado Existente - PIM [SCRUM-49]', () => {

    beforeEach(() => {
        // Precondicion: el usuario inicia sesion exitosamente y navega al modulo
        // PIM, con al menos un empleado existente disponible
        cy.loginAsOHAdmin()

        pimPage.navigateToPim()
        pimPage.verifyEmployeeListVisible()
    })

    it('Debe modificar el numero de telefono movil de un empleado existente y mantener el nuevo valor visible tras recargar la pagina y tras volver a ingresar a la ficha', () => {

        const newMobile = pimPage.generateUniqueMobileNumber()

        // Paso 1: priorizar un empleado ya existente propio de la suite de
        // automatizacion (prefijo "QaAuto", generado por SCRUM-46/SCRUM-48) para
        // minimizar la interferencia de otros usuarios del entorno demo publico y
        // compartido. Si no hay ninguno disponible en este momento, se crea uno
        // nuevo como respaldo reutilizando el flujo de alta ya automatizado
        // (oh_tc5), garantizando igualmente un empleado propio de la suite.
        pimPage.searchEmployeeByName('QaAuto', { selectAutocomplete: false })

        pimPage.hasSearchResults().then((hasOwnEmployee) => {
            if (hasOwnEmployee) {
                pimPage.getFirstEmployeeFullName().then((fullName) => {
                    pimPage.openEmployeeByName(fullName)
                    editarMobileYVerificarPersistencia(fullName, newMobile)
                })
            } else {
                const fullName = pimPage.createEmployee()

                editarMobileYVerificarPersistencia(fullName, newMobile)
            }
        })
    })
})
