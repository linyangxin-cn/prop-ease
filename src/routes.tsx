import Home from "./pages/home";
import Login from "./pages/login";

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
];
