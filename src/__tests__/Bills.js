/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from '@testing-library/user-event';
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }));

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe('When I click on NewBill button', () => {
    test('I am navigate to NewBill form', () => {
      document.body.innerHTML = BillsUI(bills[0]);
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const billsPage = new Bills({
        document, onNavigate, store: null, bills, localStorage: window.localStorage
      });

      const newBillButton = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn((e) => billsPage.handleClickNewBill(e, bills[0]));
      newBillButton.addEventListener("click", handleClickNewBill);
      fireEvent.click(newBillButton);
      expect(handleClickNewBill).toHaveBeenCalled();
    })
  })

  describe('When I click on the icon eye', () => {
    test('A modal should open', async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      };

      const billsPage = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      });

      $.fn.modal = jest.fn();
      const eyeButton = screen.getAllByTestId('icon-eye')[0];
      const handleClickIconEye = jest.fn(billsPage.handleClickIconEye(eyeButton));
      eyeButton.addEventListener('click', handleClickIconEye);
      userEvent.click(eyeButton);
      expect(handleClickIconEye).toHaveBeenCalled();

      const modale = screen.getAllByTestId('modaleFile')[0];
      expect(modale).toBeTruthy();
    })
  })

  // TEST API GET
  describe("When I navigate to Bills and try to get all Bills", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    })

    describe("When no error occurs on API", () => {
      test("fetches bills from an API with success", async () => {
        window.onNavigate(ROUTES_PATH.Bills);
        const bills = await mockStore.bills().list();
        const billIsPresent = screen.getAllByText("Hôtel et logement");
        expect(bills.length).toBe(4);
        expect(billIsPresent).toBeTruthy();
      });
    })

    describe("When an error occurs on API", () => {
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }});
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      })

      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"));
            }
          }});

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      })
    })
  })
})
