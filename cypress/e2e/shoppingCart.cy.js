describe("Shoping Cart", () => {
    it("Test case 6 : Delete product from cart", () => {
        cy.gotoAEUrl("/products")
        cy.get(".product-image-wrapper").as("allProducts")
        cy.get("@allProducts").its("length").should("be.gte", 1)
        cy.get("@allProducts").then((allProduct) => {
            const numProducts = allProduct.length
            cy.randomNum(numProducts).then((randomNum) => {
                cy.wrap(allProduct).find(".productinfo h2").eq(randomNum).should("exist").invoke("text").as("productPrice", { type: "static" })
                cy.wrap(allProduct).find(".productinfo p").eq(randomNum).should("exist").invoke("text").as("productName", { type: "static" })
                cy.wrap(allProduct).find(".productinfo a").eq(randomNum).should("have.text", "Add to cart").click()
                cy.get("#cartModal .modal-confirm").should("be.visible")
                cy.get('#cartModal .modal-confirm [data-dismiss ="modal"]').click()
                cy.get('.shop-menu ul li a[href*="cart"]').click()
                cy.get("#cart_info").should("exist").and("be.visible")
                cy.get("#cart_info_table tbody tr").as("productCartOverview")
                cy.get("@productCartOverview").then((productCartOverview) => {
                    cy.wrap(productCartOverview).find(".cart_description h4").invoke("text").as("productCartName")
                    cy.wrap(productCartOverview).find(".cart_price p").invoke("text").as("productCartPrice")
                })
                cy.get("@productCartName").then((productCartName) => {
                    cy.get("@productName").then((productName) => {
                        expect(productCartName).to.eq(productName)
                    })
                })

                cy.get("@productCartPrice").then((productCartPrice) => {
                    cy.get("@productPrice").then((productPrice) => {
                        expect(productCartPrice).to.eq(productPrice)
                    })
                })
                cy.get("@productCartOverview").find ("td.cart_delete").click()
                cy.get(".cart_info p").should("exist").and("contain", "Cart is empty")


            })
        })




    })


    it.only("test case 7: Agregar multiples item",()=>{
        cy.gotoAEUrl("/product_details/18")
        const cantidadProduct = 3
        cy.get(".product-information").as("productDetails")
        cy.get("@productDetails").then((productDetails) =>{
            cy.wrap(productDetails).find("h2").invoke("text").as("productDetailName",{ type : "static"})
            cy.wrap(productDetails).find("p").first().invoke("text").as("productDetailCategory",{ type : "static"})
            cy.wrap(productDetails).find("span span").invoke("text").as("productDetailPrice",{ type : "static"})
            cy.wrap(productDetails).find("input#quantity").clear()
            cy.wrap(productDetails).find("input#quantity").type(cantidadProduct.toString())
            cy.wrap(productDetails).find("button.cart").click()

        })
        cy.get("#cartModal .modal-body a").should("exist").and("be.visible")
        cy.get("#cartModal .modal-body a").click()
        cy.validateAEUrl("/view_cart")
        cy.get("#cart_info_table tbody tr").then((productCartOverview)=>{
            cy.wrap(productCartOverview).find(".cart_total_price").invoke("text").as("productCartTotalPrice",{ type : "static"})
            cy.get("@productDetailName").then((productName)=>{
                cy.wrap(productCartOverview).find(".cart_description h4").invoke("text").then((overviewName)=>{
                    expect(overviewName).to.eq(productName)
                })
            })
            cy.get("@productDetailCategory").then((productCategory)=>{
                cy.wrap(productCartOverview).find(".cart_description p").invoke("text").then((overviewCategory)=>{
                    expect(productCategory).to.contain(overviewCategory)
                })
            })
            cy.get("@productDetailPrice").then((productPrice)=>{
                const numDetailPrice = Number(productPrice.split(" ")[1])
                cy.wrap(productCartOverview).find(".cart_price p").invoke("text").then((overviewPrice)=>{
                    expect(overviewPrice).to.eq(productPrice)
                })
                cy.get("@productCartTotalPrice").then((cartTotalPrice)=>{
                    const numTotalPrice = Number(cartTotalPrice.split(" ")[1])
                    expect(numTotalPrice).to.eq(numDetailPrice*cantidadProduct)
                })
            })
            cy.wrap(productCartOverview).find(".cart_quantity").invoke("text").then((overviewQuantity) =>{
                expect(overviewQuantity.trim()).to.eq(cantidadProduct.toString())
            })
        })


    })
})

