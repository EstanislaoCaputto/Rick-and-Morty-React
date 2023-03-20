import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from './App';
import Location from './components/Locations';
import Login from './components/Login';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <h1>Error Página no encontrada</h1>,
  },
  {
    path: "/location",
    element: <Location />,
  },
  {
    path: "/contact",
    element: <h1>Contact</h1>,
  },
  {
    path: "/login",
    element: <Login />,
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
