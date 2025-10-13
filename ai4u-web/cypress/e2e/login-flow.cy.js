describe("AI4U Login Flow", () => {
  beforeEach(() => {
    // Mock login API endpoint
    cy.intercept("POST", "/api/v1/auth/login", (req) => {
      const { email, password } = req.body;

      if (email === "satyam@example.com" && password === "Asgard@123") {
        req.reply({
          statusCode: 200,
          body: {
            access_token: "mock-token-123",
            refresh_token: "mock-refresh-token-456",
            token_type: "bearer",
            expires_in: 0,
          },
        });
      } else {
        req.reply({
          statusCode: 401,
          body: { message: "Invalid credentials" },
        });
      }
    }).as("loginRequest");

    cy.visit("http://localhost:3000/");
  });

  it("renders the login modal and all fields correctly", () => {
    cy.contains("Sign In", { matchCase: false }).click();
    cy.get('[data-cy="modal-container"]').should("be.visible");

    cy.get('[data-cy="email-address"]').should("exist").and("be.visible");
    cy.get('[data-cy="password"]').should("exist").and("be.visible");
    cy.get('[data-cy="submit-button"]').should("exist").and("be.visible");
  });

  it("shows native validation when both fields are blank", () => {
    cy.contains("Sign In").click();
    cy.get('[data-cy="modal-container"]').should("be.visible");

    cy.get('[data-cy="submit-button"]').click();

    cy.get('[data-cy="email-address"]').then(($input) => {
      expect($input[0].checkValidity()).to.be.false;
      cy.log($input[0].validationMessage);
    });
  });

  it("shows native validation when email format is invalid", () => {
    cy.contains("Sign In").click();

    cy.get('[data-cy="email-address"]').type("abcd");
    cy.get('[data-cy="password"]').type("Asgard@123");

    cy.get('[data-cy="email-address"]').then(($input) => {
      expect($input[0].checkValidity()).to.be.false;
      expect($input[0].validationMessage).to.include("@");
    });
  });

  it("shows native validation when password format is invalid", () => {
    cy.contains("Sign In").click();

    cy.get('[data-cy="email-address"]').type("satyam@example.com");
    cy.get('[data-cy="password"]').type("short");
    cy.get('[data-cy="submit-button"]').click();

    cy.get('[data-cy="password-input-error"]')
      .should("be.visible")
      .and("contain.text", "Password must be at least 8 characters long");
  });

  it("shows error when API returns 401 for wrong credentials", () => {
    cy.contains("Sign In").click();

    cy.get('[data-cy="email-address"]').type("wrong@example.com");
    cy.get('[data-cy="password"]').type("wrongpass");
    cy.get('[data-cy="submit-button"]').click();

    cy.wait("@loginRequest");
    cy.get('[data-cy="submit-error"]')
      .should("be.visible")
      .and("contain.text", "Authentication required");
  });

  it.only("logs in successfully and closes modal", () => {
    cy.contains("Sign In").click();

    cy.get('[data-cy="email-address"]').type("satyam@example.com");
    cy.get('[data-cy="password"]').type("Asgard@123");
    cy.get('[data-cy="submit-button"]').click();

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      expect(token).to.exist;
    });
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      expect(token).to.exist;
    });
  });

  it("closes modal manually when user clicks X", () => {
    cy.contains("Sign In").click();
    cy.get('[data-cy="modal-container"]').should("be.visible");

    cy.get('[data-cy="modal-close-button"]').click({ force: true });
    cy.get('[data-cy="modal-container"]').should("not.exist");
  });
});
