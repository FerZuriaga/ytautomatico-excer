import AutomationTestStoreCategoryPage from '../../pages/automation-test-store/AutomationTestStoreCategoryPage'

const categoryPage = new AutomationTestStoreCategoryPage()
const MAKEUP_PATH_ID = 36

describe('Automation Test Store - Ordenar el listado de productos de una categoria [SCRUM-210]', () => {
    beforeEach(() => {
        categoryPage.visitCategory(MAKEUP_PATH_ID)
    })

    it('[CA-01][TC-01.1][SCRUM-212] ordena el listado por nombre ascendente (A-Z)', () => {
        categoryPage.sortBy('pd.name-ASC')
        categoryPage.verifyProductOrder([
            "Delicate Oil-Free Powder Blush",
            "L'EXTRÊME Instant Extensions Lengthening Mascara",
            "Product with stock locations",
            "Tropiques Minerale Loose Bronzer",
            "Viva Glam Lipstick",
            "Waterproof Protective Undereye Concealer"
        ])
    })

    it('[CA-01][TC-01.2][SCRUM-213] ordena el listado por nombre descendente (Z-A)', () => {
        categoryPage.sortBy('pd.name-DESC')
        categoryPage.verifyProductOrder([
            "Waterproof Protective Undereye Concealer",
            "Viva Glam Lipstick",
            "Tropiques Minerale Loose Bronzer",
            "Product with stock locations",
            "L'EXTRÊME Instant Extensions Lengthening Mascara",
            "Delicate Oil-Free Powder Blush"
        ])
    })

    it('[CA-02][TC-02.1][SCRUM-214] ordena el listado por precio ascendente (menor a mayor)', () => {
        categoryPage.sortBy('p.price-ASC')
        categoryPage.verifyProductOrder([
            "Viva Glam Lipstick",
            "L'EXTRÊME Instant Extensions Lengthening Mascara",
            "Waterproof Protective Undereye Concealer",
            "Delicate Oil-Free Powder Blush",
            "Product with stock locations",
            "Tropiques Minerale Loose Bronzer"
        ])
    })

    it('[CA-02][TC-02.2][SCRUM-215] ordena el listado por precio descendente (mayor a menor)', () => {
        categoryPage.sortBy('p.price-DESC')
        categoryPage.verifyProductOrder([
            "Tropiques Minerale Loose Bronzer",
            "Product with stock locations",
            "Waterproof Protective Undereye Concealer",
            "Delicate Oil-Free Powder Blush",
            "L'EXTRÊME Instant Extensions Lengthening Mascara",
            "Viva Glam Lipstick"
        ])
    })
})
