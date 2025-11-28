// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import { PATHS } from "../routes/path";

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setMessage({ type: "error", text: "Las contraseñas no coinciden." });
    }
    if (password.length < 8) {
      return setMessage({ type: "error", text: "La contraseña debe tener al menos 8 caracteres." });
    }

    setLoading(true);
    try {
      await apiPost("/auth/password-reset/confirm/", {
        uid,
        token,
        password
      });
      setMessage({ type: "success", text: "¡Contraseña actualizada! Redirigiendo..." });
      
      setTimeout(() => {
        navigate(PATHS.login);
      }, 2000);

    } catch (error) {
      setMessage({ type: "error", text: "El enlace es inválido o ha expirado." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-6">Nueva Contraseña</h1>

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nueva Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="********"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Contraseña</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="********"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-bold hover:bg-indigo-700 transition-all disabled:opacity-70"
          >
            {loading ? "Guardando..." : "Cambiar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}