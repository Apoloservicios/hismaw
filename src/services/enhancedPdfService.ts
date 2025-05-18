// src/services/enhancedPdfService.ts
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { OilChange, Lubricentro } from '../types';

// Logo predeterminado en base64 (un simple logo genérico)
const defaultLogoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4wEFBisYW4LrGwAAA9tJREFUeNrt3U9IVFEUx/HvGzVNRfwDpRZZ2SLSQoJolWVEm6y/tHARQZtolWULaVEbdREYLXPRHyjbSJsiFxH9wQiMMrLFgJlZUYtpXLeF5Ixv5r1535s/d+Y9zwcG4XLHd849575774wHIiIiIiIiIiIiIiIiIlIUdUAnMAKMA9+BFDADpIGfwCQwDAwA14HdgK92WVWB9BQQgU1rgTtA1YID6XA4nDZgNAcglq93wINygPENjs42bVkAERGRUgujPMbSCBwH9gC1QBXwCxgDngH9wOfQOueHH3V11K9YQcXixRQl/wW/5PGZpxz+P7+Bc8CzvEYF8NyKAWAAOAt4QDtwN49ebtOHnMboLLwfBV+heobfNbF9xhCwwtOA9OTxgZc8DVaeoXnU5wfv6zDww4MQ8jJPojVuP9RVQM+IxqS+v8DDEBJGrGZWbAe6C7TGDQM1Hobw1JGkBTiRh3WuHejIMj99JFkTcbA3eRWwFbgfwxo3CJx2/I59gG8zQBdwLPj8SXuHBccDOoN9xw1bXtgYkAlP9DzwBJgKJt7pYJcq22QxiNnfpCJa54DXOXz2jxhHxzGbOUUkXuX4fTMOQZxXOPnZb1M4bjPzHIJoVDj52Qsctt8pCMdF9UrEHPLMlheuQGx0CKLLcY3qtVnCUccgHgfnEXH13PJ35sJkEu/DRLzaphnYTf3GZo4tMPcTAz/B58i6Io5o1QJ7g+3YDXaPT38M6xtW77B62czhVk09hptdqRwOFuO+dnqLbSMzX/E04LHl0fPBPshvW57a3KizHnN9pI/SuCbfXcJxxIDNhTozPwJ8KaHTyoklODqgSDcyQyk9jHAUOJZXQhAyHIyOVxZf/ztwkpnTMSd9xhLMkx9+iRyRXo1JZqbUFcvFwKVyeegsxvOi8OZn/y0VBhGRwkd5jKURaAH2YR591mL+Yl4K+IA5fX6GedRmXiOj3L+Sqi3YLIbHxY/FvJPkcAHXuE9Al7ZfREQkPwdxdlx4FXP9eQrzsNwHx7VpHNsOkiGP7Ss7vGCh8YJU2vbXbdhXdnh8eTqXBsIvPRyLwWYTCO+K+GG4a4tMZl5rI4Aw3PXMQZCZl3JERCR2QE4CExFUGbfeaLG3BDaNYb7c7YZNr0GYd4cAbQqkTYGIiIj+6CrWyMv1yF6kU6hDyMqIPq8ioj0k02HkKObVqOkCb7+mMc9XjAbvDonFHuK6hzhmTgF4WdpnWcN8ey6TJ0HMKYBeQPcQERERERERERERERERERERl/wBsSpUZnbkoYYAAAAASUVORK5CYII=';

