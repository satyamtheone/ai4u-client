beforeEach(() => {
  // Intercept and mock the organization admin registration API
  cy.intercept("POST", "/api/v1/auth/register", (req) => {
    const expectedPayload = {
      email: "satyamsinghorg@gmail.com",
      password: "Asgard@123",
      userType: "organization_admin",
      organizationData: {
        first_name: "satyam",
        last_name: "satyam",
        description: "this will be the description",
        industry: "healthcare",
        size: "11-25",
        website: "https://website.in",
      },
      acceptTerms: true,
      subscribeNewsletter: true,
    };

    // Compare the incoming request with the expected payload
    if (JSON.stringify(req.body) === JSON.stringify(expectedPayload)) {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          message: "User registered successfully",
          data: {
            first_name: "satyam",
            last_name: "singh",
            email: "satyamsinghorg@gmail.com",
            phone: null,
            auth_method: "email",
            account_type: "INDIVIDUAL",
            accept_terms: false,
            subscribe_newsletter: false,
            timezone: "UTC",
            locale: "en",
            id: "35a1f063-85d6-4649-8293-37f7601bd903",
            full_name: null,
            avatar_url: null,
            is_active: true,
            is_email_verified: false,
            login_count: 0,
            last_login_at: null,
            created_at: "2025-10-12T09:06:53.375617Z",
          },
        },
      });
    } else {
      // If payload doesn't match exactly — simulate backend validation error
      req.reply({
        statusCode: 400,
        body: {
          success: false,
          message: "Invalid registration data",
          received: req.body,
        },
      });
    }
  }).as("registerRequest");

  // Visit the page where the registration form exists
  cy.visit("http://localhost:3000/?view=organization-signup");
});

Cypress.Commands.add("completeStepOne", () => {
  cy.contains("Sign In", { matchCase: false }).click();
  cy.get('[data-cy="modal-container"]').should("be.visible");
  cy.get('[data-cy="organization-name"]')
    .should("exist")
    .and("be.visible")
    .type("New Org");
  cy.get('[data-cy="modal-container"]').scrollTo("0%", "60%");
  cy.get('[data-cy="organization-description"]')
    .should("be.visible")
    .type("this will be the description");
  cy.get('[data-cy="organization-industry"]')
    .should("be.visible")
    .select("healthcare");
  cy.get('[data-cy="organization-size"]')
    .should("be.visible")
    .select("11-25 employees");
  cy.get('[data-cy="organization-website"]')
    .scrollIntoView()
    .should("be.visible")
    .type("https://website.in");
  cy.get('[data-cy="to-step-two"]').should("be.visible").click();
  cy.get('[data-cy="modal-container"]').scrollTo("60%", "20%");
});

Cypress.Commands.add("completeStepTwo", () => {
  cy.completeStepOne();
  cy.get('[data-cy="admin-first-name"]')
    .should("exist")
    .and("be.visible")
    .type("satyam");
  cy.get('[data-cy="admin-last-name"]')
    .scrollIntoView()
    .should("be.visible")
    .type("singh");
  cy.get('[data-cy="admin-email"]')
    .scrollIntoView()
    .should("be.visible")
    .type("satyamsinghorg@gmail.com");
  cy.get('[data-cy="admin-password"]').should("be.visible").type("Asgard@123");
  cy.get('[data-cy="admin-confirm-password"]')
    .should("be.visible")
    .type("Asgard@123");
  cy.get('[data-cy="accept-terms"]')
    .should("be.visible")
    .check({ force: true });
  cy.get('[data-cy="subscribe-newsletter"]')
    .should("be.visible")
    .check({ force: true });
});

it("step-one:renders the Org form and all fields correctly", () => {
  cy.contains("Sign In", { matchCase: false }).click();
  cy.get('[data-cy="modal-container"]').should("be.visible");
  cy.get('[data-cy="organization-name"]').should("exist").and("be.visible");
  cy.get('[data-cy="modal-container"]').scrollTo("0%", "60%");
  cy.get('[data-cy="organization-description"]').should("be.visible");
  cy.get('[data-cy="organization-industry"]').should("be.visible");
  cy.get('[data-cy="organization-size"]').should("be.visible");
  cy.get('[data-cy="organization-website"]')
    .scrollIntoView()
    .should("be.visible");
  cy.get('[data-cy="to-step-two"]').should("be.visible");
});

