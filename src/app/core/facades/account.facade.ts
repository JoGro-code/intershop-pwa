import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Subject } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';

import { Address } from 'ish-core/models/address/address.model';
import { Credentials } from 'ish-core/models/credentials/credentials.model';
import { Customer, CustomerRegistrationType, SsoRegistrationType } from 'ish-core/models/customer/customer.model';
import { HttpError } from 'ish-core/models/http-error/http-error.model';
import { PasswordReminderUpdate } from 'ish-core/models/password-reminder-update/password-reminder-update.model';
import { PasswordReminder } from 'ish-core/models/password-reminder/password-reminder.model';
import { PaymentInstrument } from 'ish-core/models/payment-instrument/payment-instrument.model';
import { User } from 'ish-core/models/user/user.model';
import { OrderListQuery } from 'ish-core/services/order/order.service';
import { MessagesPayloadType } from 'ish-core/store/core/messages';
import {
  createCustomerAddress,
  deleteCustomerAddress,
  getAddressesError,
  getAddressesLoading,
  getAllAddresses,
  loadAddresses,
  updateCustomerAddress,
} from 'ish-core/store/customer/addresses';
import { getUserRoles } from 'ish-core/store/customer/authorization';
import {
  firstGDPRDataRequest,
  getDataRequestError,
  getDataRequestLoading,
} from 'ish-core/store/customer/data-requests';
import {
  getOrders,
  getOrdersError,
  getOrdersLoading,
  getSelectedOrder,
  loadOrders,
} from 'ish-core/store/customer/orders';
import {
  cancelRegistration,
  getSsoRegistrationCancelled,
  getSsoRegistrationError,
  getSsoRegistrationRegistered,
  setRegistrationInfo,
} from 'ish-core/store/customer/sso-registration';
import {
  createUser,
  deleteUserPaymentInstrument,
  getCustomerApprovalEmail,
  getLoggedInCustomer,
  getLoggedInUser,
  getPasswordReminderError,
  getPasswordReminderSuccess,
  getPriceDisplayType,
  getUserAuthorized,
  getUserError,
  getUserLoading,
  getUserPaymentMethods,
  isBusinessCustomer,
  loadUserPaymentMethods,
  loginUser,
  loginUserWithToken,
  logoutUser,
  logoutUserSuccess,
  requestPasswordReminder,
  resetPasswordReminder,
  updateCustomer,
  updateUser,
  updateUserPassword,
  updateUserPasswordByPasswordReminder,
  updateUserPreferredPayment,
} from 'ish-core/store/customer/user';
import { whenTruthy } from 'ish-core/utils/operators';

/* eslint-disable @typescript-eslint/member-ordering */
@Injectable({ providedIn: 'root' })
export class AccountFacade {
  /**
   * internal subject so error can only be subscribed to once
   */
  private internalUserError$ = new Subject<HttpError>();

  constructor(private store: Store) {
    store.pipe(select(getUserError)).subscribe(this.internalUserError$);
  }

  // USER

  user$ = this.store.pipe(select(getLoggedInUser));
  userEmail$ = this.user$.pipe(map(user => user?.email));
  userError$ = this.internalUserError$.asObservable();
  userLoading$ = this.store.pipe(select(getUserLoading));
  isLoggedIn$ = this.store.pipe(select(getUserAuthorized));
  roles$ = this.store.pipe(select(getUserRoles));

  loginUser(credentials: Credentials) {
    this.store.dispatch(loginUser({ credentials }));
  }

  loginUserWithToken(token: string) {
    this.store.dispatch(loginUserWithToken({ token }));
  }

  /**
   * Trigger logout action
   *
   * @param revokeToken option to revoke api token on server side before logout success action is dispatched
   */
  logoutUser(options = { revokeApiToken: true }) {
    options?.revokeApiToken ? this.store.dispatch(logoutUser()) : this.store.dispatch(logoutUserSuccess());
  }

  createUser(body: CustomerRegistrationType) {
    this.store.dispatch(createUser(body));
  }

  updateUser(user: User, successMessage?: MessagesPayloadType) {
    this.store.dispatch(updateUser({ user, successMessage }));
  }

  updateUserEmail(user: User, credentials: Credentials) {
    this.store.dispatch(
      updateUser({
        user,
        credentials,
        successMessage: { message: 'account.profile.update_email.message', messageParams: { 0: user.email } },
      })
    );
  }

  updateUserPassword(data: { password: string; currentPassword: string }) {
    this.store.dispatch(updateUserPassword(data));
  }

  updateUserProfile(user: User) {
    this.store.dispatch(updateUser({ user, successMessage: { message: 'account.profile.update_profile.message' } }));
  }

  // CUSTOMER

  customer$ = this.store.pipe(select(getLoggedInCustomer));
  isBusinessCustomer$ = this.store.pipe(select(isBusinessCustomer));
  getCustomerApprovalEmail$ = this.store.pipe(select(getCustomerApprovalEmail));
  userPriceDisplayType$ = this.store.pipe(select(getPriceDisplayType));

