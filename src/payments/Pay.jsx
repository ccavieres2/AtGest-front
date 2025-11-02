// src/pages/Pay.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { PATHS } from "../routes/path";
import { apiPost } from "../lib/api"; // 👈 Importamos apiPost

export default function Pay() {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  
  const [banner, setBanner] = useState(null); // {type: 'success'|'error'|'info', text: string}
  const [registrationData, setRegistrationData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // Para deshabilitar botones

  // 1. Al cargar, lee los datos de registro desde la sesión
  useEffect(() => {
    const dataString = sessionStorage.getItem("registrationData");
    if (dataString) {
      setRegistrationData(JSON.parse(dataString));
    } else {
      // Si no hay datos, no deberían estar aquí. Los mandamos de vuelta.
      alert("Error: No se encontraron datos de registro. Serás redirigido.");
      navigate(PATHS.register);
    }
  }, [navigate]);


  const initialOptions = {
    "client-id": clientId,
    currency: "USD", // PayPal sandbox funciona perfecto en USD
    intent: "capture",
  };

  // helper para mostrar banner y redirigir (opcionalmente)
  const notify = (type, text, redirectTo = null, delayMs = 3000) => {
    setBanner({ type, text });
    if (redirectTo) {
      setTimeout(() => navigate(redirectTo), delayMs);
    }
  };

  // 2. createOrder (CLIENTE)
  // Esto no cambia, solo crea la orden en PayPal
  const createOrder = (_, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: { value: "10.00" }, // <-- El monto de registro
          description: "Suscripción inicial Atgest",
        },
      ],
    });
  }

  // 3. onApprove (SERVIDOR)
  // Se dispara cuando el usuario aprueba en el popup de PayPal
  const onApprove = async (data, actions) => {
    setIsProcessing(true); // Deshabilita botones
    notify("info", "Procesando pago... No cierres esta ventana.", null);

    try {
      // 'data.orderID' es el ID de la transacción de PayPal
      const payload = {
        paypal_order_id: data.orderID,
        user_data: registrationData, // Los datos del formulario de registro
      };

      // 4. Llamamos a NUESTRO backend para que capture el pago Y registre al usuario
      const response = await apiPost("/register-and-pay/", payload);

      // 5. ¡Éxito! El backend creó al usuario y confirmó el pago.
      sessionStorage.removeItem("registrationData"); // Limpiamos la sesión
      notify(
        "success",
        `Pago y registro exitosos 🎉 ¡Bienvenido, ${response.username}! Serás redirigido...`,
        PATHS.login, // Redirigimos a Login
        4000
      );

    } catch (err) {
      // 6. Manejo de errores (muy importante)
      console.error(err);
      let errorMsg = "Ocurrió un error al confirmar el pago.";
      
      if (err.message) {
          try {
              // Intentamos leer el error JSON que envía el backend
              const parsedError = JSON.parse(err.message);
              
              if (parsedError.details && (parsedError.details.username || parsedError.details.email)) {
                  errorMsg = `El pago fue exitoso, pero el usuario o email ya existen. Serás redirigido al registro.`;
                  // Lo mandamos de vuelta a registro
                  setTimeout(() => navigate(PATHS.register), 5000);
              
              } else if (parsedError.details) {
                  errorMsg = `Error: ${JSON.stringify(parsedError.details)}`;
              } else {
                  errorMsg = parsedError.error || "Error al procesar el pago.";
              }
          } catch(e) {
              errorMsg = err.message; // No era un error JSON
          }
      }
      
      notify("error", errorMsg, null); // Mostramos el error
      setIsProcessing(false); // Reactivamos los botones
    }
  };

  // Si aún no cargan los datos de la sesión, muestra "Cargando..."
  if (!registrationData) {
    return <div className="min-h-screen grid place-items-center p-8 bg-gray-50">Cargando datos de registro...</div>;
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      {/* Banner superior */}
      {banner && (
        <div className="fixed top-3 inset-x-0 z-50 flex justify-center px-4">
          <div
            className={`max-w-xl w-full rounded-lg px-4 py-3 text-sm shadow ${
              banner.type === "success"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : banner.type === "error"
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-sky-100 text-sky-800 border border-sky-200"
            }`}
          >
            {banner.text}
          </div>
        </div>
      )}

      <div className="min-h-screen grid place-items-center p-8 bg-gray-50">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          
          <h1 className="text-xl font-semibold mb-2">Completar registro</h1>
          <p className="text-sm text-gray-600 mb-4">
            Estás registrando la cuenta: <strong className="text-indigo-600">{registrationData.username}</strong>
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Costo de suscripción: <strong className="text-indigo-600">$10.00 USD</strong>
          </p>
          
          {/* Mostramos los botones o un mensaje de "Procesando" */}
          {isProcessing ? (
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-indigo-600">Procesando...</p>
              <p className="text-sm">Por favor espera, estamos confirmando tu pago y creando tu cuenta.</p>
            </div>
          ) : (
            <PayPalButtons
              style={{ layout: "vertical" }}
              createOrder={createOrder}
              onApprove={onApprove}
              onCancel={() => {
                notify("info", "Registro cancelado. Puedes volver a intentarlo.");
              }}
              onError={(err) => {
                console.error("PayPal error:", err);
                notify("error", "Error de PayPal. Recarga la página e intenta nuevamente.");
              }}
            />
          )}

          <button 
            onClick={() => navigate(PATHS.register)} 
            className="w-full text-center text-sm text-gray-500 hover:text-indigo-600 mt-4"
            disabled={isProcessing}
          >
            Volver al registro
          </button>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}