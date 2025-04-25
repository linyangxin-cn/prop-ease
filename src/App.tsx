import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/inedx";
import { routes } from "./routes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map((route, index) => (
          <Layout key={index}>
            <Route path={route.path} element={route.element} />
          </Layout>
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
