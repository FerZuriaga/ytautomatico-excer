// Modulo: Favoritos - Guardar productos favoritos
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-530 (CA-01/CA-02/CA-03, Test Cycle SCRUM-531)
//
// Cada test registra su propio cliente por API y siembra sus favoritos por
// API cuando la precondicion lo pide; la sesion se inyecta en la primera
// carga de pagina.

import PSTFavoritesPage from '../../pages/practicesoftwaretesting/PSTFavoritesPage'
import PSTLoginPage from '../../pages/practicesoftwaretesting/PSTLoginPage'

const favorites = new PSTFavoritesPage()
const login = new PSTLoginPage()

describe('Favoritos: guardar productos favoritos [SCRUM-530]', () => {

    it('[CA-01][TC-01.1][SCRUM-532] Debe guardar en favoritos el producto agregado desde su ficha', () => {
        favorites.prepareCustomer()
        favorites.openProductDetail('Combination Pliers')

        favorites.addToFavorites(201)
        favorites.verifyToast('added')

        favorites.openFromMenu()
        favorites.verifyFavorites(['Combination Pliers'])
    })

    it('[CA-01][TC-01.2][SCRUM-533] Debe sumar un segundo producto a los favoritos ya guardados', () => {
        favorites.prepareCustomer(['Combination Pliers'])
        favorites.openProductDetail('Thor Hammer')

        favorites.addToFavorites(201)
        favorites.verifyToast('added')

        favorites.openFromMenu()
        favorites.verifyFavorites(['Combination Pliers', 'Thor Hammer'])
    })

    it('[CA-02][TC-02.1][SCRUM-534] No debe agregar dos veces el mismo producto a favoritos', () => {
        favorites.prepareCustomer()
        favorites.openProductDetail('Combination Pliers')

        favorites.addToFavorites(201)
        favorites.verifyToast('added')

        favorites.addToFavorites(409)
        favorites.verifyToast('alreadyAdded', 'error')
    })

    it('[CA-02][TC-02.2][SCRUM-535] No debe repetir un producto guardado en una sesion anterior', () => {
        favorites.prepareCustomer(['Combination Pliers'])
        favorites.openProductDetail('Combination Pliers')

        favorites.addToFavorites(409)
        favorites.verifyToast('alreadyAdded', 'error')

        favorites.openFromMenu()
        favorites.verifyFavorites(['Combination Pliers'])
    })

    it('[CA-03][TC-03.1][SCRUM-536] Debe mostrar los favoritos del cliente al entrar desde el menu', () => {
        favorites.prepareCustomer(['Combination Pliers', 'Thor Hammer'])
        favorites.visitHome()

        favorites.openUserMenu()
        favorites.clickMyFavorites()
        favorites.verifyFavorites(['Combination Pliers', 'Thor Hammer'])
    })

    it('[CA-03][TC-03.2][SCRUM-537] No debe permitir agregar a favoritos sin sesion iniciada', () => {
        favorites.openProductDetail('Combination Pliers')
        favorites.verifySignedOut()

        favorites.addToFavorites(401)
        favorites.verifyToast('unauthorized', 'error')
        favorites.verifyStillOnProduct('Combination Pliers')
    })

    it('[CA-03][TC-03.3][SCRUM-538] Debe llevar al Login al entrar a la lista de favoritos sin sesion', () => {
        favorites.visitHome()
        favorites.verifySignedOut()

        favorites.openFavoritesByAddress()
        login.verifyRedirectedToLogin()
    })
})