// Función auxiliar para añadir un logo al PDF
const addLogoToDocument = (
  pdf: any, 
  logoBase64: string,
  fallbackLogo: string | null
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Crear un elemento de imagen HTML
      const img = new Image();
      
      // Establecer el origen con el base64
      img.src = logoBase64.startsWith('data:') ? logoBase64 : `data:image/png;base64,${logoBase64}`;
      
      // Cuando la imagen se cargue, añadirla al PDF
      img.onload = () => {
        try {
          // Crear un canvas temporal para procesar la imagen
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Dibujar la imagen en el canvas
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            
            // Obtener una representación JPEG de la imagen desde el canvas
            const jpegData = canvas.toDataURL('image/jpeg');
            
            // Añadir la imagen al PDF
            pdf.addImage(jpegData, 'JPEG', 15, 30, 40, 25);
            console.log('Logo añadido correctamente');
            resolve(true);
          } else {
            throw new Error('No se pudo obtener el contexto 2D del canvas');
          }
        } catch (renderError) {
          console.error('Error al renderizar logo en canvas:', renderError);
          // Intentar con el logo de respaldo
          if (fallbackLogo) {
            try {
              pdf.addImage(fallbackLogo, 'PNG', 0, 30, 50, 25);
              console.log('Logo de respaldo añadido');
              resolve(true);
            } catch (e) {
              console.error('Error al añadir logo de respaldo:', e);
              resolve(false);
            }
          } else {
            resolve(false);
          }
        }
      };
      
      // Si hay error, usar el logo de respaldo
      img.onerror = () => {
        console.error('Error al cargar la imagen desde base64');
        if (fallbackLogo) {
          try {
            pdf.addImage(fallbackLogo, 'PNG', 0, 30, 50, 25);
            console.log('Logo de respaldo añadido después de error de carga');
            resolve(true);
          } catch (e) {
            console.error('Error al añadir logo de respaldo:', e);
            resolve(false);
          }
        } else {
          resolve(false);
        }
      };
      
      // Por si acaso la imagen nunca se carga, establecer un tiempo de espera
      setTimeout(() => {
        resolve(false);
      }, 3000);
      
    } catch (e) {
      console.error('Error en el proceso de añadir logo:', e);
      resolve(false);
    }
  });
};

// Función para formatear fechas en español
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Función para centrar texto
const drawCenteredText = (pdf: any, text: string, x: number, y: number) => {
  const textWidth = pdf.getTextWidth(text);
  pdf.text(text, x - (textWidth / 2), y);
};

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
📅 *Fecha:* ${formatDate(oilChange.fecha)}
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
📆 ${formatDate(oilChange.fechaProximoCambio)} o
🛣️ ${oilChange.kmProximo.toLocaleString()} km
(lo que ocurra primero)

