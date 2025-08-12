


describe("Product page", () => {

    beforeEach(() => {
        cy.gotoAEUrl("/products")

        cy.allProducts()
        //cy.visit("https://automationexercise.com/products")
        //cy.get("h2.title").should("exist").and("have.text", "All Products")
        //cy.get(".product-image-wrapper").its("length").should("be.gt", 0)

    })
    it("Test case 2 : Ver todos los productos en product page y verificar info del producto en detalle del producto", () => {
        //cy.get("h2.title").should("exist").and("have.text", "All Products")
        //cy.get(".product-image-wrapper").its("length").should("be.gt", 0) //el be.gt significa que sea mayor que 
        cy.get(".product-image-wrapper").as("allProducts")//aca los llamo con un alias
        cy.get("@allProducts").then((allProducts) => {
            const numProducts = allProducts.length
            cy.randomNum(numProducts).then((randomNum) => {
                cy.wrap(allProducts).find(".productinfo h2").eq(randomNumber).should("exist").invoke("text").as("producPrice")
                cy.wrap(allProducts).find(".productinfo p").eq(randomNumber).should("exist").invoke("text").as("producName")
                cy.wrap(allProducts).find(".productinfo a").eq(randomNumber).should("have.text", "Add to cart")
                cy.wrap(allProducts).find(".choose").eq(randomNumber).contains("View Product").click()

            })

            //const randomNumber = Math.floor(Math.random() * numProducts)

        })

        cy.location("pathname").should("contain", "product_detail")
        cy.get("@producPrice").then((producPrice) => {
            cy.get(".product-information span span").invoke("text").then((precioProductoDetalle) => {
                expect(producPrice).to.eq(precioProductoDetalle)
            })
        })

        cy.get("@producName").then((producName) => {
            cy.get(".product-information h2").invoke("text").then((nameProductoDetalle) => {
                expect(producName).to.eq(nameProductoDetalle)
            })
        })

        const productinfo = ["Category:", "Availability", "Condition", "Brand"]
        cy.get(".product-information p").each((productDetail, index) => {
            cy.wrap(productDetail).contains(productinfo[index])

        })

        //cy.get(".product-information p").eq(0).contains("Category:")
        //cy.get(".product-information p").eq(1).contains("Availability")
        //cy.get(".product-information p").eq(2).contains("Condition")
        //cy.get(".product-information p").eq(3).contains("Brand")



    })


    it("Test case 3 :  Filtro por categoria de producto", () => {
        cy.get(".product-image-wrapper").its("length").as("allProducts", { type: 'static' }) //al poner el type static es como una constante, no se modifica, si llamo de nuevo al selector  no va a llamar un nuevo valor
        //en esta linea guardamo la cantida de productos


        cy.get(".category-products").should("exist").and("not.be.empty")
        cy.get('.category-products [data-toggle="collapse"]').then((categorias) => {
            const randomCategory = Math.floor(Math.random() * categorias.length)
            cy.wrap(categorias).eq(randomCategory).invoke("text").as("categoryName")
            cy.wrap(categorias).eq(randomCategory).click()
        })
        cy.get("@categoryName").then((categoryName) => {
            cy.get(`#${categoryName.trim()} .panel-body ul li a`).then((filter) => {  //template string 
                const randomfilter = Math.floor(Math.random() * filter.length) //el filter es lo que esta dentro de categorias (por ejempl si toca woman, filter es dress, top )
                cy.wrap(filter).eq(randomfilter).click()
            })
        })
        cy.location("pathname").should("contains", "/category_products")
        cy.get(".product-image-wrapper").its("length").as("filtroProducto", { type: 'static' })

        cy.get("@allProducts").then((allProducts) => {
            cy.get("@filtroProducto").then((filterProducts) => {
                expect(allProducts).to.gte(filterProducts) //gte = sea mayor o igual
            })
        })


    })


    it("Test case 4 : Filtrar productos by brand", () => {
        cy.get(".brands_products").should("exist").and("not.be.empty")
        cy.get(".brands_products h2").should("have.text", "Brands")
        cy.get(".brand_products li a").as("brandFilters")
        cy.get("@brandFilters").then((brands) => {
            cy.randomNum(brands.length).then((randomIndex) => {
                cy.wrap(brands).eq(randomIndex).then((brand) => {
                    let nameBrand = brand.text()
                    cy.wrap(nameBrand.split(")")[1]).as("brandName")
                })
                cy.wrap(brands).find("span").eq(randomIndex).invoke("text").then((brandProduct) => {
                    let numProd = Number (brandProduct.slice(1, brandProduct.length - 1)) //el slice lo usas para sacarle los parentesis al numero, desde el primer elemento hasta el largo-1, y el Number convierte el string en numero
                    cy.wrap(numProd).as("@numProdBrand")
                })
                cy.wrap(brands).eq(randomIndex).click() //hago click sobre uno de mis marcas para que se filtre

            })
        })

        cy.location("pathname").should("contain", "brand_products/")
        cy.get("@brandName").then((brandName) =>{
            cy.get("h2 .title").should("contain", brandName)
        })

        cy.get("@numProdBrand").then((numProdBrand) =>{
            cy.get(".product-image-wrapper").then((products) =>{
                expect (products.length).to.equal(numProdBrand)
                cy.randomNum(products.length).then((randomIndex)=>{
                    cy.wrap(products).eq(randomIndex).contains("View Product").click()
                })            
            })

        })

                cy.location("pathname").should("contain", "product_details/")
                cy.get(".product-information p ").last().invoke("text").then((brandInfo) =>{
                    cy.get("@brandName").then((brandName) =>{
                        expect(brandInfo).to.contains(brandName)
                    })
                })
    })

    it("Test case 5 : Search for a product", () =>{
        const searchText = "jeans"
        cy.get("input#search_product").type(searchText)
        cy.get("button#submit_search").click()
        cy.get("h2 .title").should("have.text", "Searched Products")
        cy.location("search").should("contain", searchText)
        cy.get(".product-image-wrapper").as("productItems")
        cy.get("@producItems").each((item) =>{
            cy.wrap(item).find(".productinfo p").invoke("text").then((productName)=>{
                expect(productName.toLowerCase()).to.contains(searchText) //el lowercase convierte la mayuscula en minuscula
            })
        })



    })




})