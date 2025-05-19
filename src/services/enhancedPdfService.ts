/**
 * Servicio mejorado para la generación de PDF y utilidades relacionadas
 */
const enhancedPdfService = {
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
 * Servicio mejorado para la generación de PDF y utilidades relacionadas
 */
const enhancedPdfService = {
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
   * Genera un PDF con jsPDF con un diseño profesional mejorado
   * @param oilChange - Datos del cambio de aceite
   * @param lubricentro - Datos del lubricentro
   * @returns nombre del archivo generado
   */
  generateDirectPDF: async (oilChange: OilChange, lubricentro: Lubricentro | null): Promise<string> => {
    // Crear nuevo documento PDF con orientación portrait
    const pdf = new jsPDF('p', 'mm', 'a4');
    const filename = `cambio-aceite-${oilChange.nroCambio}.pdf`;
    
    // Dimensiones de la página A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Márgenes
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Colores utilizados en el documento
    // Verde primario, funciona bien para los títulos y acentos
    const primaryColor = [46, 125, 50]; // #2E7D32
    const secondaryColor = [27, 94, 32]; // #1B5E20 - Un poco más oscuro
    const accentColor = [251, 192, 45]; // #FBC02D - Amarillo para advertencias
    const textColor = [33, 33, 33]; // #212121 - Casi negro para texto principal
    const textLight = [117, 117, 117]; // #757575 - Gris para texto secundario
    
    // === CONFIGURACIÓN INICIAL ===
    // Configurar fuente
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Posición inicial en Y
    let yPos = margin;
    
    // === ENCABEZADO ===
    // Barra de color superior
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 12, 'F');
    
    yPos += 20; // Espacio después de la barra de color
    
    // Información del lubricentro
    // Logo del lubricentro (si existe)
    if (lubricentro?.logoBase64) {
      try {
        pdf.addImage(lubricentro.logoBase64, 'JPEG', margin, yPos - 15, 40, 20);
      } catch (error) {
        console.error('Error al añadir logo del lubricentro (base64):', error);
      }
    } else if (lubricentro?.logoUrl) {
      try {
        pdf.addImage(lubricentro.logoUrl, 'JPEG', margin, yPos - 15, 40, 20);
      } catch (error) {
        console.error('Error al añadir logo del lubricentro (URL):', error);
        // Si falla, podríamos intentar con un logo predeterminado
        try {
          pdf.addImage(defaultLogoBase64, 'JPEG', margin, yPos - 15, 40, 20);
        } catch (e) {
          console.error('Error al añadir logo predeterminado:', e);
        }
      }
    }
    // Título del documento
    pdf.setFontSize(18);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFont('helvetica', 'bold');
    const lubricentroNombre = lubricentro?.fantasyName || oilChange.lubricentroNombre || 'Lubricentro';
    pdf.text(lubricentroNombre, pageWidth - margin - pdf.getTextWidth(lubricentroNombre), yPos - 8);
    
    // Información del lubricentro
    pdf.setFontSize(9);
    pdf.setTextColor(textLight[0], textLight[1], textLight[2]);
    pdf.setFont('helvetica', 'normal');
    
    if (lubricentro?.domicilio) {
      pdf.text(lubricentro.domicilio, pageWidth - margin - pdf.getTextWidth(lubricentro.domicilio), yPos - 3);
    }
    
    if (lubricentro?.phone) {
      pdf.text(`Tel: ${lubricentro.phone}`, pageWidth - margin - pdf.getTextWidth(`Tel: ${lubricentro.phone}`), yPos + 2);
    }
    
    if (lubricentro?.email) {
      pdf.text(lubricentro.email, pageWidth - margin - pdf.getTextWidth(lubricentro.email), yPos + 7);
    }
    
    // Línea horizontal debajo del encabezado
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.5);
    yPos += 10;
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // === DATOS DEL COMPROBANTE ===
    // Título e identificador del comprobante
    pdf.setFontSize(16);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text("COMPROBANTE DE CAMBIO DE ACEITE", margin, yPos);
    
    // Número de cambio en un rectángulo
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    drawRoundedRect(pdf, pageWidth - margin - 50, yPos - 8, 50, 12, 2, 'FD');
    
    pdf.setTextColor(255, 255, 255); // Texto blanco
    pdf.setFontSize(12);
    pdf.text(`N° ${oilChange.nroCambio}`, pageWidth - margin - 25 - (pdf.getTextWidth(`N° ${oilChange.nroCambio}`) / 2), yPos - 1);
    
    yPos += 15;
    
    // Fecha de emisión y próximo cambio
    pdf.setFontSize(10);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFont('helvetica', 'normal');
    
    // Dominio en formato destacado
    pdf.setFillColor(245, 245, 245); // Fondo gris claro
    drawRoundedRect(pdf, margin, yPos - 8, contentWidth, 14, 2, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const dominioText = `DOMINIO: ${oilChange.dominioVehiculo}`;
    pdf.text(dominioText, margin + (contentWidth / 2) - (pdf.getTextWidth(dominioText) / 2), yPos);
    
    yPos += 15;
    
    // === SECCIÓN CLIENTE Y VEHÍCULO ===
    // Crear una estructura de columnas dobles
    const columnWidth = contentWidth / 2 - 5; // -5 para espacio entre columnas
    
    // Sección Cliente
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    drawRoundedRect(pdf, margin, yPos, columnWidth, 8, 1, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text("DATOS DEL CLIENTE", margin + 5, yPos + 5.5);
    
    yPos += 10;
    const clientStartY = yPos;
    
    // Contenido de datos del cliente
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text("Cliente:", margin + 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(oilChange.nombreCliente, margin + 35, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Teléfono:", margin + 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(oilChange.celular || "No registrado", margin + 35, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Fecha servicio:", margin + 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatDate(oilChange.fechaServicio), margin + 35, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Operario:", margin + 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(oilChange.nombreOperario, margin + 35, yPos);
    
    // Ajustar la posición Y para la siguiente sección
    yPos = clientStartY;
    
    // Sección Vehículo
    pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    drawRoundedRect(pdf, margin + columnWidth + 10, yPos - 10, columnWidth, 8, 1, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text("DATOS DEL VEHÍCULO", margin + columnWidth + 15, yPos - 4.5);
    
    // Contenido de datos del vehículo
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text("Marca:", margin + columnWidth + 12, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(oilChange.marcaVehiculo, margin + columnWidth + 45, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Modelo:", margin + columnWidth + 12, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(oilChange.modeloVehiculo, margin + columnWidth + 45, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Tipo:", margin + columnWidth + 12, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(oilChange.tipoVehiculo, margin + columnWidth + 45, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Año:", margin + columnWidth + 12, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(oilChange.añoVehiculo?.toString() || "No especificado", margin + columnWidth + 45, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Kilometraje:", margin + columnWidth + 12, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${oilChange.kmActuales.toLocaleString()} km`, margin + columnWidth + 45, yPos);
    
    // Ajustar la posición Y para la siguiente sección
    yPos += 15;
    
    // === SECCIÓN ACEITE Y PRÓXIMO SERVICIO ===
    pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 1, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(33, 33, 33); // Texto oscuro sobre fondo amarillo
    pdf.setFont('helvetica', 'bold');
    pdf.text("DETALLES DEL SERVICIO", margin + 5, yPos + 5.5);
    yPos += 12;
    
    // Primera columna - Aceite
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text("Aceite:", margin + 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${oilChange.marcaAceite} ${oilChange.tipoAceite} ${oilChange.sae}`, margin + 35, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Cantidad:", margin + 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${oilChange.cantidadAceite} litros`, margin + 35, yPos);
    
    // Segunda columna - Próximo servicio
    const nextServiceY = yPos - 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text("Próx. cambio km:", margin + columnWidth + 12, nextServiceY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${oilChange.kmProximo.toLocaleString()} km`, margin + columnWidth + 60, nextServiceY);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text("Próx. cambio fecha:", margin + columnWidth + 12, nextServiceY + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatDate(oilChange.fechaProximoCambio), margin + columnWidth + 60, nextServiceY + 7);
    
    // Alerta de próximo cambio si es cercano o vencido
    const daysRemaining = getDaysRemaining(oilChange.fechaProximoCambio);
    
    if (daysRemaining <= 0) {
      // Alerta de cambio vencido
      yPos += 12;
      pdf.setFillColor(220, 53, 69); // Rojo para cambio vencido
      drawRoundedRect(pdf, margin, yPos, contentWidth, 10, 1, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      const alertText = `¡ALERTA! Cambio vencido hace ${Math.abs(daysRemaining)} días`;
      pdf.text(alertText, margin + (contentWidth / 2) - (pdf.getTextWidth(alertText) / 2), yPos + 6.5);
    } else if (daysRemaining <= 7) {
      // Alerta de cambio próximo
      yPos += 12;
      pdf.setFillColor(255, 193, 7); // Amarillo para cambio próximo
      drawRoundedRect(pdf, margin, yPos, contentWidth, 10, 1, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(33, 33, 33);
      pdf.setFont('helvetica', 'bold');
      
      let alertText = "";
      if (daysRemaining === 0) {
        alertText = "¡ATENCIÓN! Cambio programado para hoy";
      } else if (daysRemaining === 1) {
        alertText = "¡ATENCIÓN! Cambio programado para mañana";
      } else {
        alertText = `¡ATENCIÓN! Cambio programado en ${daysRemaining} días`;
      }
      
      pdf.text(alertText, margin + (contentWidth / 2) - (pdf.getTextWidth(alertText) / 2), yPos + 6.5);
    }
    
    yPos += 15;
    
    // === SECCIÓN FILTROS Y SERVICIOS ===
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 1, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text("FILTROS Y SERVICIOS ADICIONALES", margin + 5, yPos + 5.5);
    yPos += 10;
    
    // Crear grid para servicios (3 columnas)
    const serviceItemWidth = contentWidth / 3 - 6;
    const serviceItemHeight = 16;
    const itemsPerRow = 3;
    let currentColumn = 0;
    let startY = yPos;
    
    // Lista de servicios a mostrar
    const services = [
      { name: 'Filtro de Aceite', done: oilChange.filtroAceite, note: oilChange.filtroAceiteNota },
      { name: 'Filtro de Aire', done: oilChange.filtroAire, note: oilChange.filtroAireNota },
      { name: 'Filtro de Habitáculo', done: oilChange.filtroHabitaculo, note: oilChange.filtroHabitaculoNota },
      { name: 'Filtro de Combustible', done: oilChange.filtroCombustible, note: oilChange.filtroCombustibleNota },
      { name: 'Aditivo', done: oilChange.aditivo, note: oilChange.aditivoNota },
      { name: 'Refrigerante', done: oilChange.refrigerante, note: oilChange.refrigeranteNota },
      { name: 'Diferencial', done: oilChange.diferencial, note: oilChange.diferencialNota },
      { name: 'Caja', done: oilChange.caja, note: oilChange.cajaNota },
      { name: 'Engrase', done: oilChange.engrase, note: oilChange.engraseNota }
    ];
    
    // Dibujar cada servicio
    services.forEach((service, index) => {
      const col = currentColumn % itemsPerRow;
      const row = Math.floor(currentColumn / itemsPerRow);
      
      const itemX = margin + (col * (serviceItemWidth + 6));
      const itemY = startY + (row * (serviceItemHeight + 4));
      
      // Fondo del elemento de servicio
      const bgColorDone = service.done ? [237, 247, 237] : [253, 237, 237]; // Verde claro si se hizo, rojo claro si no
      const borderColorDone = service.done ? [76, 175, 80] : [244, 67, 54]; // Borde verde o rojo
      
      pdf.setFillColor(bgColorDone[0], bgColorDone[1], bgColorDone[2]);
      pdf.setDrawColor(borderColorDone[0], borderColorDone[1], borderColorDone[2]);
      drawRoundedRect(pdf, itemX, itemY, serviceItemWidth, serviceItemHeight, 1, 'FD');
      
      // Mostrar check o X
      pdf.setFontSize(12);
      const textColorStatus = service.done ? [46, 125, 50] : [211, 47, 47]; // Verde o rojo
      pdf.setTextColor(textColorStatus[0], textColorStatus[1], textColorStatus[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(service.done ? '✓' : '✗', itemX + 4, itemY + 5);
      
      // Nombre del servicio
      pdf.setFontSize(9);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(service.name, itemX + 10, itemY + 5);
      
      // Nota (si existe)
      if (service.done && service.note) {
        pdf.setFontSize(8);
        pdf.setTextColor(textLight[0], textLight[1], textLight[2]);
        pdf.setFont('helvetica', 'normal');
        
        // Limitar longitud de la nota si es muy larga
        let note = service.note;
        if (note && note.length > 30) {
          note = note.substring(0, 27) + '...';
        }
        
        if (note) {
          pdf.text(note, itemX + 10, itemY + 12);
        }
      }
      
      currentColumn++;
    });
    // Ajustar la posición Y para la siguiente sección
    yPos = startY + (Math.ceil(services.length / itemsPerRow) * (serviceItemHeight + 4));
    
    // === SECCIÓN OBSERVACIONES (si existen) ===
    if (oilChange.observaciones) {
      yPos += 10;
      
      pdf.setFillColor(90, 90, 90); // Gris oscuro
      drawRoundedRect(pdf, margin, yPos, contentWidth, 8, 1, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text("OBSERVACIONES", margin + 5, yPos + 5.5);
      
      yPos += 10;
      
      // Marco para las observaciones
      pdf.setFillColor(248, 249, 250); // Fondo gris muy claro
      drawRoundedRect(pdf, margin, yPos, contentWidth, 30, 1, 'F');
      
      // Texto de observaciones
      pdf.setFontSize(9);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.setFont('helvetica', 'normal');
      
      // Dividir texto largo en múltiples líneas (limitadas a 5 líneas)
      const splitText = pdf.splitTextToSize(oilChange.observaciones, contentWidth - 10);
      const maxLines = 5;
      const textToDisplay = splitText.slice(0, maxLines);
      
      // Imprimir texto con padding interno
      for (let i = 0; i < textToDisplay.length; i++) {
        pdf.text(textToDisplay[i], margin + 5, yPos + 7 + (i * 5));
      }
      
      // Si hay más texto del que se muestra, indicarlo
      if (splitText.length > maxLines) {
        pdf.setFont('helvetica', 'italic');
        pdf.text("...(texto truncado)", margin + 5, yPos + 7 + (maxLines * 5));
      }
      
      yPos += 35;
    }
    
    // === ÁREA PARA FIRMAS ===
    yPos = Math.max(yPos, 230); // Asegurar espacio mínimo
    
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.5);
    
    // Línea para firma del operario
    pdf.line(margin + 20, yPos, margin + contentWidth / 2 - 20, yPos);
    pdf.setFontSize(9);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFont('helvetica', 'normal');
    const operarioText = "Firma del Operario";
    pdf.text(operarioText, margin + (contentWidth / 4) - (pdf.getTextWidth(operarioText) / 2), yPos + 5);
    
    // Línea para firma del cliente
    pdf.line(margin + contentWidth / 2 + 20, yPos, margin + contentWidth - 20, yPos);
    const clienteText = "Firma del Cliente";
    pdf.text(clienteText, margin + (3 * contentWidth / 4) - (pdf.getTextWidth(clienteText) / 2), yPos + 5);
    // === PIE DE PÁGINA ===
    yPos = pageHeight - 30;
    
    // Línea horizontal
    pdf.setLineWidth(0.75);
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 8;
    
    // Texto del pie
    pdf.setFontSize(8);
    pdf.setTextColor(textLight[0], textLight[1], textLight[2]);
    pdf.setFont('helvetica', 'normal');
    
    const footerText1 = "Este documento es un comprobante del servicio realizado y no tiene validez como factura.";
    pdf.text(footerText1, pageWidth / 2 - (pdf.getTextWidth(footerText1) / 2), yPos);
    
    yPos += 5;
    
    const footerText2 = `Próximo cambio: a los ${oilChange.kmProximo.toLocaleString()} km o el ${formatDate(oilChange.fechaProximoCambio)}, lo que ocurra primero.`;
    pdf.text(footerText2, pageWidth / 2 - (pdf.getTextWidth(footerText2) / 2), yPos);
    
    yPos += 5;
    
    // Información adicional del lubricentro
    if (lubricentro) {
      const year = new Date().getFullYear();
      const copyrightText = `© ${year} ${lubricentro.fantasyName} - Todos los derechos reservados`;
      pdf.text(copyrightText, pageWidth / 2 - (pdf.getTextWidth(copyrightText) / 2), yPos);
    }
    
    // Barra inferior de color
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F');
    
    // Guardar PDF
    pdf.save(filename);
    
    return filename;
  },
  /**
   * Exporta los datos de cambios de aceite a Excel
   * @param oilChanges - Lista de cambios de aceite
   * @param filename - Nombre del archivo a generar
   */
  exportToExcel: (oilChanges: OilChange[], filename: string = 'cambios-aceite'): void => {
    // Implementación para exportar a Excel (si se desea)
    console.log("Función exportToExcel no implementada");
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
  }
};

export default enhancedPdfService;