¡Gracias por confiar en nosotros!
────────────────────
`;
    
    // Crear URL para WhatsApp
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
    // Implementación para exportar a Excel (si se desea)
  },
  
  /**
   * Genera un PDF a partir de un nodo HTML y lo descarga
   * Usando html2canvas para una mejor compatibilidad
   * @param node - Referencia al nodo HTML a convertir en PDF
   * @param filename - Nombre del archivo PDF a descargar
   * @returns Promise que se resuelve cuando se completa la generación del PDF
   */
  generatePDF: async (node: HTMLElement, filename: string): Promise<void> => {
    // Implementación del método generatePDF (si se requiere)
  },

  /**
   * Genera un PDF directamente con jsPDF adaptado al diseño original
   * @param oilChange - Datos del cambio de aceite
   * @param lubricentro - Datos del lubricentro
   * @returns Nombre del archivo generado
   */
  generateDirectPDF: async (oilChange: OilChange, lubricentro: Lubricentro | null): Promise<string> => {
    // Crear nuevo documento PDF
    const pdf = new jsPDF();
    const filename = `cambio-aceite-${oilChange.nroCambio}.pdf`;
    
    // Configuración inicial
    pdf.setFontSize(18);
    
    // Colores - definidos como RGB
    const primaryColor = [46, 125, 50]; // Verde #2E7D32
    const textColor = [51, 51, 51]; // Gris oscuro #333333
    const textLight = [102, 102, 102]; // Gris medio #666666
    
    // Establecer color de texto principal
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Encabezado con bordes
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.line(10, 25, 200, 25); // Línea superior
    
    // Intentar añadir el logo
    if (lubricentro?.logoBase64) {
      try {
        pdf.addImage(lubricentro.logoBase64, 'JPEG', 10, 5, 40, 15);
      } catch (error) {
        console.error('Error al añadir logo:', error);
      }
    } else if (lubricentro?.logoUrl) {
      try {
        pdf.addImage(lubricentro.logoUrl, 'JPEG', 10, 5, 40, 15);
      } catch (error) {
        console.error('Error al añadir logo:', error);
      }
    }
    
    // Nombre de la empresa
    pdf.setFontSize(22);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const companyName = lubricentro?.fantasyName || oilChange.lubricentroNombre || 'Lubricentro';
    pdf.text(companyName, 60, 15);
    
    // Detalles de la empresa
    pdf.setFontSize(11);
    pdf.setTextColor(textLight[0], textLight[1], textLight[2]);
    if (lubricentro?.domicilio) {
      pdf.text(lubricentro.domicilio, 60, 20);
    }
    if (lubricentro?.phone) {
      pdf.text(`Tel: ${lubricentro.phone}`, 60, 24);
    }
    
    // Título del documento
    pdf.setFontSize(14);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.text('COMPROBANTE DE CAMBIO DE ACEITE', 10, 35);
    
    // Número de cambio
    pdf.setFontSize(16);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    // Bordeamos el número de documento
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(160, 30, 40, 10);
    pdf.text(`Nº ${oilChange.nroCambio}`, 165, 37);
    
    // Fecha
    pdf.setFontSize(12);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.text(`Fecha: ${formatDate(oilChange.fecha)}`, 160, 45);
    
    // Sección Cliente
    pdf.setFontSize(14);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Datos del Cliente', 10, 55);
    
    // Línea bajo el título
    pdf.setLineWidth(0.2);
    pdf.line(10, 57, 195, 57);
    
    // Información del cliente
    pdf.setFontSize(12);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    let yPos = 65;
    pdf.text(`Nombre: ${oilChange.nombreCliente}`, 10, yPos);
    if (oilChange.celular) {
      yPos += 7;
      pdf.text(`Teléfono: ${oilChange.celular}`, 10, yPos);
    }
    yPos += 7;
    pdf.text(`Operador: ${oilChange.nombreOperario}`, 120, 65);
    
    // Sección Vehículo
    yPos += 8;
    pdf.setFontSize(14);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Datos del Vehículo', 10, yPos);
    
    // Línea bajo el título
    pdf.setLineWidth(0.2);
    yPos += 2;
    pdf.line(10, yPos, 195, yPos);
    
    // Información del vehículo en grid
    pdf.setFontSize(12);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Columna 1
    yPos += 8;
    pdf.text(`Dominio: ${oilChange.dominioVehiculo}`, 10, yPos);
    yPos += 7;
    pdf.text(`Marca: ${oilChange.marcaVehiculo}`, 10, yPos);
    yPos += 7;
    pdf.text(`Modelo: ${oilChange.modeloVehiculo}`, 10, yPos);
    
    // Columna 2
    pdf.text(`Tipo: ${oilChange.tipoVehiculo}`, 120, yPos - 14);
    if (oilChange.añoVehiculo) {
      pdf.text(`Año: ${oilChange.añoVehiculo}`, 120, yPos - 7);
    }
    pdf.text(`Kilometraje: ${oilChange.kmActuales.toLocaleString()} km`, 120, yPos);
    
    // Sección Servicio
    yPos += 12;
    pdf.setFontSize(14);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Datos del Servicio', 10, yPos);
    
    // Línea bajo el título
    pdf.setLineWidth(0.2);
    yPos += 2;
    pdf.line(10, yPos, 195, yPos);
    
    // Información del servicio
    pdf.setFontSize(12);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Columna 1
    yPos += 8;
    pdf.text(`Aceite: ${oilChange.marcaAceite} ${oilChange.tipoAceite} ${oilChange.sae}`, 10, yPos);
    yPos += 7;
    pdf.text(`Cantidad: ${oilChange.cantidadAceite} Litros`, 10, yPos);
    
    // Columna 2
    pdf.text(`Próximo Cambio Km: ${oilChange.kmProximo.toLocaleString()} km`, 120, yPos - 7);
    pdf.text(`Próximo Cambio Fecha: ${formatDate(oilChange.fechaProximoCambio)}`, 120, yPos);
    
    // Servicios adicionales
    yPos += 12;
    pdf.setFontSize(14);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Filtros y Servicios Adicionales', 10, yPos);
    
    // Línea bajo el título
    pdf.setLineWidth(0.2);
    yPos += 2;
    pdf.line(10, yPos, 195, yPos);
    
    // Grid para servicios
    pdf.setFontSize(11);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Columna 1
    yPos += 8;
    if (oilChange.filtroAceite) {
      pdf.setTextColor(0, 150, 0); // Verde
      pdf.text("✓", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(`Filtro de aceite${oilChange.filtroAceiteNota ? ': ' + oilChange.filtroAceiteNota : ''}`, 15, yPos);
      yPos += 7;
    } else {
      pdf.setTextColor(150, 0, 0); // Rojo
      pdf.text("✗", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("Filtro de aceite", 15, yPos);
      yPos += 7;
    }
    
    if (oilChange.filtroAire) {
      pdf.setTextColor(0, 150, 0);
      pdf.text("✓", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(`Filtro de aire${oilChange.filtroAireNota ? ': ' + oilChange.filtroAireNota : ''}`, 15, yPos);
      yPos += 7;
    } else {
      pdf.setTextColor(150, 0, 0);
      pdf.text("✗", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("Filtro de aire", 15, yPos);
      yPos += 7;
    }
    
    if (oilChange.filtroHabitaculo) {
      pdf.setTextColor(0, 150, 0);
      pdf.text("✓", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(`Filtro de habitáculo${oilChange.filtroHabitaculoNota ? ': ' + oilChange.filtroHabitaculoNota : ''}`, 15, yPos);
      yPos += 7;
    } else {
      pdf.setTextColor(150, 0, 0);
      pdf.text("✗", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("Filtro de habitáculo", 15, yPos);
      yPos += 7;
    }
    
    if (oilChange.filtroCombustible) {
      pdf.setTextColor(0, 150, 0);
      pdf.text("✓", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(`Filtro de combustible${oilChange.filtroCombustibleNota ? ': ' + oilChange.filtroCombustibleNota : ''}`, 15, yPos);
      yPos += 7;
    } else {
      pdf.setTextColor(150, 0, 0);
      pdf.text("✗", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("Filtro de combustible", 15, yPos);
      yPos += 7;
    }
    
    // Columna 2
    let yPosCol2 = yPos - 28;
    
    if (oilChange.aditivo) {
      pdf.setTextColor(0, 150, 0);
      pdf.text("✓", 120, yPosCol2);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(`Aditivo${oilChange.aditivoNota ? ': ' + oilChange.aditivoNota : ''}`, 125, yPosCol2);
      yPosCol2 += 7;
    } else {
      pdf.setTextColor(150, 0, 0);
      pdf.text("✗", 120, yPosCol2);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("Aditivo", 125, yPosCol2);
      yPosCol2 += 7;
    }
    
    if (oilChange.engrase) {
      pdf.setTextColor(0, 150, 0);
      pdf.text("✓", 120, yPosCol2);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(`Engrase${oilChange.engraseNota ? ': ' + oilChange.engraseNota : ''}`, 125, yPosCol2);
      yPosCol2 += 7;
    } else {
      pdf.setTextColor(150, 0, 0);
      pdf.text("✗", 120, yPosCol2);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("Engrase", 125, yPosCol2);
      yPosCol2 += 7;
    }
    
    if (oilChange.refrigerante) {
      pdf.setTextColor(0, 150, 0);
      pdf.text("✓", 120, yPosCol2);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(`Refrigerante${oilChange.refrigeranteNota ? ': ' + oilChange.refrigeranteNota : ''}`, 125, yPosCol2);
      yPosCol2 += 7;
    } else {
      pdf.setTextColor(150, 0, 0);
      pdf.text("✗", 120, yPosCol2);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("Refrigerante", 125, yPosCol2);
      yPosCol2 += 7;
    }
    
    if (oilChange.caja) {
      pdf.setTextColor(0, 150, 0);
      pdf.text("✓", 120, yPosCol2);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(`Caja${oilChange.cajaNota ? ': ' + oilChange.cajaNota : ''}`, 125, yPosCol2);
      yPosCol2 += 7;
    } else {
      pdf.setTextColor(150, 0, 0);
      pdf.text("✗", 120, yPosCol2);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("Caja", 125, yPosCol2);
      yPosCol2 += 7;
    }
    
    // Diferencial
    yPos += 5;
    if (oilChange.diferencial) {
      pdf.setTextColor(0, 150, 0);
      pdf.text("✓", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(`Diferencial${oilChange.diferencialNota ? ': ' + oilChange.diferencialNota : ''}`, 15, yPos);
      yPos += 7;
    } else {
      pdf.setTextColor(150, 0, 0);
      pdf.text("✗", 10, yPos);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text("Diferencial", 15, yPos);
      yPos += 7;
    }
    
    // Observaciones si hay
    if (oilChange.observaciones) {
      yPos += 5;
      pdf.setFontSize(14);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('Observaciones', 10, yPos);
      
      // Línea bajo el título
      pdf.setLineWidth(0.2);
      yPos += 2;
      pdf.line(10, yPos, 195, yPos);
      
      // Texto de observaciones
      pdf.setFontSize(11);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      yPos += 8;
      
      const splitText = pdf.splitTextToSize(oilChange.observaciones, 180);
      pdf.text(splitText, 10, yPos);
      
      yPos += splitText.length * 5; // Ajustar posición Y según cantidad de líneas
    }
    
    // Área de firmas
    yPos = Math.max(yPos + 15, 230); // Asegurar espacio
    
    // Líneas para firmas
    pdf.setDrawColor(100, 100, 100);
    pdf.line(40, yPos, 80, yPos); // Línea firma responsable
    pdf.line(130, yPos, 170, yPos); // Línea firma cliente
    
    // Textos de firmas
    pdf.setFontSize(10);
    pdf.text("Firma del Responsable", 40, yPos + 7);
    pdf.text("Firma del Cliente", 130, yPos + 7);
    
    // Pie de página
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.line(10, 275, 200, 275); // Línea divisoria
    
    pdf.setFontSize(10);
    pdf.setTextColor(textLight[0], textLight[1], textLight[2]);
    
    // Texto del pie de página
    const footerText1 = "Este documento es un comprobante del servicio realizado.";
    pdf.text(footerText1, 105 - (pdf.getTextWidth(footerText1) / 2), 280);
    
    const footerText2 = `Próximo cambio: a los ${oilChange.kmProximo.toLocaleString()} km o el ${formatDate(oilChange.fechaProximoCambio)}, lo que ocurra primero.`;
    pdf.text(footerText2, 105 - (pdf.getTextWidth(footerText2) / 2), 285);
    
    // Información adicional del lubricentro
    if (lubricentro) {
      const year = new Date().getFullYear();
      const copyrightText = `© ${year} ${lubricentro.fantasyName} - Todos los derechos reservados`;
      pdf.text(copyrightText, 105 - (pdf.getTextWidth(copyrightText) / 2), 290);
    }
    
    // Guardar PDF
    pdf.save(filename);
    
    return filename;
  }
};

export default enhancedPdfService;