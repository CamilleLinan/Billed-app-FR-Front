/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from '@testing-library/user-event'
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { bills } from "../fixtures/bills.js";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });

  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname, data: bills });
  };

  describe("When I am on NewBill Page", () => {
    test("Then email icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const emailIcon = screen.getByTestId("icon-mail");

      expect(emailIcon.classList.contains("active-icon")).toBeTruthy();
    });
  });

  describe("When I am on NewBill page and I upload a file with an extension other than jpg, jpeg or png", () => {
    test("Then an error message for the file input should be displayed", () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const fileInput = screen.getByLabelText("Justificatif");
      fileInput.addEventListener("change", handleChangeFile);

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(["test"], "test.pdf", {
              type: "application/pdf",
            }),
          ],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("test.pdf");

      expect(alertSpy).toHaveBeenCalledWith("Seuls les fichiers .jpg, .jpeg et .png sont autorisés.");
    
      alertSpy.mockRestore();
    });
  });

  describe("When I am on the NewBill page and I upload a file with a jpg, jpeg or png extension", () => {
    test("Then no error message should be displayed", () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const fileInput = screen.getByLabelText("Justificatif");
      fileInput.addEventListener("change", handleChangeFile);

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(["test"], "test.jpg", {
              type: "image/jpeg",
            }),
          ],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("test.jpg");
    });
  });

  describe("When I have filled in the form correctly and I clicked on submit button", () => {
    test("Then Bills page should be rendered", () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
})
