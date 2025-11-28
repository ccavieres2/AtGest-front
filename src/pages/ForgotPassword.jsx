// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../lib/api";
import { PATHS } from "../routes/path";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Llamamos al endpoint creado
      await apiPost("/auth/password-reset/", { email });
      setMessage({ 
        type: "success", 
        text: "Si el correo es válido y eres dueño, recibirás un enlace en breve." 
      });
    } catch (error) {
      // Aquí capturamos el error 403 si no es dueño
      let errorText = "Error al procesar la solicitud.";
      try {
        const parsed = JSON.parse(error.message);
        errorText = parsed.error || errorText;
      } catch(e) {}
      
      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Recuperar Contraseña</h1>
          <p className="text-sm text-slate-500 mt-2">
            Ingresa tu correo electrónico para recibir las instrucciones.
          </p>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="ejemplo@correo.com"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-bold hover:bg-indigo-700 transition-all disabled:opacity-70"
          >
            {loading ? "Enviando..." : "Enviar Enlace"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to={PATHS.login} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}