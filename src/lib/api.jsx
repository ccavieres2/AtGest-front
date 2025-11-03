// src/lib/api.js

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function authHeaders() {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleExpiredSession() {
  localStorage.removeItem("access");
  alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
  window.location.href = "/";
}

async function request(method, path, data = null, isMultipart = false) {
  const token = localStorage.getItem("access");
  const headers = isMultipart
    ? { ...authHeaders() } // Para multipart, no ponemos 'Content-Type', el navegador lo hace.
    : {
        "Content-Type": "application/json",
        ...authHeaders(),
      };

  const options = { method, headers };

  if (data) {
    options.body = isMultipart ? data : JSON.stringify(data);
  }

  const res = await fetch(`${API_BASE}${path}`, options);

  if (res.status === 401 && token) {
    handleExpiredSession();
    // Lanzamos un error para detener la ejecución de la lógica 'try/catch'
    throw new Error("Sesión expirada."); 
  }

  const contentType = res.headers.get("content-type") || "";
  // Si no hay contenido (ej: DELETE 204), devolvemos un objeto vacío
  if (res.status === 204) {
    return {};
  }
  
  const payload = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const errorMsg =
      (payload && (payload.detail || payload.message)) ||
      (payload && JSON.stringify(payload)) || // Convertir objeto de error a string
      "Error en la solicitud";
    throw new Error(errorMsg);
  }

  return payload;
}

// ✅ Exporta función especial para multipart (Crear)
export const apiPostMultipart = (path, formData) => request("POST", path, formData, true);

// ⭐️ NUEVO: Exporta función especial para multipart (Actualizar) ⭐️
export const apiPatchMultipart = (path, formData) => request("PATCH", path, formData, true);

export const apiGet = (path) => request("GET", path);
export const apiPost = (path, data) => request("POST", path, data);
export const apiPut = (path, data) => request("PUT", path, data);
export const apiDelete = (path) => request("DELETE", path);