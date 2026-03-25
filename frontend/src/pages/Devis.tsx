import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// The devis form is now a dialog component (DevisDialog).
// This page redirects to home.
export default function Devis() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/"); }, [navigate]);
  return null;
}
