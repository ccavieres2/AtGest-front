// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PATHS } from "../routes/path";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.username.trim()) return "El nombre de usuario es obligatorio.";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return "Email inválido.";
    if (form.password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (form.password !== form.password_confirm)
      return "Las contraseñas no coinciden. Verifica e inténtalo de nuevo.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    const v = validate();
    if (v) return setErrMsg(v);

    setLoading(true);
    try {
      sessionStorage.setItem("registrationData", JSON.stringify(form));
      setOkMsg("Datos validados. Redirigiendo al pago...");
      
      setTimeout(() => {
        navigate(PATHS.pay || "/pay");
      }, 1000);

    } catch (err) {
      setErrMsg("Error al preparar el pago. Habilita el almacenamiento de sesión.");
      setLoading(false);
    }
  };

  const mismatch =
    form.password && form.password_confirm && form.password !== form.password_confirm;

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      
      {/* --- BOTÓN VOLVER A HOME (ARRIBA A LA IZQUIERDA) --- */}
      <Link 
        to={PATHS.home} 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver al Inicio
      </Link>

      {/* Lado izquierdo */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-blue-500 items-center justify-center p-12">
        <div className="text-white text-center space-y-6 max-w-lg pt-10">
          <div className="mx-auto h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
            A
          </div>
          <h1 className="text-5xl font-extrabold tracking-wide">Atgest</h1>
          <p className="text-lg opacity-90">
            Gestión automotriz moderna para talleres y servicios especializados.
          </p>
          <div className="mx-auto h-64 w-full rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white/80">Imagen / Ilustración (placeholder)</span>
          </div>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 md:p-16 relative">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              A
            </div>
            <span className="text-xl font-bold text-gray-900">Atgest</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Crear cuenta
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Regístrate para comenzar a usar Atgest.
          </p>

          {okMsg && (
            <div className="mb-4 p-3 rounded bg-green-100 text-green-800 text-sm text-center">
              {okMsg}
            </div>
          )}
          {errMsg && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-800 text-sm text-center">
              {errMsg}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Usuario */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="Ej. Juan"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="tucorreo@ejemplo.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  placeholder="********"
                  className={`w-full border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 ${
                    mismatch ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-indigo-400"
                  }`}
                />
                
                {/* --- BOTÓN OJO 1 (Unificado) --- */}
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto p-2 text-gray-500 hover:text-indigo-600 focus:outline-none"
                >
                  {showPwd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres.</p>
            </div>

            {/* Confirmar password */}
            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type={showPwd2 ? "text" : "password"}
                  value={form.password_confirm}
                  onChange={onChange}
                  placeholder="********"
                  className={`w-full border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 ${
                    mismatch ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-indigo-400"
                  }`}
                />
                
                {/* --- BOTÓN OJO 2 (Unificado) --- */}
                <button
                  type="button"
                  onClick={() => setShowPwd2((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto p-2 text-gray-500 hover:text-indigo-600 focus:outline-none"
                >
                  {showPwd2 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              {mismatch && (
                <p className="text-xs text-red-500 mt-1">
                  Las contraseñas no coinciden.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60"
            >
              {loading ? "Validando..." : "Continuar al Pago"}
            </button>

            {/* Enlaces secundarios */}
            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link
                to={PATHS.login}
                className="w-full border border-gray-300 text-gray-700 rounded-lg py-2 font-medium hover:bg-gray-100 text-center"
              >
                Ya tengo cuenta (Ingresar)
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}