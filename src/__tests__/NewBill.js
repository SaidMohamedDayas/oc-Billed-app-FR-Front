/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import store from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage";

// Mock alert function
window.alert = jest.fn();

describe("Given I am connected as an employee", () => {
  describe("When I submit the form on NewBill Page", () => {
    beforeEach(() => {
      // Mock the localStorage with a valid user
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ email: "test@example.com" })
      ),
        // Mock the store
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
    });

    test("Then submit the form if the file type is authorised.", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store, // Use the mocked store
        localStorage: localStorageMock,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);
      const newFile = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(file, "files", {
        value: [newFile],
      });
      const changeFile = new Event("change");
      file.dispatchEvent(changeFile);
      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.files[0].name).toBe("test.png");
      // Expect the file input to be reset
      expect(file.value).toBe("");

      // Expect `isFileValid` to be false
      expect(newBill.isFileValid).toBe(false);
    });

    test("Then if the file is invalid, an alert should be shown and updateBill should not be called", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn(); // Mock the onNavigate function
      const newBill = new NewBill({
        document,
        onNavigate,
        store, // Use the mocked store
        localStorage: window.localStorage,
      });

      newBill.updateBill = jest.fn(); // Mock updateBill function
      newBill.isFileValid = false; // Simulate an invalid file

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      // Simulate form submission
      fireEvent.submit(form);

      // Expect the alert to be called
      expect(window.alert).toHaveBeenCalledWith(
        "Le fichier n'est pas valide. Veuillez télécharger un fichier jpg, jpeg ou png"
      );

      // Ensure that updateBill is NOT called
      expect(newBill.updateBill).not.toHaveBeenCalled();

      // Ensure that onNavigate is NOT called
      expect(onNavigate).not.toHaveBeenCalled();
    });

    test("Then if the file is valid, the bill object should be created with correct values", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn(); // Mock the onNavigate function
      const newBill = new NewBill({
        document,
        onNavigate,
        store, // Use the mocked store
        localStorage: window.localStorage,
      });

      newBill.updateBill = jest.fn(); // Mock updateBill function
      newBill.isFileValid = true; // Simulate a valid file
      newBill.fileUrl = "https://localhost:3456/images/test.jpg"; // Simulate the file URL
      newBill.fileName = "test.jpg"; // Simulate the file name

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      // Fill out the form fields
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transports" },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Taxi" },
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "100" },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2023-09-12" },
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: "20" },
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: "20" },
      });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: "Business trip" },
      });

      // Simulate form submission
      fireEvent.submit(form);

      // Expect the form submission to be handled
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
  test("Then it fails with 404 error", async () => {
    const html = BillsUI({ error: "Erreur 404" });
    document.body.innerHTML = html;
    expect(await screen.getAllByText("Erreur 404")).toBeTruthy();
  });
  test("Then it fails with 500 error", async () => {
    const html = BillsUI({ error: "Erreur 500" });
    document.body.innerHTML = html;
    expect(await screen.getAllByText("Erreur 500")).toBeTruthy();
  });
});
