import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPostMultipart, apiGet } from "../lib/api";
import AppNavbar from "../components/layout/AppNavbar";
import AppDrawer from "../components/layout/AppDrawer";
import AppFooter from "../components/layout/AppFooter";

export default function OfferForm() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    duration_minutes: "",
    available: true,
    available_hours: [{ from: "", to: "" }],
  });

  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // 👇 Campos de texto normales
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 👇 Manejo dinámico de rangos de horario
  const onTimeChange = (index, field, value) => {
    const updated = [...form.available_hours];
    updated[index][field] = value;
    setForm({ ...form, available_hours: updated });
  };

  const addTimeSlot = () => {
    setForm((f) => ({
      ...f,
      available_hours: [...f.available_hours, { from: "", to: "" }],
    }));
  };

  const removeTimeSlot = (index) => {
    const updated = [...form.available_hours];
    updated.splice(index, 1);
    setForm({ ...form, available_hours: updated });
  };

  // 👇 Manejo de imagen
  const onFileChange = (e) => setImage(e.target.files[0]);

  // 👇 Envío del formulario
  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrMsg("");
    setOkMsg("");

    try {
      const me = await apiGet("/auth/me/");
      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("price", Number(form.price));
      formData.append("duration_minutes", Number(form.duration_minutes));
      formData.append("available", form.available);
      formData.append("owner", me.id);

      // Convertir los horarios a formato string
      form.available_hours.forEach((slot, i) => {
        formData.append(`available_hours[${i}]`, `${slot.from}-${slot.to}`);
      });

      // Si hay imagen, adjuntarla
      if (image) {
        formData.append("image", image);
      }

      await apiPostMultipart("/external-services/", formData);
      setOkMsg("✅ Servicio publicado correctamente.");
      setTimeout(() => navigate("/external"), 1200);
    } catch (err) {
      console.error(err);
      setErrMsg("❌ Error al publicar el servicio. Revisa los datos o tu sesión.");
    } finally {
      setSaving(false);
    }
  }

  const drawerItems = [
    { label: "Marketplace", onClick: () => navigate("/external") },
    { label: "Publicar servicio", onClick: () => navigate("/external/new") },
    { label: "Inventario", onClick: () => navigate("/inventory") },
    { label: "Órdenes", onClick: () => navigate("/dashboard") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppNavbar
        title="Publicar servicio"
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogout={() => {
          localStorage.clear();
          location.href = "/login";
        }}
      />

      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">🛠️ Publicar nuevo servicio</h1>

        {okMsg && <div className="p-3 bg-green-100 text-green-800 rounded mb-3">{okMsg}</div>}
        {errMsg && <div className="p-3 bg-red-100 text-red-800 rounded mb-3">{errMsg}</div>}

        <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow">

          {/* Campos estándar */}
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Servicio de pintura automotriz"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Describe lo que incluye el servicio..."
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <input
              name="category"
              value={form.category}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Mecánica, Electricidad, Pintura"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Precio</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: 25000"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Duración estimada (minutos)</label>
            <input
              type="number"
              name="duration_minutes"
              value={form.duration_minutes}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: 90"
              min="0"
              required
            />
          </div>

          {/* Horarios disponibles */}
          <div>
            <label className="block text-sm font-medium mb-2">Horarios disponibles</label>
            {form.available_hours.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="time"
                  value={slot.from}
                  onChange={(e) => onTimeChange(index, "from", e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                  required
                />
                <span>-</span>
                <input
                  type="time"
                  value={slot.to}
                  onChange={(e) => onTimeChange(index, "to", e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                  required
                />
                {form.available_hours.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTimeSlot}
              className="text-indigo-600 text-sm hover:underline mt-1"
            >
              + Agregar rango horario
            </button>
          </div>

          {/* Imagen del servicio */}
          <div>
            <label className="block text-sm font-medium mb-1">Imagen del servicio</label>
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 
              file:rounded-full file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer hover:file:bg-indigo-700"
            />
          </div>

          {/* Checkbox disponible */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="available"
              checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
            />
            <span className="text-sm text-gray-700">Disponible para contratación</span>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Publicando..." : "Publicar servicio"}
          </button>
        </form>
      </main>

      <AppFooter />
    </div>
  );
}
