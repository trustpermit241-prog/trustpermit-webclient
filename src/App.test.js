import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages/Login', () => () => <div>Login</div>);
jest.mock('./pages/Register', () => () => <div>Register</div>);
jest.mock('./pages/Verify', () => () => <div>Verify</div>);
jest.mock('./pages/PrintPermit', () => () => <div>PrintPermit</div>);
jest.mock('./pages/PrintClearance', () => () => <div>PrintClearance</div>);
jest.mock('./pages/InspectionReport', () => () => <div>InspectionReport</div>);
jest.mock('./pages/StaffInspectionReport', () => () => <div>StaffInspectionReport</div>);
jest.mock('./pages/SecurityVerification', () => () => <div>SecurityVerification</div>);
jest.mock('./pages/Askhelp', () => () => <div>AskHelp</div>);
jest.mock('./pages/Home', () => () => <div>Home</div>);
jest.mock('./pages/About', () => () => <div>About</div>);
jest.mock('./pages/Contact', () => () => <div>Contact</div>);
jest.mock('./pages/Account', () => () => <div>Account</div>);
jest.mock('./pages/SuperAdmin/AdminDashboard', () => () => <div>AdminDashboard</div>);
jest.mock('./pages/ApproveDocuments', () => () => <div>ApproveDocuments</div>);
jest.mock('./pages/ReleasePermit', () => () => <div>ReleasePermit</div>);
jest.mock('./pages/UpdateInspection', () => () => <div>UpdateInspection</div>);
jest.mock('./pages/Dropdown/ApplicationFormView', () => () => <div>ApplicationFormView</div>);
jest.mock('./pages/Dropdown/PaymentView', () => () => <div>PaymentView</div>);
jest.mock('./pages/Dropdown/UploadedDocumentsView', () => () => <div>UploadedDocumentsView</div>);
jest.mock('./pages/cityhall/StaffDashboard', () => () => <div>StaffDashboard</div>);
jest.mock('./pages/cityhall/Messages', () => () => <div>Messages</div>);

describe('app access control', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/staff/dashboard');
  });

  test('staff users can access the staff dashboard', () => {
    localStorage.setItem('token', 'staff-token');
    localStorage.setItem('role', 'staff');

    render(<App />);

    expect(screen.getByText(/StaffDashboard/i)).toBeInTheDocument();
  });

  test('staff users can access the registered users route', () => {
    localStorage.setItem('token', 'staff-token');
    localStorage.setItem('role', 'staff');
    window.history.pushState({}, '', '/staff/users');

    render(<App />);

    expect(screen.getByText(/StaffDashboard/i)).toBeInTheDocument();
  });
});
