// src/externalizacion/ChatWindow.jsx
import { useState, useEffect, useRef } from "react";
import { apiGet, apiPost } from "../lib/api";

export default function ChatWindow({ request, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Obtenemos el ID del usuario actual para saber cuál mensaje es mío
  const currentUserId = Number(localStorage.getItem("userId"));

  const loadMessages = async () => {
    try {
      // Pedimos solo los mensajes de ESTA solicitud
      const data = await apiGet(`/messages/?request_id=${request.id}`);
      setMessages(data);
    } catch (error) {
      console.error("Error cargando chat:", error);
    }
  };

  useEffect(() => {
    loadMessages();
    // Polling simple: actualiza cada 3 segundos para ver mensajes nuevos
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [request.id]);

  // Auto-scroll al fondo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      await apiPost("/messages/", {
        service_request: request.id,
        content: newMessage
      });
      setNewMessage("");
      loadMessages(); // Recargar inmediato
    } catch (error) {
      alert("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Ventana de Chat */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800">Chat del Servicio</h3>
            <p className="text-xs text-slate-500">{request.service_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100">
          {messages.length === 0 && (
            <p className="text-center text-slate-400 text-sm mt-10">
              No hay mensajes aún. ¡Inicia la conversación!
            </p>
          )}
          
          {messages.map((msg) => {
            const isMe = msg.sender === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {!isMe && <p className="text-[10px] font-bold text-indigo-500 mb-0.5">{msg.sender_username}</p>}
                  <p>{msg.content}</p>
                  <p className={`text-[10px] text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <button 
            type="submit" 
            disabled={sending || !newMessage.trim()}
            className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}