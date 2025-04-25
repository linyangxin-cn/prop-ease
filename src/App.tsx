
import './App.css';
import { BrowserRouter, Route, Router, Routes } from 'react-router-dom';
import Layout from './components/Layout/inedx';
import { routes } from './routes';

function App() {
  return (
    <BrowserRouter>
      <Layout/>
      <Routes>
        {
          routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={route.element}
            />
          ))
        }
      </Routes>
    </BrowserRouter>
  );
}

export default App;