it("step-one:shows browser errors for blank input", () => {
  cy.contains("Sign In", { matchCase: false }).click();
  cy.get('[data-cy="modal-container"]').should("be.visible");
  cy.get('[data-cy="organization-name"]').should("exist").and("be.visible");
  cy.get('[data-cy="modal-container"]').scrollTo("0%", "60%");
  cy.get('[data-cy="organization-description"]').should("be.visible");
  cy.get('[data-cy="organization-industry"]').should("be.visible");
  cy.get('[data-cy="organization-size"]').should("be.visible");
  cy.get('[data-cy="organization-website"]')
    .scrollIntoView()
    .should("be.visible");
  cy.get('[data-cy="to-step-two"]').should("be.visible").click();
  cy.get('[data-cy="modal-container"]').scrollTo("60%", "0%");
  cy.get('[data-cy="organization-name-error"]')
    .should("be.visible")
    .and("contain.text", "Organization name is required");
  cy.get('[data-cy="modal-container"]').scrollTo("0%", "60%");
  cy.get('[data-cy="organization-description-error"]')
    .should("be.visible")
    .and("contain.text", "Organization description is required");
  cy.get('[data-cy="organization-industry-error"]')
    .should("be.visible")
    .and("contain.text", "Please select an industry");
  cy.get('[data-cy="organization-size-error"]')
    .should("be.visible")
    .and("contain.text", "Please select company size");
});

it("step-one:shows browser errors for invalid input", () => {
  cy.contains("Sign In", { matchCase: false }).click();
  cy.get('[data-cy="modal-container"]').should("be.visible");
  cy.get('[data-cy="organization-name"]')
    .should("exist")
    .and("be.visible")
    .type("N");
  cy.get('[data-cy="modal-container"]').scrollTo("0%", "60%");
  cy.get('[data-cy="organization-description"]')
    .should("be.visible")
    .type("Desc");
  cy.get('[data-cy="organization-industry"]')
    .should("be.visible")
    .select("Technology");
  cy.get('[data-cy="organization-size"]')
    .should("be.visible")
    .select("1-10 employees");
  cy.get('[data-cy="organization-website"]')
    .scrollIntoView()
    .should("be.visible")
    .type("invalid-url");
  cy.get('[data-cy="to-step-two"]').should("be.visible").click();
  cy.get('[data-cy="modal-container"]').scrollTo("60%", "0%");
  cy.get('[data-cy="organization-name-error"]')
    .should("be.visible")
    .and(
      "contain.text",
      "Organization name must be at least 2 characters long"
    );
  cy.get('[data-cy="modal-container"]').scrollTo("0%", "60%");
  cy.get('[data-cy="organization-description-error"]')
    .should("be.visible")
    .and("contain.text", "Description must be at least 10 characters long");
  cy.get('[data-cy="organization-website-error"]')
    .should("be.visible")
    .and("contain.text", "Please enter a valid website URL");
});
it("step-one:correct input fields", () => {
  cy.contains("Sign In", { matchCase: false }).click();
  cy.get('[data-cy="modal-container"]').should("be.visible");
  cy.get('[data-cy="organization-name"]')
    .should("exist")
    .and("be.visible")
    .type("New Org");
  cy.get('[data-cy="modal-container"]').scrollTo("0%", "60%");
  cy.get('[data-cy="organization-description"]')
    .should("be.visible")
    .type("This will be a valid description");
  cy.get('[data-cy="organization-industry"]')
    .should("be.visible")
    .select("Technology");
  cy.get('[data-cy="organization-size"]')
    .should("be.visible")
    .select("1-10 employees");
  cy.get('[data-cy="organization-website"]')
    .scrollIntoView()
    .should("be.visible")
    .type("https://validwebsite.com");
  cy.get('[data-cy="to-step-two"]').should("be.visible").click();
  cy.get('[data-cy="modal-container"]').scrollTo("60%", "20%");
});
it("step-two:renders the Org form and all fields correctly", () => {
  cy.completeStepOne();

  cy.get('[data-cy="admin-first-name"]').should("exist").and("be.visible");
  cy.get('[data-cy="admin-last-name"]').scrollIntoView().should("be.visible");
  cy.get('[data-cy="admin-email"]').scrollIntoView().should("be.visible");
  cy.get('[data-cy="admin-password"]').should("be.visible");
  cy.get('[data-cy="admin-confirm-password"]').should("be.visible");
  cy.get('[data-cy="accept-terms"]').should("be.visible");
  cy.get('[data-cy="subscribe-newsletter"]').should("be.visible");
  cy.get('[data-cy="back-to-step-one"]').should("be.visible");
  cy.get('[data-cy="create-organization"]').should("be.visible");
});

