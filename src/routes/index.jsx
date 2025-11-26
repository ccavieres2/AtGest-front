// src/routes/index.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PATHS } from "./path";

// Importa las páginas con lazy loading
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const DashBoard = lazy(() => import("../pages/DashBoard"))
const Pay = lazy(() => import("../payments/Pay"))
const Inventory = lazy(() => import("../pages/Inventory"))
const OfferDetail = lazy(() => import("../externalizacion/OfferDetail"));
const Team = lazy(() => import("../pages/teams"));
const Clients = lazy(() => import("../pages/Clients"));
const ClientDetail = lazy(() => import("../pages/ClientDetail"));
const Evaluations = lazy(() => import("../pages/Evaluations"));
const EvaluationForm = lazy(() => import("../pages/EvaluationForm"));
const ExternalMarket = lazy(() => import("../externalizacion/ExternalMarket"));
const OfferForm = lazy(() => import("../externalizacion/OfferForm"));



export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Cargando...</div>}>
        <Routes>
          <Route path={PATHS.home} element={<Home />} />
          <Route path={PATHS.login} element={<Login />} />
          <Route path={PATHS.register} element={<Register />} />
          <Route path={PATHS.dashboard} element={<DashBoard/>}/>
          <Route path={PATHS.pay} element={<Pay/>}/>
          <Route path={PATHS.inventory} element={<Inventory />} />
          <Route path={PATHS.team} element={<Team />} />
          <Route path={PATHS.clients} element={<Clients />} />
          <Route path={PATHS.clientDetail} element={<ClientDetail />} />
          <Route path={PATHS.evaluations} element={<Evaluations />} />
          <Route path={PATHS.evaluationNew} element={<EvaluationForm />} />
          <Route path={PATHS.evaluationDetail} element={<EvaluationForm />} />
          <Route path={PATHS.external} element={<ExternalMarket />} />
          <Route path={PATHS.externalnew} element={<OfferForm />} />
          <Route path={PATHS.externalid} element={<OfferForm />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
