// src/components/print/EnhancedPrintComponent.tsx
import React, { forwardRef } from 'react';
import { OilChange, Lubricentro } from '../../types';

interface EnhancedPrintComponentProps {
  oilChange: OilChange;
  lubricentro: Lubricentro | null;
}

const EnhancedPrintComponent = forwardRef<HTMLDivElement, EnhancedPrintComponentProps>(
  ({ oilChange, lubricentro }, ref) => {
    // Formatear fecha
    const formatDate = (date: Date): string => {
      return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    // Colores personalizados - Pueden ser dinámicos basados en los colores del lubricentro
    const primaryColor = '#0056b3';
    const secondaryColor = '#28a745';
    const accentColor = '#f0ad4e';
    const lightBgColor = '#f8f9fa';
    
    return (
      <div 
        ref={ref} 
        className="bg-white p-8" 
        style={{ 
          width: '210mm',
          minHeight: '297mm',
          fontFamily: 'Arial, sans-serif',
          color: '#333'
        }}
      >
        {/* Encabezado con logo e información del lubricentro */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: '15px',
          marginBottom: '20px'
        }}>
          <div>
            {/* Información del lubricentro */}
            {lubricentro && (
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: primaryColor }}>
                  {lubricentro.fantasyName}
                </h1>
                <p style={{ margin: '2px 0', color: '#555' }}>{lubricentro.domicilio}</p>
                <p style={{ margin: '2px 0', color: '#555' }}>
                  CUIT: {lubricentro.cuit} - Tel: {lubricentro.phone}
                </p>
                <p style={{ margin: '2px 0', color: '#555' }}>{lubricentro.email}</p>
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'right' }}>
              {/* Logo del lubricentro - Usando preferentemente logoBase64 para impresión */}
              {lubricentro?.logoBase64 ? (
                <img 
                  src={lubricentro.logoBase64} 
                  alt={lubricentro.fantasyName || 'Logo lubricentro'} 
                  style={{ 
                    maxHeight: '80px', 
                    maxWidth: '150px',
                    objectFit: 'contain',
                    display: 'block',
                    marginLeft: 'auto' // Alinea a la derecha
                  }}
                />
              ) : lubricentro?.logoUrl ? (
                <img 
                  src={lubricentro.logoUrl} 
                  alt={lubricentro.fantasyName || 'Logo lubricentro'} 
                  style={{ 
                    maxHeight: '80px', 
                    maxWidth: '150px',
                    objectFit: 'contain',
                    display: 'block',
                    marginLeft: 'auto' // Alinea a la derecha
                  }}
                  crossOrigin="anonymous" // Importante para solucionar problemas de CORS
                />
              ) : (
                <div style={{ 
                  height: '80px', 
                  width: '150px', 
                  backgroundColor: lightBgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: primaryColor,
                  fontWeight: 'bold',
                  fontSize: '20px',
                  marginLeft: 'auto' // Alinea a la derecha
                }}>
                  {lubricentro?.fantasyName?.substring(0, 2).toUpperCase() || 'LB'}
                </div>
              )}
              
              {/* Placeholder para QR (en una implementación real se generaría dinámicamente) */}
              <div style={{
                width: '70px',
                height: '70px',
                marginTop: '10px',
                backgroundColor: '#eee',
                marginLeft: 'auto'
              }}></div>
            </div>
        </div>
        
        {/* Cabecera del comprobante */}
        <div style={{
          backgroundColor: primaryColor,
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>COMPROBANTE DE CAMBIO DE ACEITE</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>
            Nº {oilChange.nroCambio}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
            Fecha: {formatDate(oilChange.fecha)}
          </p>
        </div>
        
        {/* Dominio/Patente destacado */}
        <div style={{
          backgroundColor: lightBgColor,
          padding: '10px',
          textAlign: 'center',
          marginBottom: '20px',
          borderRadius: '4px',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          {oilChange.dominioVehiculo}
        </div>
        
        {/* Información en dos columnas */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          {/* Detalles del vehículo */}
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: primaryColor,
              color: 'white',
              padding: '8px',
              borderTopLeftRadius: '4px',
              borderTopRightRadius: '4px',
              fontWeight: 'bold'
            }}>
              Detalles del Vehículo
            </div>
            
            <div style={{
              border: '1px solid #ddd',
              borderTop: 'none',
              padding: '15px',
              borderBottomLeftRadius: '4px',
              borderBottomRightRadius: '4px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px', color: '#666', width: '40%' }}>Marca</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>{oilChange.marcaVehiculo}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Modelo</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>{oilChange.modeloVehiculo}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Año</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>
                      {oilChange.añoVehiculo || 'No especificado'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Tipo</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>{oilChange.tipoVehiculo}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Kilometraje</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>
                      {oilChange.kmActuales.toLocaleString()} km
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Datos del servicio */}
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: secondaryColor,
              color: 'white',
              padding: '8px',
              borderTopLeftRadius: '4px',
              borderTopRightRadius: '4px',
              fontWeight: 'bold'
            }}>
              Datos del Servicio
            </div>
            
            <div style={{
              border: '1px solid #ddd',
              borderTop: 'none',
              padding: '15px',
              borderBottomLeftRadius: '4px',
              borderBottomRightRadius: '4px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px', color: '#666', width: '40%' }}>Cliente</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>{oilChange.nombreCliente}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Fecha</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>
                      {formatDate(oilChange.fechaServicio)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Operario</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>{oilChange.nombreOperario}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Aceite</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>
                      {`${oilChange.marcaAceite} ${oilChange.tipoAceite} ${oilChange.sae}`}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Cantidad</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>
                      {oilChange.cantidadAceite} litros
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Próx. Cambio</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>
                      {formatDate(oilChange.fechaProximoCambio)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px', color: '#666' }}>Próx. Km</td>
                    <td style={{ padding: '4px', fontWeight: 'bold' }}>
                      {oilChange.kmProximo.toLocaleString()} km
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Filtros y servicios adicionales */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            backgroundColor: accentColor,
            color: 'white',
            padding: '8px',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            fontWeight: 'bold'
          }}>
            Filtros y Servicios Adicionales
          </div>
          
          <div style={{
            border: '1px solid #ddd',
            borderTop: 'none',
            padding: '15px',
            borderBottomLeftRadius: '4px',
            borderBottomRightRadius: '4px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* Mostrar servicios como "badges" o etiquetas */}
            {oilChange.filtroAceite && (
              <div style={{
                backgroundColor: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Filtro de Aceite</span>
                {oilChange.filtroAceiteNota && <span>: {oilChange.filtroAceiteNota}</span>}
              </div>
            )}
            
            {oilChange.filtroAire && (
              <div style={{
                backgroundColor: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Filtro de Aire</span>
                {oilChange.filtroAireNota && <span>: {oilChange.filtroAireNota}</span>}
              </div>
            )}
            
            {oilChange.filtroHabitaculo && (
              <div style={{
                backgroundColor: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Filtro de Habitáculo</span>
                {oilChange.filtroHabitaculoNota && <span>: {oilChange.filtroHabitaculoNota}</span>}
              </div>
            )}
            
            {oilChange.filtroCombustible && (
              <div style={{
                backgroundColor: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Filtro de Combustible</span>
                {oilChange.filtroCombustibleNota && <span>: {oilChange.filtroCombustibleNota}</span>}
              </div>
            )}
            
            {oilChange.aditivo && (
              <div style={{
                backgroundColor: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Aditivo</span>
                {oilChange.aditivoNota && <span>: {oilChange.aditivoNota}</span>}
              </div>
            )}
            
            {oilChange.refrigerante && (
              <div style={{
                backgroundColor: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Refrigerante</span>
                {oilChange.refrigeranteNota && <span>: {oilChange.refrigeranteNota}</span>}
              </div>
            )}
            
            {oilChange.diferencial && (
              <div style={{
                backgroundColor: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Diferencial</span>
                {oilChange.diferencialNota && <span>: {oilChange.diferencialNota}</span>}
              </div>
            )}
            
            {oilChange.caja && (
              <div style={{
                backgroundColor: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Caja</span>
                {oilChange.cajaNota && <span>: {oilChange.cajaNota}</span>}
              </div>
            )}
            
            {oilChange.engrase && (
              <div style={{
                backgroundColor: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Engrase</span>
                {oilChange.engraseNota && <span>: {oilChange.engraseNota}</span>}
              </div>
            )}
            
            {/* Mostrar mensaje si no hay servicios adicionales */}
            {!oilChange.filtroAceite && !oilChange.filtroAire && 
             !oilChange.filtroHabitaculo && !oilChange.filtroCombustible && 
             !oilChange.aditivo && !oilChange.refrigerante && 
             !oilChange.diferencial && !oilChange.caja && !oilChange.engrase && (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No se registraron servicios adicionales</p>
            )}
          </div>
        </div>
        
        {/* Observaciones si existen */}
        {oilChange.observaciones && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '8px',
              borderTopLeftRadius: '4px',
              borderTopRightRadius: '4px',
              fontWeight: 'bold'
            }}>
              Observaciones
            </div>
            
            <div style={{
              border: '1px solid #ddd',
              borderTop: 'none',
              padding: '15px',
              borderBottomLeftRadius: '4px',
              borderBottomRightRadius: '4px',
              backgroundColor: lightBgColor
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{oilChange.observaciones}</p>
            </div>
          </div>
        )}
        
        {/* Espacio para firma */}
        <div style={{ 
          marginTop: '40px', 
          display: 'flex', 
          justifyContent: 'space-between' 
        }}>
          <div style={{
            width: '40%',
            borderTop: '1px solid #888',
            paddingTop: '5px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            Firma del Cliente
          </div>
          
          <div style={{
            width: '40%',
            borderTop: '1px solid #888',
            paddingTop: '5px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            Firma del Operario
          </div>
        </div>
        
        {/* Pie de página */}
        <div style={{
          marginTop: '30px',
          padding: '10px',
          border: '1px dashed #ddd',
          borderRadius: '4px',
          backgroundColor: lightBgColor,
          fontSize: '12px',
          textAlign: 'center',
          color: '#666'
        }}>
          <p style={{ margin: 0 }}>Este documento no tiene validez como factura.</p>
          <p style={{ margin: '5px 0 0 0' }}>
            <span style={{ fontWeight: 'bold' }}>Próximo cambio:</span> a los {oilChange.kmProximo.toLocaleString()} km o el {formatDate(oilChange.fechaProximoCambio)}, lo que ocurra primero.
          </p>
        </div>
        
        {/* Footer con información del lubricentro */}
        <div style={{
          marginTop: '30px',
          borderTop: `2px solid ${primaryColor}`,
          paddingTop: '10px',
          fontSize: '11px',
          color: '#666',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: 'bold' }}>{lubricentro?.fantasyName || 'Sistema de Gestión de Cambios de Aceite'}</span> - 
            {lubricentro ? ` ${lubricentro.domicilio} - Tel: ${lubricentro.phone}` : ''}
          </p>
          <p style={{ margin: '3px 0 0 0' }}>
            &copy; {new Date().getFullYear()} - Todos los derechos reservados
          </p>
        </div>
      </div>
    );
  }
);

export default EnhancedPrintComponent;