it("step-two:shows browser errors for blank input", () => {
  cy.completeStepOne();

  cy.get('[data-cy="admin-first-name"]')
    .should("exist")
    .and("be.visible")
    .type("S");
  cy.get('[data-cy="admin-last-name"]')
    .scrollIntoView()
    .should("be.visible")
    .type("si@");
  cy.get('[data-cy="admin-email"]')
    .scrollIntoView()
    .should("be.visible")
    .type("email@example");
  cy.get('[data-cy="admin-password"]').should("be.visible").type("Asgard@");
  cy.get('[data-cy="admin-confirm-password"]')
    .should("be.visible")
    .type("Asgard@1");
  cy.get('[data-cy="accept-terms"]')
    .should("be.visible")
    .check({ force: true });
  cy.get('[data-cy="subscribe-newsletter"]')
    .should("be.visible")
    .check({ force: true });
  cy.get('[data-cy="back-to-step-one"]').should("be.visible");
  cy.get('[data-cy="create-organization').should("be.visible").click();

  cy.get('[data-cy="modal-container"]').scrollTo("60%", "30%");
  cy.get('[data-cy="admin-first-name-error"]')
    .should("be.visible")
    .and("contain.text", "Name must be at least 2 characters long");
  cy.get('[data-cy="modal-container"]').scrollTo("30%", "70%");
  cy.get('[data-cy="admin-last-name-error"]')
    .should("be.visible")
    .and(
      "contain.text",
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    );
  cy.get('[data-cy="admin-email-error"]')
    .should("be.visible")
    .and("contain.text", "Please enter a valid email address");
  cy.get('[data-cy="admin-password-error"]')
    .should("be.visible")
    .and("contain.text", "Password must be at least 8 characters long");
  cy.get('[data-cy="admin-confirm-password-error"]')
    .should("be.visible")
    .and("contain.text", "Passwords do not match");

  // different errors for first name and last name
  cy.get('[data-cy="modal-container"]').scrollTo("75%", "30%");
  cy.get('[data-cy="admin-first-name"]')
    .should("exist")
    .and("be.visible")
    .clear()
    .type("Saty@");
  cy.get('[data-cy="modal-container"]').scrollTo("30%", "75%");
  cy.get('[data-cy="create-organization"]').click();
  cy.get('[data-cy="modal-container"]').scrollTo("75%", "30%");
  cy.get('[data-cy="admin-first-name-error"]')
    .should("be.visible")
    .and(
      "contain.text",
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    );

  // different errors for password
  cy.get('[data-cy="modal-container"]').scrollTo("30%", "100%");
  cy.get('[data-cy="admin-password"]').clear().type("Asgard1234");
  cy.get('[data-cy="create-organization"]').click();
  cy.get('[data-cy="admin-password-error"]')
    .should("be.visible")
    .and("contain.text", "Password must contain one special character");
  cy.get('[data-cy="admin-password"]').clear().type("asgard@1234");
  cy.get('[data-cy="modal-container"]').scrollTo("50%", "75%");
  cy.get('[data-cy="create-organization"]').click();
  cy.get('[data-cy="admin-password-error"]')
    .should("be.visible")
    .and("contain.text", "Password must contain one uppercase letter");
  cy.get('[data-cy="modal-container"]').scrollTo("75%", "50%");
  cy.get('[data-cy="admin-password"]').clear().type("Asgard@no");
  cy.get('[data-cy="modal-container"]').scrollTo("50%", "75%");
  cy.get('[data-cy="create-organization"]').click();
  cy.get('[data-cy="admin-password-error"]')
    .should("be.visible")
    .and("contain.text", "Password must contain one number");
  cy.get('[data-cy="modal-container"]').scrollTo("75%", "50%");
  cy.get('[data-cy="admin-password"]').clear().type("ASGARD@123");
  cy.get('[data-cy="modal-container"]').scrollTo("50%", "75%");
  cy.get('[data-cy="create-organization"]').click();
  cy.get('[data-cy="admin-password-error"]')
    .should("be.visible")
    .and("contain.text", "Password must contain one lowercase letter");
});

it("step-two:Api failure case", () => {
  cy.completeStepOne();
  cy.get('[data-cy="admin-first-name"]')
    .should("exist")
    .and("be.visible")
    .type("Satyam");
  cy.get('[data-cy="admin-last-name"]')
    .scrollIntoView()
    .should("be.visible")
    .type("singh");
  cy.get('[data-cy="admin-email"]')
    .scrollIntoView()
    .should("be.visible")
    .type("email@example.com");
  cy.get('[data-cy="admin-password"]').should("be.visible").type("Asgard@123");
  cy.get('[data-cy="admin-confirm-password"]')
    .should("be.visible")
    .type("Asgard@123");
  cy.get('[data-cy="accept-terms"]')
    .should("be.visible")
    .check({ force: true });
  cy.get('[data-cy="subscribe-newsletter"]')
    .should("be.visible")
    .check({ force: true });
  cy.get('[data-cy="create-organization').should("be.visible").click();
  cy.wait("@registerRequest").its("response.statusCode").should("eq", 400);
  cy.get('[data-cy="submit-error"]')
    .should("be.visible")
    .and("contain.text", "Invalid registration data");
});

it("Final step:successFull case ", () => {
  cy.completeStepTwo();
  cy.get('[data-cy="create-organization').should("be.visible").click();

  cy.wait("@registerRequest").then((interception) => {
    const body = interception.request.body;

    expect(body).to.deep.include({
      first_name: "satyam",
      last_name: "singh",
      email: "satyamsinghorg@gmail.com",
      password: "Asgard@123",
      userType: "organization_admin",
      organizationData: {
        first_name: "satyam",
        last_name: "singh",
        description: "this will be the description",
        industry: "healthcare",
        size: "11-25",
        website: "https://website.in",
      },
      acceptTerms: true,
      subscribeNewsletter: true,
    });
  });
});
