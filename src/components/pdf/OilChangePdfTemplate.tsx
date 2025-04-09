// src/components/pdf/OilChangePdfTemplate.tsx
import React, { forwardRef } from 'react';
import { OilChange, Lubricentro } from '../../types';

interface OilChangePdfTemplateProps {
  oilChange: OilChange;
  lubricentro: Lubricentro | null;
}

const OilChangePdfTemplate = forwardRef<HTMLDivElement, OilChangePdfTemplateProps>(
  ({ oilChange, lubricentro }, ref) => {
    // Formatear fecha
    const formatDate = (date: Date): string => {
      return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    return (
      <div 
        ref={ref} 
        className="p-8 bg-white"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        {/* Encabezado */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          {lubricentro && (
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">{lubricentro.fantasyName}</h1>
              <p className="text-gray-600">{lubricentro.domicilio}</p>
              <p className="text-gray-600">CUIT: {lubricentro.cuit} - Tel: {lubricentro.phone}</p>
              <p className="text-gray-600">{lubricentro.email}</p>
            </div>
          )}
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">COMPROBANTE DE CAMBIO DE ACEITE</h2>
            <p className="text-lg font-bold mt-1">Nº {oilChange.nroCambio}</p>
            <p className="text-gray-600 mt-1">Fecha: {formatDate(oilChange.fecha)}</p>
          </div>
        </div>
        
        {/* Datos del cliente */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Datos del Cliente</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-semibold">Nombre:</span> {oilChange.nombreCliente}</p>
              {oilChange.celular && <p><span className="font-semibold">Teléfono:</span> {oilChange.celular}</p>}
            </div>
            <div>
              <p><span className="font-semibold">Operador:</span> {oilChange.nombreOperario}</p>
            </div>
          </div>
        </div>
        
        {/* Datos del vehículo */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Datos del Vehículo</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-semibold">Dominio:</span> {oilChange.dominioVehiculo}</p>
              <p><span className="font-semibold">Marca:</span> {oilChange.marcaVehiculo}</p>
              <p><span className="font-semibold">Modelo:</span> {oilChange.modeloVehiculo}</p>
            </div>
            <div>
              <p><span className="font-semibold">Tipo:</span> {oilChange.tipoVehiculo}</p>
              {oilChange.añoVehiculo && <p><span className="font-semibold">Año:</span> {oilChange.añoVehiculo}</p>}
              <p><span className="font-semibold">Kilometraje Actual:</span> {oilChange.kmActuales.toLocaleString()} km</p>
            </div>
          </div>
        </div>
        
        {/* Datos del servicio */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Datos del Servicio</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-semibold">Aceite:</span> {oilChange.marcaAceite} {oilChange.tipoAceite} {oilChange.sae}</p>
              <p><span className="font-semibold">Cantidad:</span> {oilChange.cantidadAceite} Litros</p>
            </div>
            <div>
              <p><span className="font-semibold">Próximo Cambio Km:</span> {oilChange.kmProximo.toLocaleString()} km</p>
              <p><span className="font-semibold">Próximo Cambio Fecha:</span> {formatDate(oilChange.fechaProximoCambio)}</p>
            </div>
          </div>
        </div>
        
        {/* Filtros y servicios adicionales */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Filtros y Servicios Adicionales</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {oilChange.filtroAceite && (
                <p>
                  <span className="font-semibold">Filtro de Aceite:</span> Sí
                  {oilChange.filtroAceiteNota && ` (${oilChange.filtroAceiteNota})`}
                </p>
              )}
              {oilChange.filtroAire && (
                <p>
                  <span className="font-semibold">Filtro de Aire:</span> Sí
                  {oilChange.filtroAireNota && ` (${oilChange.filtroAireNota})`}
                </p>
              )}
              {oilChange.filtroHabitaculo && (
                <p>
                  <span className="font-semibold">Filtro de Habitáculo:</span> Sí
                  {oilChange.filtroHabitaculoNota && ` (${oilChange.filtroHabitaculoNota})`}
                </p>
              )}
              {oilChange.filtroCombustible && (
                <p>
                  <span className="font-semibold">Filtro de Combustible:</span> Sí
                  {oilChange.filtroCombustibleNota && ` (${oilChange.filtroCombustibleNota})`}
                </p>
              )}
            </div>
            <div>
              {oilChange.aditivo && (
                <p>
                  <span className="font-semibold">Aditivo:</span> Sí
                  {oilChange.aditivoNota && ` (${oilChange.aditivoNota})`}
                </p>
              )}
              {oilChange.refrigerante && (
                <p>
                  <span className="font-semibold">Refrigerante:</span> Sí
                  {oilChange.refrigeranteNota && ` (${oilChange.refrigeranteNota})`}
                </p>
              )}
              {oilChange.diferencial && (
                <p>
                  <span className="font-semibold">Diferencial:</span> Sí
                  {oilChange.diferencialNota && ` (${oilChange.diferencialNota})`}
                </p>
              )}
              {oilChange.caja && (
                <p>
                  <span className="font-semibold">Caja:</span> Sí
                  {oilChange.cajaNota && ` (${oilChange.cajaNota})`}
                </p>
              )}
              {oilChange.engrase && (
                <p>
                  <span className="font-semibold">Engrase:</span> Sí
                  {oilChange.engraseNota && ` (${oilChange.engraseNota})`}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Observaciones */}
        {oilChange.observaciones && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 mb-3">Observaciones</h3>
            <p className="whitespace-pre-line">{oilChange.observaciones}</p>
          </div>
        )}
        
        {/* Pie de página */}
        <div className="mt-10 border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500">Este documento no es válido como factura.</p>
          <p className="text-sm text-gray-500 mt-1">
            Próximo cambio: a los {oilChange.kmProximo.toLocaleString()} km o el {formatDate(oilChange.fechaProximoCambio)}, lo que ocurra primero.
          </p>
          {lubricentro && (
            <p className="text-sm text-gray-500 mt-4">
              {lubricentro.fantasyName} - {lubricentro.domicilio}
            </p>
          )}
        </div>
      </div>
    );
  }
);

export default OilChangePdfTemplate;