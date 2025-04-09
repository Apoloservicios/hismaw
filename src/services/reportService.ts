// src/services/reportService.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OilChangeStats, OperatorStats } from '../types';

/**
 * Servicio para generar reportes en diferentes formatos
 */
export const reportService = {
  /**
   * Genera un informe en PDF con las estadísticas y gráficos de cambios de aceite
   * @param stats - Estadísticas de cambios de aceite
   * @param operatorStats - Estadísticas por operador
   * @param lubricentroName - Nombre del lubricentro
   * @param dateRange - Rango de fechas del reporte
   * @returns Promise que se resuelve cuando se completa la generación del PDF
   */
  generatePdfReport: async (
    stats: OilChangeStats,
    operatorStats: OperatorStats[],
    lubricentroName: string,
    dateRange: string
  ): Promise<void> => {
    try {
      // Crear un nuevo documento PDF
      const pdf = new jsPDF();
      let yPos = 20;
      
      // Título
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Informe de Operaciones', 105, yPos, { align: 'center' });
      yPos += 10;
      
      // Subtítulo
      pdf.setFontSize(14);
      pdf.text(lubricentroName, 105, yPos, { align: 'center' });
      yPos += 7;
      
      // Fecha
      pdf.setFontSize(10);
      pdf.text(`Período: ${dateRange} - Generado el ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
      yPos += 15;
      
      // Línea separadora
      pdf.line(20, yPos, 190, yPos);
      yPos += 15;
      
      // Resumen de estadísticas
      pdf.setFontSize(14);
      pdf.text('Resumen de Estadísticas', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Total de cambios: ${stats.total}`, 20, yPos);
      yPos += 7;
      pdf.text(`Cambios este mes: ${stats.thisMonth}`, 20, yPos);
      yPos += 7;
      pdf.text(`Cambios mes anterior: ${stats.lastMonth}`, 20, yPos);
      yPos += 7;
      pdf.text(`Próximos 30 días: ${stats.upcoming30Days}`, 20, yPos);
      yPos += 7;
      
      // Calcular crecimiento mensual
      const monthlyGrowth = stats.lastMonth > 0 
        ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100 
        : 0;
      
      pdf.text(`Crecimiento mensual: ${monthlyGrowth.toFixed(1)}%`, 20, yPos);
      yPos += 15;
      
      // Línea separadora
      pdf.line(20, yPos, 190, yPos);
      yPos += 15;
      
      // Rendimiento por operador
      pdf.setFontSize(14);
      pdf.text('Rendimiento por Operador', 20, yPos);
      yPos += 10;
      
      if (operatorStats.length > 0) {
        pdf.setFontSize(10);
        
        // Calcular el ancho de cada columna
        const headers = ['Operador', 'Cantidad', 'Porcentaje'];
        const columnWidths = [100, 30, 40];
        
        // Encabezados de tabla
        pdf.setFont('helvetica', 'bold');
        let xPos = 20;
        headers.forEach((header, index) => {
          pdf.text(header, xPos, yPos);
          xPos += columnWidths[index];
        });
        yPos += 7;
        
        // Línea debajo de los encabezados
        pdf.line(20, yPos - 3, 20 + columnWidths.reduce((a, b) => a + b, 0), yPos - 3);
        
        // Contenido de la tabla
        pdf.setFont('helvetica', 'normal');
        const totalServices = operatorStats.reduce((sum, op) => sum + op.count, 0);
        
        operatorStats.forEach((operator) => {
          const percentage = totalServices > 0 
            ? ((operator.count / totalServices) * 100).toFixed(1) 
            : '0';
          
          xPos = 20;
          pdf.text(operator.operatorName, xPos, yPos);
          xPos += columnWidths[0];
          pdf.text(operator.count.toString(), xPos, yPos);
          xPos += columnWidths[1];
          pdf.text(`${percentage}%`, xPos, yPos);
          
          yPos += 7;
          
          // Evitar que el contenido se salga de la página
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
        });
      } else {
        pdf.setFontSize(10);
        pdf.text('No hay datos disponibles para este período', 20, yPos);
        yPos += 10;
      }
      
      // Nueva página para indicadores clave
      pdf.addPage();
      yPos = 20;
      
      pdf.setFontSize(14);
      pdf.text('Indicadores Clave de Rendimiento (KPIs)', 105, yPos, { align: 'center' });
      yPos += 15;
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 100, 0); // Color verde oscuro para KPIs
      
      const tasa_retorno = stats.total > 0 
        ? ((stats.upcoming30Days / stats.total) * 100).toFixed(1) 
        : '0';
      
      pdf.text(`Tasa de Retorno: ${tasa_retorno}%`, 20, yPos);
      yPos += 10;
      
      const promedio_diario = (stats.thisMonth / 30).toFixed(1);
      pdf.text(`Promedio Diario: ${promedio_diario} cambios/día`, 20, yPos);
      yPos += 10;
      
      const crecimiento = stats.lastMonth > 0 
        ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1) 
        : 'N/A';
      
      pdf.text(`Crecimiento Mensual: ${crecimiento}%`, 20, yPos);
      yPos += 10;
      
      // Notas y recomendaciones
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Notas y Recomendaciones', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      const recomendaciones = [
        'Revise la satisfacción de los clientes y su tasa de retorno.',
        'Analice el rendimiento de los operadores para optimizar la asignación de tareas.',
        'Considere promociones para los períodos de menor actividad.',
        'Envíe recordatorios a los clientes próximos a su fecha de cambio.'
      ];
      
      recomendaciones.forEach(rec => {
        pdf.text(`• ${rec}`, 20, yPos);
        yPos += 7;
      });
      
      // Pie de página
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Informe generado por Sistema de Gestión de Cambios de Aceite - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      }
      
      // Guardar PDF
      pdf.save(`Informe_${lubricentroName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error al generar informe PDF:', error);
      throw error;
    }
  },
  
  /**
   * Genera un archivo Excel con los datos de cambios de aceite
   * @param data - Datos a exportar
   * @param sheetName - Nombre de la hoja de Excel
   * @returns Promise que se resuelve cuando se completa la exportación
   */
  exportToExcel: async (data: any[], sheetName: string = 'Reporte'): Promise<void> => {
    try {
      // Para implementar esta funcionalidad, necesitarías una biblioteca como xlsx
      // Aquí hay un ejemplo básico de cómo se podría implementar
      
      /* Ejemplo usando la biblioteca xlsx:
      import * as XLSX from 'xlsx';
      
      // Crear un nuevo libro
      const wb = XLSX.utils.book_new();
      
      // Crear una hoja con los datos
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Guardar el archivo
      XLSX.writeFile(wb, `Reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
      */
      
      // Por ahora, simplemente logueamos que esta función debe implementarse
      console.log('La función exportToExcel debe implementarse con una biblioteca como xlsx');
      alert('La exportación a Excel será implementada próximamente');
      return Promise.resolve();
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      throw error;
    }
  },
  
  /**
   * Captura una imagen de un elemento HTML para incluirla en un reporte
   * @param element - Elemento HTML a capturar
   * @returns Promise con el dataURL de la imagen
   */
  captureElement: async (element: HTMLElement): Promise<string> => {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });
      
      return canvas.toDataURL('image/jpeg', 0.95);
    } catch (error) {
      console.error('Error al capturar elemento:', error);
      throw error;
    }
  }
};

export default reportService;