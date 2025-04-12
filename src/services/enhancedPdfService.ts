// src/services/enhancedPdfService.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OilChange, Lubricentro } from '../types';
import QRCode from 'qrcode';
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
            
            // Añadir la imagen al PDF      x    y
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
      // Esperar un momento para que todas las imágenes se carguen
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generar canvas del HTML con configuración optimizada
      const canvas = await html2canvas(node, {
        scale: 2, // Mayor escala para mejor calidad
        useCORS: true, // Para permitir imágenes externas
        allowTaint: true, // Permitir imágenes de otros dominios
        foreignObjectRendering: false, // Más compatible
        logging: false, // Reducir logs de consola
        backgroundColor: '#FFFFFF' // Fondo blanco
      });
      
      // Crear PDF con tamaño A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Obtener dimensiones
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
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
  
  
  /**
   * Genera un PDF directamente con jsPDF sin depender de la conversión HTML
   * Utiliza un diseño mejorado con colores y estructura profesional
   * @param oilChange - Datos del cambio de aceite
   * @param lubricentro - Datos del lubricentro
   * @returns nombre del archivo generado
   */
 // src/services/enhancedPdfService.ts
// Modificar la función generateDirectPDF para añadir las mejoras solicitadas

generateDirectPDF: async (oilChange: OilChange, lubricentro: Lubricentro | null): Promise<string> => {
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
  
  // Intentar añadir el logo
  if (lubricentro?.logoBase64) {
    await addLogoToDocument(pdf, lubricentro.logoBase64, defaultLogoBase64);
  } else if (lubricentro?.logoUrl) {
    await addLogoToDocument(pdf, lubricentro.logoUrl, defaultLogoBase64);
  } else {
    await addLogoToDocument(pdf, defaultLogoBase64, null);
  }
  
  // Cabecera con colores
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(10, 10, 190, 15, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.text('COMPROBANTE DE CAMBIO DE ACEITE', 105, 20, { align: 'center' });
  
  // Información del lubricentro
  pdf.setFontSize(12);
  pdf.setTextColor(50, 40, 40);
  if (lubricentro) {
    pdf.text(lubricentro.fantasyName, 70, 35);
    pdf.setFontSize(10);
    pdf.text(lubricentro.domicilio, 70, 42);
    pdf.text(`CUIT: ${lubricentro.cuit} - Tel: ${lubricentro.phone}`, 70, 48);
  }
  
  // Destacar número de comprobante
  pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  pdf.rect(150, 30, 45, 20, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.text(`Nº ${oilChange.nroCambio}`, 172, 40, { align: 'center' });
  pdf.setFontSize(11);
  pdf.text(`Fecha: ${formatDate(oilChange.fecha)}`, 172, 47, { align: 'center' });
  
  
 
  // Sección de datos del vehículo - AJUSTADA PARA SUBIR (antes estaba en Y=90)
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(10, 60, 90, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text('Detalles del Vehículo', 55, 67, { align: 'center' });
  
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(10, 70, 90, 60);
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(10);
  
  // Datos del vehículo
  let yPos = 80;
  
  // Dominio (ahora RESALTADO)
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos-7, 80, 12, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.text('Dominio:', 15, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.text(oilChange.dominioVehiculo, 50, yPos);

  yPos += 12; // Aumentamos un poco más el espaciado para el dominio resaltado
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
  
  // Sección de datos del servicio - AJUSTADA PARA SUBIR (antes estaba en Y=90)
  pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  pdf.rect(110, 60, 90, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text('Datos del Servicio', 155, 67, { align: 'center' });
  
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(110, 70, 90, 60);
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(10);
  
  // Datos del servicio
  yPos = 80;
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
  
  yPos += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Próx. Km:', 115, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${oilChange.kmProximo.toLocaleString()} km`, 145, yPos);
  
  // Servicios adicionales - AJUSTADOS PARA SUBIR (antes estaba en Y=170)
  pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  pdf.rect(10, 140, 190, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text('Filtros y Servicios Adicionales', 105, 147, { align: 'center' });
  
  // Área para servicios
  pdf.setDrawColor(200, 200, 200);
  pdf.setFillColor(252, 252, 252);
  
  // Hacemos el área para servicios más grande para acomodar notas
  pdf.rect(10, 150, 190, 80, 'FD');
  
  // Mostrar servicios en forma de lista con íconos de check
  yPos = 160;
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(10);
  
  // Columna izquierda y derecha de servicios
  let xPosCol1 = 15;  // Columna izquierda
  let xPosCol2 = 105; // Columna derecha
  let yInitial = yPos; // Guardamos la posición Y inicial para cada columna
  
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
  
  // Función para añadir un servicio con su nota (si está marcado)
  const addService = (x: number, y: number, isChecked: boolean, label: string, note: string | undefined) => {
    drawCheckCircle(x, y-2, isChecked);
    
    if (isChecked) {
      // El servicio está marcado: mostrar en verde
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, x + 5, y);
      
      // Si hay nota, mostrarla debajo con fuente normal y tamaño más pequeño
      if (note && note.trim()) {
        pdf.setTextColor(80, 80, 80);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        
        // Wrap texto para notas largas
        const wrappedNote = pdf.splitTextToSize(note, 80);
        pdf.text(wrappedNote, x + 8, y + 5);
        
        // Devolvemos el incremento de Y adicional basado en el número de líneas
        const additionalY = Math.min(wrappedNote.length * 4, 12); // Maximo 3 líneas (4px cada una)
        pdf.setFontSize(10); // Restauramos el tamaño de fuente
        return 10 + additionalY; // 10px base + espacio adicional para múltiples líneas
      }
      
      // Restaurar color de texto normal
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('helvetica', 'normal');
      return 10; // Espaciado normal para items con check
    } else {
      // El servicio no está marcado: mostrar en gris
      pdf.setTextColor(150, 150, 150);
      pdf.text(label, x + 5, y);
      pdf.setTextColor(80, 80, 80); // Restaurar color
      return 8; // Espaciado menor para items sin check
    }
  };
  
  // COLUMNA IZQUIERDA - Primeros servicios
  let yPosLeft = yInitial;
  
  // Filtro de aceite
  yPosLeft += addService(xPosCol1, yPosLeft, !!oilChange.filtroAceite, 'Filtro de Aceite', oilChange.filtroAceiteNota);
  
  // Filtro de aire
  yPosLeft += addService(xPosCol1, yPosLeft, !!oilChange.filtroAire, 'Filtro de Aire', oilChange.filtroAireNota);
  
  // Aditivo
  yPosLeft += addService(xPosCol1, yPosLeft, !!oilChange.aditivo, 'Aditivo', oilChange.aditivoNota);
  
  // Diferencial
  yPosLeft += addService(xPosCol1, yPosLeft, !!oilChange.diferencial, 'Diferencial', oilChange.diferencialNota);
  
  // Engrase
  yPosLeft += addService(xPosCol1, yPosLeft, !!oilChange.engrase, 'Engrase', oilChange.engraseNota);
  
  // COLUMNA DERECHA - Otros servicios
  let yPosRight = yInitial;
  
  // Filtro de habitáculo
  yPosRight += addService(xPosCol2, yPosRight, !!oilChange.filtroHabitaculo, 'Filtro de Habitáculo', oilChange.filtroHabitaculoNota);
  
  // Filtro de combustible
  yPosRight += addService(xPosCol2, yPosRight, !!oilChange.filtroCombustible, 'Filtro de Combustible', oilChange.filtroCombustibleNota);
  
  // Refrigerante
  yPosRight += addService(xPosCol2, yPosRight, !!oilChange.refrigerante, 'Refrigerante', oilChange.refrigeranteNota);
  
  // Caja
  yPosRight += addService(xPosCol2, yPosRight, !!oilChange.caja, 'Caja', oilChange.cajaNota);
  
  // Si no hay ningún servicio marcado, mostrar un mensaje
  if (!oilChange.filtroAceite && !oilChange.filtroAire && !oilChange.filtroHabitaculo && 
      !oilChange.filtroCombustible && !oilChange.aditivo && !oilChange.refrigerante && 
      !oilChange.diferencial && !oilChange.caja && !oilChange.engrase) {
    pdf.setTextColor(120, 120, 120);
    pdf.text('No se realizaron servicios adicionales', 105, yInitial + 15, { align: 'center' });
  }
  
  // Observaciones si existen - AJUSTADAS PARA SUBIR
  let observationsY = 240;
  if (oilChange.observaciones) {
    observationsY = 240;
    pdf.setFillColor(100, 100, 100);
    pdf.rect(10, observationsY, 190, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Observaciones', 105, observationsY + 7, { align: 'center' });
    
    // Área para observaciones
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(252, 252, 252);
    pdf.rect(10, observationsY + 10, 190, 30, 'FD');
    
    // Texto de observaciones
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(9);
    
    // Dividir observaciones en múltiples líneas
    const textLines = pdf.splitTextToSize(oilChange.observaciones, 180);
    pdf.text(textLines, 15, observationsY + 20);
  }
  
  // Pie de página
  const footerY = 285;
   
pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
pdf.line(10, footerY - 5, 200, footerY - 5);


// Textos del footer (alineados a la izquierda)
pdf.setFontSize(8);
pdf.setTextColor(120, 120, 120);
pdf.text('Este documento no es válido como factura.', 100, footerY, { align: 'center' });
pdf.text(`Próximo cambio: a los ${oilChange.kmProximo.toLocaleString()} km o el ${formatDate(oilChange.fechaProximoCambio)}, lo que ocurra primero.`, 100, footerY + 5, { align: 'center' });

if (lubricentro) {
  pdf.text(`${lubricentro.fantasyName} - ${lubricentro.domicilio} - Tel: ${lubricentro.phone}`, 100, footerY + 10, { align: 'center' });
}
  
  // Guardar PDF
  pdf.save(filename);
  
  return filename;
}
};

export default enhancedPdfService;