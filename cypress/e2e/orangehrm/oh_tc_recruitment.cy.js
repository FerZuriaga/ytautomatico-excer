import OrangeHRMRecruitmentPage from '../../pages/orangehrm/OrangeHRMRecruitmentPage'

const recruitmentPage = new OrangeHRMRecruitmentPage()

function uniqueCandidateName() {
    const suffix = Date.now().toString().slice(-8)
    return { firstName: 'QaAuto', lastName: `Candidate${suffix}` }
}

describe('[SCRUM-97] Recruitment - Alta de candidato', () => {

    beforeEach(() => {
        cy.loginAsOHAdmin()
    })

    it('[CA-01][TC-01.1][SCRUM-101] Debe registrar un candidato con Nombre, Apellido y Email validos', () => {
        const { firstName, lastName } = uniqueCandidateName()

        recruitmentPage.navigateToAddCandidate()
        recruitmentPage.fillRequiredFields(firstName, lastName, `${firstName}.${lastName}@example.com`)
        recruitmentPage.save()
        recruitmentPage.verifySaveConfirmationVisible()
    })

    it('[CA-01][TC-01.2][SCRUM-104] El candidato dado de alta debe aparecer en el listado de Candidates', () => {
        const { firstName, lastName } = uniqueCandidateName()

        recruitmentPage.navigateToAddCandidate()
        recruitmentPage.fillRequiredFields(firstName, lastName, `${firstName}.${lastName}@example.com`)
        recruitmentPage.save()
        recruitmentPage.verifySaveConfirmationVisible()

        recruitmentPage.navigateToCandidatesList()
        recruitmentPage.searchCandidateByName(`${firstName} ${lastName}`)
        recruitmentPage.verifyCandidateInList(lastName)
    })

    it('[CA-02][TC-02.1][SCRUM-103] Debe rechazar el alta si no se completan los campos obligatorios', () => {
        recruitmentPage.navigateToAddCandidate()
        recruitmentPage.save()
        recruitmentPage.verifyRequiredFieldErrorsVisible()
    })

    it('[CA-02][TC-02.2][SCRUM-105] Debe rechazar un Email con formato invalido', () => {
        const { firstName, lastName } = uniqueCandidateName()

        recruitmentPage.navigateToAddCandidate()
        recruitmentPage.fillRequiredFields(firstName, lastName, 'correo-invalido')
        recruitmentPage.save()
        recruitmentPage.verifyEmailFormatErrorVisible()
    })

    it('[CA-03][TC-03.1][SCRUM-106] Cancelar el alta debe descartar los datos y volver al listado', () => {
        const { firstName, lastName } = uniqueCandidateName()

        recruitmentPage.navigateToAddCandidate()
        recruitmentPage.fillRequiredFields(firstName, lastName, `${firstName}.${lastName}@example.com`)
        recruitmentPage.cancel()
        recruitmentPage.verifyBackOnCandidatesList()
    })

    it('[CA-03][TC-03.2][SCRUM-107] El candidato no debe aparecer en el listado tras cancelar', () => {
        const { firstName, lastName } = uniqueCandidateName()

        recruitmentPage.navigateToAddCandidate()
        recruitmentPage.fillRequiredFields(firstName, lastName, `${firstName}.${lastName}@example.com`)
        recruitmentPage.cancel()
        recruitmentPage.verifyBackOnCandidatesList()

        recruitmentPage.searchCandidateByName(`${firstName} ${lastName}`)
        recruitmentPage.verifyCandidateNotInList(lastName)
    })
})
