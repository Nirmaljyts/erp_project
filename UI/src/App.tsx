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
import LeaveDashboard from "./pages/LeaveDashboard";
import Timesheet from "./pages/Timesheet";
import TimesheetApprovals from "./pages/TimesheetApprovals";
import TimesheetReports from "./pages/TimesheetReports";
import TimesheetDefinitions from "./pages/TimesheetDefinitions";
import { RootState } from "./store/store";

const ALL_ROLES = ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"];

type AppRoute = {
  path: string;
  element: JSX.Element;
  allowedRoles: string[];
};

const privateRoutes: AppRoute[] = [
  {
    path: "/projects",
    element: <Projects />,
    allowedRoles: ["ADMIN", "HR_MANAGER", "MANAGER", "EMPLOYEE"],
  },
  {
    path: "/clients",
    element: <Clients />,
    allowedRoles: ["ADMIN", "HR_MANAGER"],
  },
  { path: "/users", element: <Users />, allowedRoles: ALL_ROLES },
  { path: "/calendar", element: <CalendarPage />, allowedRoles: ALL_ROLES },
  { path: "/leaves", element: <LeaveDashboard />, allowedRoles: ALL_ROLES },
  { path: "/request-leaves", element: <Leaves />, allowedRoles: ALL_ROLES },
  {
    path: "/leave-approvals",
    element: <LeaveApprovals />,
    allowedRoles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER"],
  },
  { path: "/timesheets/my", element: <Timesheet />, allowedRoles: ALL_ROLES },
  {
    path: "/timesheets/approvals",
    element: <TimesheetApprovals />,
    allowedRoles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER"],
  },
  {
    path: "/timesheets/definitions",
    element: <TimesheetDefinitions />,
    allowedRoles: ["ADMIN", "HR_MANAGER"],
  },
  {
    path: "/timesheets/reports",
    element: <TimesheetReports />,
    allowedRoles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER"],
  },
];

const publicRoutes: { path: string; element: JSX.Element }[] = [
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
  { path: "/reset-password", element: <ResetPassword /> },
];

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = useSelector((state: RootState) => state?.auth?.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const token = useSelector((state: RootState) => state?.auth?.token);
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
  if (!allowedRoles.includes(user.role)) return <Navigate to="/404" replace />;

  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        {publicRoutes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<PublicRoute>{element}</PublicRoute>}
          />
        ))}

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />

          {privateRoutes.map(({ path, element, allowedRoles }) => (
            <Route
              key={path}
              path={path}
              element={
                <RoleGuard allowedRoles={allowedRoles}>{element}</RoleGuard>
              }
            />
          ))}
        </Route>

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
