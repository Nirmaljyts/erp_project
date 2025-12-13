import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Users from "./pages/Users";
import CalendarPage from "./pages/CalendarPage";
import Layout from "./layouts/Layout";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ResetPassword from "./pages/auth/ResetPassword";
import Page404 from "./pages/common/Page404";
import Leaves from "./pages/Leaves";
import LeaveApprovals from "./pages/LeaveApprovals";

import { RootState } from "./store/store";
import LeaveDashboard from "./pages/LeaveDashboard";
import Timesheet from "./pages/Timesheet";
import TimesheetApprovals from "./pages/TimesheetApprovals";
import TimesheetReports from "./pages/TimesheetReports";
import TimesheetDefinitions from "./pages/TimesheetDefinitions";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = useSelector((state: RootState) => state?.auth?.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/" replace />;
  return children;
}

function RoleGuard({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: string[];
}) {
  const user = useSelector((state: RootState) => state?.auth?.user);

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/404" replace />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path="login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        <Route
          path="verify-otp"
          element={
            <PublicRoute>
              <VerifyOtp />
            </PublicRoute>
          }
        />

        <Route
          path="reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* PRIVATE ROUTES */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route
            path="projects"
            element={
              <RoleGuard
                allowedRoles={["ADMIN", "HR_MANAGER", "MANAGER", "EMPLOYEE"]}
              >
                <Projects />
              </RoleGuard>
            }
          />

          <Route
            path="clients"
            element={
              <RoleGuard allowedRoles={["ADMIN", "HR_MANAGER"]}>
                <Clients />
              </RoleGuard>
            }
          />

          <Route
            path="users"
            element={
              <RoleGuard
                allowedRoles={[
                  "ADMIN",
                  "HR_MANAGER",
                  "HR",
                  "MANAGER",
                  "EMPLOYEE",
                ]}
              >
                <Users />
              </RoleGuard>
            }
          />

          <Route
            path="calendar"
            element={
              <RoleGuard
                allowedRoles={[
                  "ADMIN",
                  "HR_MANAGER",
                  "HR",
                  "MANAGER",
                  "EMPLOYEE",
                ]}
              >
                <CalendarPage />
              </RoleGuard>
            }
          />

          <Route
            path="leaves"
            element={
              <RoleGuard
                allowedRoles={[
                  "ADMIN",
                  "HR_MANAGER",
                  "HR",
                  "MANAGER",
                  "EMPLOYEE",
                ]}
              >
                <LeaveDashboard />
              </RoleGuard>
            }
          />

          <Route
            path="request-leaves"
            element={
              <RoleGuard
                allowedRoles={[
                  "ADMIN",
                  "HR_MANAGER",
                  "HR",
                  "MANAGER",
                  "EMPLOYEE",
                ]}
              >
                <Leaves />
              </RoleGuard>
            }
          />

          <Route
            path="leave-approvals"
            element={
              <RoleGuard
                allowedRoles={["ADMIN", "HR_MANAGER", "HR", "MANAGER"]}
              >
                <LeaveApprovals />
              </RoleGuard>
            }
          />

          <Route
            path="/timesheets/my"
            element={
              <RoleGuard
                allowedRoles={[
                  "ADMIN",
                  "HR_MANAGER",
                  "HR",
                  "MANAGER",
                  "EMPLOYEE",
                ]}
              >
                <Timesheet />
              </RoleGuard>
            }
          />

          <Route
            path="/timesheets/approvals"
            element={
              <RoleGuard
                allowedRoles={["ADMIN", "HR_MANAGER", "HR", "MANAGER"]}
              >
                <TimesheetApprovals />
              </RoleGuard>
            }
          />

          <Route
            path="/timesheets/definitions"
            element={
              <RoleGuard allowedRoles={["ADMIN", "HR_MANAGER", "HR"]}>
                <TimesheetDefinitions />
              </RoleGuard>
            }
          />

          <Route
            path="/timesheets/reports"
            element={
              <RoleGuard
                allowedRoles={["ADMIN", "HR_MANAGER", "HR", "MANAGER"]}
              >
                <TimesheetReports />
              </RoleGuard>
            }
          />
        </Route>

        {/* UNKNOWN PAGE 404 */}
        <Route path="/404" element={<Page404 />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
