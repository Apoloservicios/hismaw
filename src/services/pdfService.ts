// src/services/pdfService.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OilChange, Lubricentro } from '../types';

/**
 * Servicio para la generación de PDF y utilidades relacionadas
 */
export const pdfService = {
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
   * Genera un PDF directamente con jsPDF sin depender de la conversión HTML
   * Útil como respaldo si el método principal falla
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
    
    // Configuración de página
    pdf.setFontSize(18);
    pdf.setTextColor(40, 40, 40);
    
    // Título y encabezado
    pdf.text('COMPROBANTE DE CAMBIO DE ACEITE', 105, 20, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text(`Nº ${oilChange.nroCambio}`, 105, 30, { align: 'center' });
    
    // Información del lubricentro
    if (lubricentro) {
      pdf.setFontSize(12);
      pdf.text(lubricentro.fantasyName, 105, 40, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(lubricentro.domicilio, 105, 45, { align: 'center' });
      pdf.text(`CUIT: ${lubricentro.cuit} - Tel: ${lubricentro.phone}`, 105, 50, { align: 'center' });
    }
    
    // Línea separadora
    pdf.line(20, 55, 190, 55);
    
    // Datos del cliente
    pdf.setFontSize(12);
    pdf.text('Datos del Cliente', 20, 65);
    pdf.setFontSize(10);
    pdf.text(`Cliente: ${oilChange.nombreCliente}`, 20, 75);
    if (oilChange.celular) {
      pdf.text(`Teléfono: ${oilChange.celular}`, 20, 80);
    }
    pdf.text(`Operario: ${oilChange.nombreOperario}`, 120, 75);
    
    // Datos del vehículo
    pdf.setFontSize(12);
    pdf.text('Datos del Vehículo', 20, 90);
    pdf.setFontSize(10);
    pdf.text(`Dominio: ${oilChange.dominioVehiculo}`, 20, 100);
    pdf.text(`Marca: ${oilChange.marcaVehiculo}`, 20, 105);
    pdf.text(`Modelo: ${oilChange.modeloVehiculo}`, 20, 110);
    pdf.text(`Tipo: ${oilChange.tipoVehiculo}`, 120, 100);
    if (oilChange.añoVehiculo) {
      pdf.text(`Año: ${oilChange.añoVehiculo}`, 120, 105);
    }
    pdf.text(`Kilometraje: ${oilChange.kmActuales.toLocaleString()} km`, 120, 110);
    
    // Datos del servicio
    pdf.setFontSize(12);
    pdf.text('Datos del Servicio', 20, 125);
    pdf.setFontSize(10);
    pdf.text(`Aceite: ${oilChange.marcaAceite} ${oilChange.tipoAceite} ${oilChange.sae}`, 20, 135);
    pdf.text(`Cantidad: ${oilChange.cantidadAceite} litros`, 20, 140);
    pdf.text(`Próximo cambio: ${oilChange.kmProximo.toLocaleString()} km`, 120, 135);
    pdf.text(`Fecha próx. cambio: ${formatDate(oilChange.fechaProximoCambio)}`, 120, 140);
    
    // Filtros y servicios adicionales
    pdf.setFontSize(12);
    pdf.text('Filtros y Servicios Adicionales', 20, 155);
    pdf.setFontSize(10);
    
    let yPos = 165;
    let rightColumn = false;
    
    // Lista de servicios
    const services = [
      { name: 'Filtro de Aceite', value: oilChange.filtroAceite, note: oilChange.filtroAceiteNota },
      { name: 'Filtro de Aire', value: oilChange.filtroAire, note: oilChange.filtroAireNota },
      { name: 'Filtro de Habitáculo', value: oilChange.filtroHabitaculo, note: oilChange.filtroHabitaculoNota },
      { name: 'Filtro de Combustible', value: oilChange.filtroCombustible, note: oilChange.filtroCombustibleNota },
      { name: 'Aditivo', value: oilChange.aditivo, note: oilChange.aditivoNota },
      { name: 'Refrigerante', value: oilChange.refrigerante, note: oilChange.refrigeranteNota },
      { name: 'Diferencial', value: oilChange.diferencial, note: oilChange.diferencialNota },
      { name: 'Caja', value: oilChange.caja, note: oilChange.cajaNota },
      { name: 'Engrase', value: oilChange.engrase, note: oilChange.engraseNota }
    ];
    
    services.forEach((service) => {
      if (service.value) {
        const xPos = rightColumn ? 120 : 20;
        pdf.text(`${service.name}: Sí${service.note ? ` (${service.note})` : ''}`, xPos, yPos);
        
        if (rightColumn) {
          yPos += 5;
          rightColumn = false;
        } else {
          rightColumn = true;
        }
      }
    });
    
    // Observaciones
    if (oilChange.observaciones) {
      yPos += 15;
      pdf.setFontSize(12);
      pdf.text('Observaciones', 20, yPos);
      pdf.setFontSize(10);
      yPos += 10;
      
      // Dividir texto largo en múltiples líneas
      const splitText = pdf.splitTextToSize(oilChange.observaciones, 170);
      pdf.text(splitText, 20, yPos);
    }
    
    // Pie de página
    pdf.setFontSize(8);
    pdf.text('Este documento no es válido como factura.', 105, 280, { align: 'center' });
    pdf.text(`Próximo cambio: a los ${oilChange.kmProximo.toLocaleString()} km o el ${formatDate(oilChange.fechaProximoCambio)}, lo que ocurra primero.`, 105, 285, { align: 'center' });
    
    // Guardar PDF
    pdf.save(filename);
    
    return filename;
  },
  
  /**
   * Genera un mensaje para compartir en WhatsApp
   * @param oilChange - Cambio de aceite
   * @param lubricentroName - Nombre del lubricentro
   * @returns Objeto con el mensaje formateado y URLs para compartir
   */
  generateWhatsAppMessage: (oilChange: OilChange, lubricentroName: string): { 
    message: string, 
    whatsappUrl: string, 
    whatsappUrlWithPhone: string | null 
  } => {
    const message = `
*${lubricentroName}*
*Constancia de Cambio de Aceite*
*N°:* ${oilChange.nroCambio}

*Cliente:* ${oilChange.nombreCliente}
*Vehículo:* ${oilChange.marcaVehiculo} ${oilChange.modeloVehiculo} - ${oilChange.dominioVehiculo}
*Km:* ${oilChange.kmActuales.toLocaleString()}
*Aceite:* ${oilChange.marcaAceite} ${oilChange.tipoAceite} ${oilChange.sae}

*Próximo cambio:* ${oilChange.kmProximo.toLocaleString()} km o ${new Date(oilChange.fechaProximoCambio).toLocaleDateString()}

Gracias por confiar en nosotros!
    `;
    
    // Crear URLs para WhatsApp
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
  }
};

export default pdfService;