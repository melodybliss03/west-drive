import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Vehicules from "./pages/Vehicules";
import VehiculeDetail from "./pages/VehiculeDetail";
import Resultats from "./pages/Resultats";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Inscription from "./pages/Inscription";
import Connexion from "./pages/Connexion";
import Espace from "./pages/Espace";
import Particulier from "./pages/Particulier";
import Entreprise from "./pages/Entreprise";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/vehicules" element={<Vehicules />} />
          <Route path="/vehicules/:id" element={<VehiculeDetail />} />
          <Route path="/resultats" element={<Resultats />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/espace" element={<Espace />} />
          <Route path="/particulier" element={<Particulier />} />
          <Route path="/entreprise" element={<Entreprise />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
