import Home from "./pages/home";
import Login from "./pages/login";
import PropertyDetailWithContext from "./pages/property-detail/PropertyDetailWithContext";
import SignUp from "./pages/sign-up";

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
    element: <PropertyDetailWithContext />,
  },
];
