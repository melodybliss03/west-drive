import { useContext } from "react";
import { LanguageContext } from "./LanguageContext";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext as never);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
