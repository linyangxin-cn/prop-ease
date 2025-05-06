import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/inedx";
import { routes } from "./routes";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {routes.map((route, index) => (
            <Route path={route.path} key={index} element={route.element} />
          ))}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
