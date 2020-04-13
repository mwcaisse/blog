
describe("Smoke Test", () => {
    it("Header shows Code Untamed", () => {
        cy.visit("http://localhost:8080/")

        cy.get("#header .title")
            .should("contain", "Code Untamed")
    });
});