  updateCustomerProfile(customer: Customer, message?: MessagesPayloadType) {
    this.store.dispatch(
      updateCustomer({
        customer,
        successMessage: message ? message : { message: 'account.profile.update_profile.message' },
      })
    );
  }

  // PASSWORD

  passwordReminderSuccess$ = this.store.pipe(select(getPasswordReminderSuccess));
  passwordReminderError$ = this.store.pipe(select(getPasswordReminderError));

  resetPasswordReminder() {
    this.store.dispatch(resetPasswordReminder());
  }

  requestPasswordReminder(data: PasswordReminder) {
    this.store.dispatch(requestPasswordReminder({ data }));
  }

  requestPasswordReminderUpdate(data: PasswordReminderUpdate) {
    this.store.dispatch(updateUserPasswordByPasswordReminder(data));
  }

  // ORDERS

  orders$(query?: OrderListQuery) {
    this.store.dispatch(loadOrders({ query: query || { limit: 30 } }));
    return this.store.pipe(select(getOrders));
  }

  selectedOrder$ = this.store.pipe(select(getSelectedOrder));
  ordersLoading$ = this.store.pipe(select(getOrdersLoading));
  ordersError$ = this.store.pipe(select(getOrdersError));

  // PAYMENT

  private eligiblePaymentMethods$ = this.store.pipe(select(getUserPaymentMethods));

  paymentMethods$() {
    this.store.dispatch(loadUserPaymentMethods());
    return this.eligiblePaymentMethods$;
  }

  deletePaymentInstrument(paymentInstrumentId: string, successMessage?: MessagesPayloadType) {
    this.store.dispatch(deleteUserPaymentInstrument({ id: paymentInstrumentId, successMessage }));
  }

  async updateUserPreferredPaymentMethod(
    user: User,
    paymentMethodId: string,
    currentPreferredPaymentInstrument: PaymentInstrument
  ) {
    if (currentPreferredPaymentInstrument && !currentPreferredPaymentInstrument.parameters?.length) {
      this.deletePaymentInstrument(currentPreferredPaymentInstrument.id);
      await new Promise(resolve => setTimeout(resolve, 600)); // prevent server conflicts
    }

    this.store.dispatch(
      updateUserPreferredPayment({
        user,
        paymentMethodId,
        successMessage: {
          message: 'account.payment.payment_created.message',
        },
      })
    );
  }

  async updateUserPreferredPaymentInstrument(
    user: User,
    paymentInstrumentId: string,
    currentPreferredPaymentInstrument: PaymentInstrument
  ) {
    if (currentPreferredPaymentInstrument && !currentPreferredPaymentInstrument.parameters?.length) {
      this.deletePaymentInstrument(currentPreferredPaymentInstrument.id);
      await new Promise(resolve => setTimeout(resolve, 600)); // prevent server conflicts
    }
    this.store.dispatch(
      updateUser({
        user: { ...user, preferredPaymentInstrumentId: paymentInstrumentId },
        successMessage: {
          message: paymentInstrumentId
            ? 'account.payment.payment_created.message'
            : 'account.payment.no_preferred.message',
        },
      })
    );
  }

  // ADDRESSES

  addresses$() {
    return this.user$.pipe(
      whenTruthy(),
      take(1),
      tap(() => this.store.dispatch(loadAddresses())),
      switchMap(() => this.store.pipe(select(getAllAddresses)))
    );
  }
  addressesLoading$ = this.store.pipe(select(getAddressesLoading));
  addressesError$ = this.store.pipe(select(getAddressesError));

  createCustomerAddress(address: Address) {
    this.store.dispatch(createCustomerAddress({ address }));
  }

  deleteCustomerAddress(addressId: string) {
    this.store.dispatch(deleteCustomerAddress({ addressId }));
  }

  updateCustomerAddress(address: Address) {
    this.store.dispatch(updateCustomerAddress({ address }));
  }

  // DATA REQUESTS

  dataRequestLoading$ = this.store.pipe(select(getDataRequestLoading));
  dataRequestError$ = this.store.pipe(select(getDataRequestError));
  // boolean to check wether the GDPR data request is dispatched for the first time
  isFirstGDPRDataRequest$ = this.store.pipe(select(firstGDPRDataRequest));

  // SSO

  ssoRegistrationError$ = this.store.pipe(select(getSsoRegistrationError));
  ssoRegistrationCancelled$ = this.store.pipe(select(getSsoRegistrationCancelled));
  ssoRegistrationRegistered$ = this.store.pipe(select(getSsoRegistrationRegistered));

  cancelRegistration() {
    this.store.dispatch(cancelRegistration());
  }

  setRegistrationInfo(registrationInfo: SsoRegistrationType) {
    this.store.dispatch(setRegistrationInfo(registrationInfo));
  }
}
