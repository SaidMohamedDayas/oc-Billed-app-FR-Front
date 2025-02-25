/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";

jest.mock("../app/Store.js", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a > b ? 1 : -1); // Bills were not sorted from oldest to most recent
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  describe("When I click on the new bill button", () => {
    test("Then it should display the new bill form", () => {
      // Simule la connexion en tant qu'employé
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Simule l'affichage de la page des factures (Bills)
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Vérifie que la page des factures est bien affichée
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();

      // Simule le clic sur le bouton "Nouvelle note de frais"
      const newBillButton = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillButton);

      // Vérifie que le formulaire de nouvelle note de frais est affiché
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });
  describe("When I click on the eye icon of a bill", () => {
    // Common setup function to initialize the environment
    const setupTestEnvironment = () => {
      // Setup initial DOM with BillsUI
      document.body.innerHTML = BillsUI({ data: bills });

      // Simulate the onNavigate function
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Create a Bills instance with necessary arguments
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Select the first eye icon
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];

      // Mock the handleClickIconEye function
      const handleClickIconEye = jest.fn(() =>
        billsInstance.handleClickIconEye(eyeIcon)
      );

      // Attach event listener to the eye icon
      eyeIcon.addEventListener("click", handleClickIconEye);

      return { eyeIcon };
    };

    test("Then the modal should open", () => {
      // Call the common setup function
      const { eyeIcon } = setupTestEnvironment();

      // Mock jQuery's modal function
      $.fn.modal = jest.fn();

      // Simulate clicking on the eye icon
      fireEvent.click(eyeIcon);

      // Verify that the modal is displayed
      expect($.fn.modal).toHaveBeenCalledWith("show");
    });

    test("Then the modal should contain the bill's image with the correct URL", () => {
      // Call the common setup function
      const { eyeIcon } = setupTestEnvironment();

      // Simulate clicking on the eye icon
      fireEvent.click(eyeIcon);

      // Verify that the image in the modal has the correct URL
      const imgInModal = document.querySelector(".modal-body img");
      expect(imgInModal).toBeTruthy();
      expect(imgInModal.getAttribute("src")).toBe(bills[0].fileUrl);
    });
  });
  describe("When I navigate to Bills page", () => {
    test("Then fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "e@e" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
    });
  });

  describe("When an error occurs on API", () => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "e@e",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);

      // Utilise une recherche flexible pour capturer l'erreur
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);

      // Utilise une recherche flexible pour capturer l'erreur
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });

    /*test("Then it fails with 404 error", async () => {
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      expect(await screen.getAllByText("Erreur 404")).toBeTruthy();
    });
    test("Then it fails with 500 error", async () => {
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      expect(await screen.getAllByText("Erreur 500")).toBeTruthy();
    }); */
  });
});
