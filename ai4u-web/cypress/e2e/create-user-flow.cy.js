describe("AI4U Create User Flow", () => {
  beforeEach(() => {
    // Mock user registration API endpoint
    cy.intercept("POST", "/api/v1/auth/register", (req) => {
      const {
        email,
        password,
        first_name,
        last_name,
        userType,
        acceptTerms,
        subscribeNewsletter,
      } = req.body;

      if (
        email === "satyam@example.com" &&
        password === "Asgard@123" &&
        first_name === "Satyam" &&
        last_name === "Singh" &&
        userType === "individual" &&
        acceptTerms === true &&
        subscribeNewsletter === true
      ) {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            message: "Account created successfully",
            data: {
              first_name: "Satyam",
              last_name: "Singh",
              email: "satyam@example.com",
              phone: "+91 9876543210",
              auth_method: "EMAIL",
              account_type: "INDIVIDUAL",
              accept_terms: true,
              subscribe_newsletter: true,
              timezone: "Asia/Kolkata",
              locale: "en-IN",
              id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
              full_name: "Satyam Singh",
              avatar_url: "https://example.com/avatar.jpg",
              is_active: true,
              is_email_verified: true,
              login_count: 0,
              last_login_at: "2025-10-13T09:22:42.234Z",
              created_at: "2025-10-13T09:22:42.234Z",
            },
          },
        });
      } else {
        req.reply({
          statusCode: 400,
          body: {
            success: false,
            message: "Invalid registration data",
          },
        });
      }
    }).as("registerRequest");

    cy.visit("http://localhost:3000/?view=individual-signup");
  });

  it("renders the signup form and all fields correctly", () => {
    cy.contains("Sign In", { matchCase: false }).click();
    cy.get('[data-cy="modal-container"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-cy="first-name-input"]')
          .should("exist")
          .and("be.visible");
        cy.get('[data-cy="last-name-input"]')
          .scrollIntoView()
          .should("be.visible");
        cy.get('[data-cy="email-input"]').scrollIntoView().should("be.visible");
        cy.get('[data-cy="password-input"]').should("be.visible");
        cy.get('[data-cy="confirm-password-input"]').should("be.visible");
        cy.get('[data-cy="individual-term-checkbox"]').should("be.visible");
        cy.get('[data-cy="individual-subscribe-checkbox"]').should(
          "be.visible"
        );
        cy.get('[data-cy="submit-button"]').should("be.visible");
      });
  });

  //check native validation errors for empty
  it("shows native validation errors for empty ", () => {
    cy.contains("Sign In").click();
    cy.get('[data-cy="modal-container"]').should("be.visible");
    cy.get('[data-cy="first-name-input"]')
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.include(
          "Please fill out this field"
        );
      })
      .type("Satyam");

    cy.get('[data-cy="last-name-input"]')
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.include(
          "Please fill out this field"
        );
      })
      .type("Singh");

    cy.get('[data-cy="submit-button"]').click();

    cy.get('[data-cy="email-input"]')
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.include(
          "Please fill out this field"
        );
      })
      .type("satyam@example.com");
    cy.get('[data-cy="password-input"]')
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.include(
          "Please fill out this field"
        );
      })
      .type("Asgard@123");
    cy.get('[data-cy="confirm-password-input"]')
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.include(
          "Please fill out this field"
        );
      })
      .type("Asgard@123");
    cy.get('[data-cy="individual-term-checkbox"]')
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.include(
          "Please check this box if you want to proceed."
        );
      })
      .check({ force: true });
    cy.get('[data-cy="individual-subscribe-checkbox"]')
      .then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validationMessage).to.include(
          "Please check this box if you want to proceed."
        );
      })
      .check({ force: true });
    cy.get('[data-cy="submit-button"]').click();
  });

  //  Check invalid inputs format
  it("shows browser validation for invalid email and input format", () => {
    cy.contains("Sign In").click();
    cy.get('[data-cy="modal-container"]').should("be.visible");
    cy.get('[data-cy="first-name-input"]').type("S");
    cy.get('[data-cy="last-name-input"]').type("S");
    cy.get('[data-cy="email-input"]').type("satyam@");
    cy.get('[data-cy="password-input"]').type("Asgard@");
    cy.get('[data-cy="confirm-password-input"]').type("Asgard@1");
    cy.get('[data-cy="individual-term-checkbox"]').check({ force: true });
    cy.get('[data-cy="individual-subscribe-checkbox"]').check({ force: true });
    cy.get('[data-cy="submit-button"]').click();
    cy.get('[data-cy="modal-container"]').scrollTo("75%", "0%");
    cy.get('[data-cy="first-name-error"]')
      .should("be.visible")
      .and("contain.text", "Name must be at least 2 characters long");
    cy.get('[data-cy="modal-container"]').scrollTo("0%", "75%");
    cy.get('[data-cy="email-error"]')
      .should("be.visible")
      .and("contain.text", "Please enter a valid email address");
    cy.get('[data-cy="password-error"]')
      .should("be.visible")
      .and("contain.text", "Password must be at least 8 characters long");
    cy.get('[data-cy="confirm-password-error"]')
      .should("be.visible")
      .and("contain.text", "Passwords do not match");

    // different errors for first name
    cy.get('[data-cy="modal-container"]').scrollTo("75%", "0%");
    cy.get('[data-cy="first-name-input"]').clear().type("Satyam@");
    cy.get('[data-cy="modal-container"]').scrollTo("0%", "75%");
    cy.get('[data-cy="submit-button"]').click();
    cy.get('[data-cy="modal-container"]').scrollTo("75%", "0%");
    cy.get('[data-cy="first-name-error"]')
      .should("be.visible")
      .and(
        "contain.text",
        "Name can only contain letters, spaces, hyphens, and apostrophes"
      );
    // different errors for password
    cy.get('[data-cy="modal-container"]').scrollTo("0%", "50%");
    cy.get('[data-cy="password-input"]').clear().type("Asgard1234");
    cy.get('[data-cy="submit-button"]').click();
    cy.get('[data-cy="password-error"]')
      .should("be.visible")
      .and("contain.text", "Password must contain one special character");
    cy.get('[data-cy="password-input"]').clear().type("asgard@1234");
    cy.get('[data-cy="modal-container"]').scrollTo("50%", "75%");
    cy.get('[data-cy="submit-button"]').click();
    cy.get('[data-cy="password-error"]')
      .should("be.visible")
      .and("contain.text", "Password must contain one uppercase letter");
    cy.get('[data-cy="modal-container"]').scrollTo("75%", "50%");
    cy.get('[data-cy="password-input"]').clear().type("Asgard@no");
    cy.get('[data-cy="modal-container"]').scrollTo("50%", "75%");
    cy.get('[data-cy="submit-button"]').click();
    cy.get('[data-cy="password-error"]')
      .should("be.visible")
      .and("contain.text", "Password must contain one number");
    cy.get('[data-cy="modal-container"]').scrollTo("75%", "50%");
    cy.get('[data-cy="password-input"]').clear().type("ASGARD@123");
    cy.get('[data-cy="modal-container"]').scrollTo("50%", "75%");
    cy.get('[data-cy="submit-button"]').click();
    cy.get('[data-cy="password-error"]')
      .should("be.visible")
      .and("contain.text", "Password must contain one lowercase letter");
  });

  //  Check API failure case
  it("shows error when API responds with failure", () => {
    cy.contains("Sign In").click();

    // Enter wrong email to trigger 400 mock
    cy.get('[data-cy="first-name-input"]').type("Wrong");
    cy.get('[data-cy="last-name-input"]').type("User");
    cy.get('[data-cy="email-input"]').type("wrong@example.com");
    cy.get('[data-cy="password-input"]').type("Asgard@123");
    cy.get('[data-cy="confirm-password-input"]').type("Asgard@123");
    cy.get('[data-cy="individual-term-checkbox"]').check({ force: true });
    cy.get('[data-cy="individual-subscribe-checkbox"]').check({ force: true });
    cy.get('[data-cy="submit-button"]').click();

    cy.wait("@registerRequest").its("response.statusCode").should("eq", 400);
    cy.get('[data-cy="submit-error"]')
      .should("be.visible")
      .and("contain.text", "Invalid registration data");
  });

  // Check successful registration flow
  it("successfully registers a user and closes modal", () => {
    cy.contains("Sign In").click();

    cy.get('[data-cy="first-name-input"]').type("Satyam");
    cy.get('[data-cy="last-name-input"]').type("Singh");
    cy.get('[data-cy="email-input"]').type("satyam@example.com");
    cy.get('[data-cy="password-input"]').type("Asgard@123");
    cy.get('[data-cy="confirm-password-input"]').type("Asgard@123");
    cy.get('[data-cy="individual-term-checkbox"]').check({ force: true });
    cy.get('[data-cy="individual-subscribe-checkbox"]').check({ force: true });
    cy.get('[data-cy="submit-button"]').click();

    cy.wait("@registerRequest").then((interception) => {
      const body = interception.request.body;

      expect(body).to.deep.include({
        first_name: "Satyam",
        last_name: "Singh",
        email: "satyam@example.com",
        userType: "individual",
        password: "Asgard@123",
        acceptTerms: true,
        subscribeNewsletter: true,
      });
    });

    cy.get('[data-cy="go-to-dashboard-button"]').click();
  });
});
