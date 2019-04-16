import { Registration } from '../pages/account/registration.page';

export function createB2BUserViaREST(user: Partial<Registration>) {
  const customer = {
    name: 'Test Company',
    type: 'SMBCustomer',
    customerNo: new Date().getTime().toString(),
    companyName: 'AgroNet',
    description: 'AgroNet description',
    credentials: {
      name: user.lastName,
      login: user.login,
      password: user.password,
      securityQuestion: 'what was the name of your first pet?',
      securityQuestionAnswer: 'Snoopy',
    },
    address: {
      title: user.title,
      firstName: user.firstName,
      lastName: user.lastName,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      addressLine3: user.addressLine3,
      postalCode: user.postalCode,
      city: user.city,
      phoneHome: user.phoneHome,
      countryCode: user.countryCodeSwitch,
    },
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      customerNo: new Date().getTime().toString(),
      email: user.login,
      login: user.login,
      phoneHome: user.phoneHome,
      title: user.title,
      businessPartnerNo: new Date().getTime().toString(),
      preferredLanguage: 'de_DE',
      defaultAddress: {
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        addressLine3: user.addressLine3,
        postalCode: user.postalCode,
        city: user.city,
        phoneHome: user.phoneHome,
        countryCode: user.countryCodeSwitch,
      },
    },
  };

  cy.request(
    'POST',
    Cypress.env('ICM_BASE_URL') + '/INTERSHOP/rest/WFS/inSPIRED-inTRONICS_Business-Site/-/customers',
    customer
  )
    .its('status')
    .should('equal', 201);
}
