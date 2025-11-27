// src/lib/pdfGenerator.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateEvaluationPDF = (data) => {
  // data espera: { client, vehicle, items, total, id, date, notes }
  
  const doc = new jsPDF();

  // --- Encabezado ---
  doc.setFontSize(20);
  doc.text("ATGEST - Presupuesto Automotriz", 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`, 14, 30);
  if (data.id) {
    doc.text(`Evaluación #: ${data.id}`, 14, 35);
  }

  // --- Datos del Cliente y Vehículo ---
  doc.setDrawColor(200);
  doc.line(14, 40, 196, 40); // Línea separadora

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Cliente", 14, 48);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nombre: ${data.client?.first_name || ""} ${data.client?.last_name || ""}`, 14, 55);
  doc.text(`RUT: ${data.client?.rut || "—"}`, 14, 60);
  doc.text(`Email: ${data.client?.email || "—"}`, 14, 65);
  doc.text(`Teléfono: ${data.client?.phone || "—"}`, 14, 70);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Vehículo", 110, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Vehículo: ${data.vehicle?.brand || ""} ${data.vehicle?.model || ""}`, 110, 55);
  doc.text(`Patente: ${data.vehicle?.plate || "—"}`, 110, 60);
  doc.text(`Año: ${data.vehicle?.year || "—"}`, 110, 65);
  doc.text(`Color: ${data.vehicle?.color || "—"}`, 110, 70);

  // --- Tabla de Ítems ---
  const tableRows = data.items.map((item, index) => [
    index + 1,
    item.description,
    item.is_approved ? "SÍ" : "NO",
    `$${Number(item.price).toLocaleString("es-CL")}`
  ]);

  autoTable(doc, {
    startY: 80,
    head: [["#", "Descripción / Servicio", "Aprobado", "Precio"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] }, // Color Indigo-600 aprox
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' }
    }
  });

  // --- Totales ---
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Presupuesto: $${data.totalBudget.toLocaleString("es-CL")}`, 196, finalY, { align: "right" });
  
  doc.setTextColor(22, 163, 74); // Verde
  doc.text(`Total Aprobado: $${data.totalApproved.toLocaleString("es-CL")}`, 196, finalY + 7, { align: "right" });
  doc.setTextColor(0, 0, 0); // Reset color

  // --- Notas ---
  if (data.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones:", 14, finalY + 20);
    doc.setFont("helvetica", "normal");
    
    // splitTextToSize corta el texto largo para que no se salga de la hoja
    const splitNotes = doc.splitTextToSize(data.notes, 180);
    doc.text(splitNotes, 14, finalY + 26);
  }

  // --- Pie de página ---
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Documento generado por AtGest.", 105, 290, { align: "center" });

  // Descargar
  doc.save(`Presupuesto_${data.vehicle?.plate || "AtGest"}.pdf`);
};