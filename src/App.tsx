import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/inedx";
import { routes } from "./routes";
import AuthWrapper from "./components/AuthWrapper";

function App() {
  return (
    <BrowserRouter>
      <AuthWrapper>
        <Layout>
          <Routes>
            {routes.map((route, index) => (
              <Route path={route.path} key={index} element={route.element} />
            ))}
          </Routes>
        </Layout>
      </AuthWrapper>
    </BrowserRouter>
  );
}

export default App;
