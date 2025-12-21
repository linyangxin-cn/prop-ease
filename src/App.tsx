import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/inedx";
import { routes } from "./routes";
import AuthWrapper from "./components/AuthWrapper";
import SentryTestButton from "./components/SentryTestButton";

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
        <SentryTestButton />
      </AuthWrapper>
    </BrowserRouter>
  );
}

export default App;
