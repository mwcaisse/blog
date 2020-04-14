
describe("Smoke Test", () => {
    it("Header shows Code Untamed", () => {
        cy.visit("/");

        cy.get("#header .title")
            .should("contain", "Code Untamed")
    });

    it("Navigation has Blog and Tags", () => {
        cy.visit("/");

        cy.get("#header .nav-item")
            //.should("have.length.of(2)")
            .first()
                .should("contain.text", "Posts")
            .next()
                .should("contain.text", "Tags");
    });

    it("Navigates to tags page", () => {
        cy.visit("/");

        cy.get("#header .nav-item").contains("Tags").click();

        cy.url().should("equal", Cypress.config().baseUrl + "tag/");
    })
});