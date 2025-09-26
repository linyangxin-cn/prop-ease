import Home from "./pages/home";
import Login from "./pages/login";
import PropertyDetail from "./pages/property-detail";
import SignUp from "./pages/sign-up";
import Alerts from "./pages/alerts";
import AlertPageFigma from "./components/AlertPageFigma";
import AlertDebug from "./components/AlertDebug";

export const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
    showMenu: false,
  },
  {
    path: "/sign-up",
    element: <SignUp />,
    showMenu: false,
  },
  {
    path: "/property-detail",
    element: <PropertyDetail />,
  },
  {
    path: "/alerts",
    element: <AlertPageFigma />,
  },
  {
    path: "/alerts/original",
    element: <Alerts />,
  },
  {
    path: "/alerts/debug",
    element: <AlertDebug />,
  },
];
