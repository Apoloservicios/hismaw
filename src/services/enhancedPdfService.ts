// src/services/enhancedPdfService.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OilChange, Lubricentro } from '../types';
// Nota: En una implementación real, necesitarías instalar estas dependencias
// import QRCode from 'qrcode-generator';
// import { saveAs } from 'file-saver';

/**
 * Servicio mejorado para la generación de PDF y utilidades relacionadas
 */
export const enhancedPdfService = {
  /**
   * Genera un mensaje para compartir en WhatsApp con un formato mejorado y atractivo
   * @param oilChange - Cambio de aceite
   * @param lubricentroName - Nombre del lubricentro
   * @returns Objeto con el mensaje formateado y URLs para compartir
   */
  generateWhatsAppMessage: (oilChange: OilChange, lubricentroName: string): { 
    message: string, 
    whatsappUrl: string, 
    whatsappUrlWithPhone: string | null 
  } => {
    // Crear un mensaje más atractivo con emojis y mejor formato
    const message = `
🔧 *${lubricentroName}* 🔧
────────────────────
*CAMBIO DE ACEITE N°: ${oilChange.nroCambio}*
────────────────────

🚗 *Vehículo:* ${oilChange.marcaVehiculo} ${oilChange.modeloVehiculo}
🔢 *Dominio:* ${oilChange.dominioVehiculo}
👤 *Cliente:* ${oilChange.nombreCliente}
📅 *Fecha:* ${new Date(oilChange.fecha).toLocaleDateString()}
📊 *Kilometraje:* ${oilChange.kmActuales.toLocaleString()} km

🛢️ *Aceite utilizado:*
${oilChange.marcaAceite} ${oilChange.tipoAceite} ${oilChange.sae}
Cantidad: ${oilChange.cantidadAceite} litros

${oilChange.filtroAceite || oilChange.filtroAire || oilChange.filtroHabitaculo || oilChange.filtroCombustible ? '🔄 *Filtros cambiados:*' : ''}
${oilChange.filtroAceite ? '✅ Filtro de aceite' : ''}
${oilChange.filtroAire ? '✅ Filtro de aire' : ''}
${oilChange.filtroHabitaculo ? '✅ Filtro de habitáculo' : ''}
${oilChange.filtroCombustible ? '✅ Filtro de combustible' : ''}

📌 *PRÓXIMO CAMBIO:*
📆 ${new Date(oilChange.fechaProximoCambio).toLocaleDateString()} o
🛣️ ${oilChange.kmProximo.toLocaleString()} km
(lo que ocurra primero)

¡Gracias por confiar en nosotros!
────────────────────
`;
    
    // Crear url para WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // URL con número telefónico si está disponible
    let whatsappUrlWithPhone = null;
    if (oilChange.celular) {
      const phoneNumber = oilChange.celular.replace(/\D/g, '');
      if (phoneNumber) {
        whatsappUrlWithPhone = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      }
    }
    
    return {
      message,
      whatsappUrl,
      whatsappUrlWithPhone
    };
  },
  
  /**
   * Exporta los datos de cambios de aceite a Excel
   * @param oilChanges - Lista de cambios de aceite
   * @param filename - Nombre del archivo a generar
   */
  exportToExcel: (oilChanges: OilChange[], filename: string = 'cambios-aceite'): void => {
    try {
      // Esta función es un placeholder, en una implementación real
      // necesitarías usar una biblioteca como xlsx o exceljs
      
      console.log('Exportando a Excel:', oilChanges);
      alert('Funcionalidad de exportación a Excel estará disponible próximamente');
      
      /* Ejemplo con xlsx:
      import * as XLSX from 'xlsx';
      
      // Preparar datos para Excel
      const workbook = XLSX.utils.book_new();
      
      // Convertir datos a formato de Excel
      const worksheetData = oilChanges.map(change => ({
        'Nº Cambio': change.nroCambio,
        'Fecha': new Date(change.fecha).toLocaleDateString(),
        'Cliente': change.nombreCliente,
        'Dominio': change.dominioVehiculo,
        'Vehículo': `${change.marcaVehiculo} ${change.modeloVehiculo}`,
        'Kilometraje': change.kmActuales,
        'Aceite': `${change.marcaAceite} ${change.tipoAceite} ${change.sae}`,
        'Próximo Cambio': new Date(change.fechaProximoCambio).toLocaleDateString(),
        'Próximo KM': change.kmProximo
      }));
      
      // Crear hoja de cálculo
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Añadir hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Cambios de Aceite');
      
      // Guardar archivo
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      */
      
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel. Por favor, intente nuevamente.');
    }
  },
  /**
   * Genera un PDF a partir de un nodo HTML y lo descarga
   * Usando html2canvas para una mejor compatibilidad
   * @param node - Referencia al nodo HTML a convertir en PDF
   * @param filename - Nombre del archivo PDF a descargar
   * @returns Promise que se resuelve cuando se completa la generación del PDF
   */
  generatePDF: async (node: HTMLElement, filename: string): Promise<void> => {
    if (!node) {
      throw new Error('No se proporcionó un nodo HTML válido');
    }
    
    try {
      // Generar canvas del HTML con configuración optimizada
      const canvas = await html2canvas(node, {
        scale: 2, // Mayor escala para mejor calidad
        useCORS: true, // Para permitir imágenes externas
        logging: false, // Reducir logs de consola
        backgroundColor: '#FFFFFF', // Fondo blanco
        onclone: (document, element) => {
          // Si hay estilos específicos que quieras aplicar al clonar el elemento
          // Por ejemplo, para asegurar que todo el contenido sea visible
          element.style.height = 'auto';
          element.style.overflow = 'visible';
          return element;
        }
      });
      
      // Crear PDF con tamaño A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Obtener dimensiones
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular proporciones
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Agregar imagen al PDF (el contenido renderizado)
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Manejar múltiples páginas si el contenido es muy largo
      if (imgHeight > pageHeight) {
        let remainingHeight = imgHeight;
        let position = 0;
        
        // Primera página ya está agregada, agregar las siguientes
        while (remainingHeight > pageHeight) {
          position -= pageHeight;
          remainingHeight -= pageHeight;
          
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        }
      }
      
      // Descargar PDF
      pdf.save(filename);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    }
  },
  
  /**
   * Genera un código QR para el comprobante de cambio de aceite
   * @param oilChange - Datos del cambio de aceite
   * @param lubricentroName - Nombre del lubricentro
   * @returns string con el data URL del código QR
   */
  generateQRCode: (oilChange: OilChange, lubricentroName: string): string => {
    try {
      // Generar información para el QR
      const qrData = {
        comprobante: oilChange.nroCambio,
        dominio: oilChange.dominioVehiculo,
        fecha: new Date(oilChange.fecha).toLocaleDateString(),
        lubricentro: lubricentroName,
        km: oilChange.kmActuales
      };
      
      // Convertir a JSON para el QR
      const qrDataString = JSON.stringify(qrData);
      
      // En una implementación real, necesitarías usar una biblioteca como qrcode-generator o qrcode
      // Este es un placeholder que simula la generación de un QR
      console.log('Generando QR con datos:', qrDataString);
      
      // Simulamos un data URL de un QR
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    } catch (error) {
      console.error('Error al generar código QR:', error);
      return ''; // Devolver string vacío en caso de error
    }
  },
  
  /**
   * Genera un PDF directamente con jsPDF sin depender de la conversión HTML
   * Utiliza un diseño mejorado con colores y estructura profesional
   * @param oilChange - Datos del cambio de aceite
   * @param lubricentro - Datos del lubricentro
   * @returns nombre del archivo generado
   */
  generateDirectPDF: (oilChange: OilChange, lubricentro: Lubricentro | null): string => {
    const pdf = new jsPDF();
    const filename = `cambio-aceite-${oilChange.nroCambio}.pdf`;
    
    // Formatear fecha
    const formatDate = (date: Date): string => {
      return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      });
    };
    
    // Colores principales
    const primaryColor = [0, 86, 179]; // RGB para #0056b3
    const secondaryColor = [40, 167, 69]; // RGB para #28a745
    const accentColor = [240, 173, 78]; // RGB para #f0ad4e
    
    // Configuración de página
    pdf.setFontSize(18);
    pdf.setTextColor(40, 40, 40);
    
    // Agregar logo si existe
    if (lubricentro && lubricentro.logoUrl) {
      try {
        // En una implementación real, deberías manejar la carga del logo
        // Aquí solo mostramos cómo se podría hacer
        // pdf.addImage(lubricentro.logoUrl, 'JPEG', 150, 15, 40, 30);
      } catch (e) {
        console.error('Error al cargar el logo:', e);
      }
    }
    
    // Cabecera con colores
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(10, 10, 190, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('COMPROBANTE DE CAMBIO DE ACEITE', 105, 20, { align: 'center' });
    
    // Información del lubricentro
    pdf.setFontSize(12);
    pdf.setTextColor(40, 40, 40);
    if (lubricentro) {
      pdf.text(lubricentro.fantasyName, 20, 35);
      pdf.setFontSize(10);
      pdf.text(lubricentro.domicilio, 20, 42);
      pdf.text(`CUIT: ${lubricentro.cuit} - Tel: ${lubricentro.phone}`, 20, 48);
    }
    
    // Destacar número de comprobante
    pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    pdf.rect(130, 30, 70, 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text(`Nº ${oilChange.nroCambio}`, 165, 40, { align: 'center' });
    pdf.setFontSize(11);
    pdf.text(`Fecha: ${formatDate(oilChange.fecha)}`, 165, 47, { align: 'center' });
    
    // Dominio del vehículo en grande
    pdf.setFillColor(240, 240, 240);
    pdf.rect(10, 60, 190, 20, 'F');
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(oilChange.dominioVehiculo, 105, 73, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    
    // Sección de datos del vehículo
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(10, 90, 90, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text('Detalles del Vehículo', 55, 97, { align: 'center' });
    
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(10, 100, 90, 60);
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    
    // Datos del vehículo
    let yPos = 110;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Marca:', 15, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.text(oilChange.marcaVehiculo, 50, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Modelo:', 15, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.text(oilChange.modeloVehiculo, 50, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Año:', 15, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.text(oilChange.añoVehiculo?.toString() || 'No especificado', 50, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Tipo:', 15, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.text(oilChange.tipoVehiculo, 50, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Kilometraje:', 15, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${oilChange.kmActuales.toLocaleString()} km`, 50, yPos);
    
    // Sección de Alertas (servicios)
    pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.rect(110, 90, 90, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text('Datos del Servicio', 155, 97, { align: 'center' });
    
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(110, 100, 90, 60);
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    
    // Datos del servicio
    yPos = 110;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Cliente:', 115, yPos);
    pdf.setFont('helvetica', 'bold');
    const clientName = oilChange.nombreCliente.length > 20 
      ? oilChange.nombreCliente.substring(0, 17) + '...' 
      : oilChange.nombreCliente;
    pdf.text(clientName, 145, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Operario:', 115, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.text(oilChange.nombreOperario, 145, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Aceite:', 115, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${oilChange.marcaAceite} ${oilChange.sae}`, 145, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Cant.:', 115, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${oilChange.cantidadAceite} litros`, 145, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Próx. cambio:', 115, yPos);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatDate(oilChange.fechaProximoCambio), 145, yPos);
    
    // Servicios adicionales
    pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    pdf.rect(10, 170, 190, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text('Filtros y Servicios Adicionales', 105, 177, { align: 'center' });
    
    // Área para servicios
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(252, 252, 252);
    pdf.rect(10, 180, 190, 50, 'FD');
    
    // Mostrar servicios en forma de lista con íconos de check
    yPos = 190;
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    
    // Columna izquierda de servicios
    let xPosCol1 = 15;
    let xPosCol2 = 105;
    
    // Función para dibujar un círculo pequeño como check
    const drawCheckCircle = (x: number, y: number, filled: boolean) => {
      if (filled) {
        pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        pdf.circle(x, y, 2, 'F');
      } else {
        pdf.setDrawColor(150, 150, 150);
        pdf.circle(x, y, 2, 'S');
      }
    };
    
    // Filtros - primera columna
    drawCheckCircle(xPosCol1, yPos-2, oilChange.filtroAceite);
    pdf.text('Filtro de Aceite', xPosCol1 + 5, yPos);
    
    drawCheckCircle(xPosCol2, yPos-2, oilChange.filtroHabitaculo);
    pdf.text('Filtro de Habitáculo', xPosCol2 + 5, yPos);
    
    yPos += 10;
    drawCheckCircle(xPosCol1, yPos-2, oilChange.filtroAire);
    pdf.text('Filtro de Aire', xPosCol1 + 5, yPos);
    
    drawCheckCircle(xPosCol2, yPos-2, oilChange.filtroCombustible);
    pdf.text('Filtro de Combustible', xPosCol2 + 5, yPos);
    
    // Aditivos y servicios - segunda fila
    yPos += 10;
    drawCheckCircle(xPosCol1, yPos-2, oilChange.aditivo);
    pdf.text('Aditivo', xPosCol1 + 5, yPos);
    
    drawCheckCircle(xPosCol2, yPos-2, oilChange.refrigerante);
    pdf.text('Refrigerante', xPosCol2 + 5, yPos);
    
    // Servicios adicionales - tercera fila
    yPos += 10;
    drawCheckCircle(xPosCol1, yPos-2, oilChange.diferencial);
    pdf.text('Diferencial', xPosCol1 + 5, yPos);
    
    drawCheckCircle(xPosCol2, yPos-2, oilChange.caja);
    pdf.text('Caja', xPosCol2 + 5, yPos);
    
    // Engrase - cuarta fila
    yPos += 10;
    drawCheckCircle(xPosCol1, yPos-2, oilChange.engrase);
    pdf.text('Engrase', xPosCol1 + 5, yPos);
    
    // Observaciones si existen
    if (oilChange.observaciones) {
      yPos = 240;
      pdf.setFillColor(100, 100, 100);
      pdf.rect(10, yPos, 190, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Observaciones', 105, yPos + 7, { align: 'center' });
      
      // Área para observaciones
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(252, 252, 252);
      pdf.rect(10, yPos + 10, 190, 30, 'FD');
      
      // Texto de observaciones
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(9);
      
      // Dividir observaciones en múltiples líneas
      const textLines = pdf.splitTextToSize(oilChange.observaciones, 180);
      pdf.text(textLines, 15, yPos + 20);
    }
    
    // Pie de página
    const footerY = 280;
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.line(10, footerY - 5, 200, footerY - 5);
    
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Este documento no es válido como factura.', 105, footerY, { align: 'center' });
    pdf.text(`Próximo cambio: a los ${oilChange.kmProximo.toLocaleString()} km o el ${formatDate(oilChange.fechaProximoCambio)}, lo que ocurra primero.`, 105, footerY + 5, { align: 'center' });
    
    if (lubricentro) {
      pdf.text(`${lubricentro.fantasyName} - ${lubricentro.domicilio} - Tel: ${lubricentro.phone}`, 105, footerY + 10, { align: 'center' });
    }
    
    // Guardar PDF
    pdf.save(filename);
    
    return filename;
   
} // Cierre de la función generateDirectPDF
}; // Cierre del objeto enhancedPdfService

export default enhancedPdfService;
 