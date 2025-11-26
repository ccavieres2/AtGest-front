// src/externalizacion/OfferDetail.jsx
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Como el dueño puede editar, lo mandamos directo a la vista de edición
  // que también sirve para ver los datos.
  useEffect(() => {
    navigate(`/externalnew/${id}`); // Ojo: ajusta esto según tus rutas si usas una ruta distinta para editar
  }, [id, navigate]);

  return <div>Redirigiendo...</div>;
}