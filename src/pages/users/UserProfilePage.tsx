// src/pages/users/UserProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageContainer, Card, CardHeader, CardBody, Button, Alert, Input, Spinner, Tabs, Tab } from '../../components/ui';
import { getLubricentroById, updateLubricentro } from '../../services/lubricentroService';
import { updateUser } from '../../services/userService';
import ImageUploader from '../../components/common/ImageUploader';
import { Lubricentro, User } from '../../types';

const UserProfilePage: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lubricentro, setLubricentro] = useState<Lubricentro | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Datos del formulario de usuario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    photoURL: ''
  });
  
  // Datos del formulario de lubricentro
  const [lubricentroFormData, setLubricentroFormData] = useState({
    fantasyName: '',
    domicilio: '',
    phone: '',
    email: '',
    cuit: '',
    responsable: ''
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userProfile) {
          setError('No se encontró información del usuario');
          return;
        }
        
        // Cargar datos del usuario al estado
        setFormData({
          nombre: userProfile.nombre || '',
          apellido: userProfile.apellido || '',
          email: userProfile.email || '',
          photoURL: userProfile.photoURL || ''
        });
        
        // Cargar datos del lubricentro si el usuario está asociado a uno
        if (userProfile.lubricentroId && (userProfile.role === 'admin' || userProfile.role === 'superadmin')) {
          const lubricentroData = await getLubricentroById(userProfile.lubricentroId);
          setLubricentro(lubricentroData);
          
          // Inicializar formulario de lubricentro
          setLubricentroFormData({
            fantasyName: lubricentroData.fantasyName || '',
            domicilio: lubricentroData.domicilio || '',
            phone: lubricentroData.phone || '',
            email: lubricentroData.email || '',
            cuit: lubricentroData.cuit || '',
            responsable: lubricentroData.responsable || ''
          });
        }
      } catch (err) {
        console.error('Error al cargar datos del perfil:', err);
        setError('Error al cargar los datos. Por favor, recargue la página.');
      } finally {
        setLoading(false);
      }
    };
    
    if (userProfile) {
      loadData();
    }
  }, [userProfile]);
  
  // Manejar cambios en los campos del usuario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Manejar cambios en los campos del lubricentro
  const handleLubricentroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLubricentroFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Manejar subida exitosa de imagen
  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, photoURL: imageUrl }));
  };
  
  // Guardar cambios del perfil de usuario
  const handleSubmitUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.id) {
      setError('No se encontró información del usuario');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Preparar datos para actualizar
      const updateData: Partial<User> = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        photoURL: formData.photoURL
      };
      
      // Actualizar perfil en Firebase
      await updateUser(userProfile.id, updateData);
      
      // Actualizar perfil en contexto local
      await updateUserProfile(updateData);
      
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError('Error al guardar los cambios. Por favor, intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };
  
  // Guardar cambios del lubricentro
  const handleSubmitLubricentro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lubricentro?.id || !userProfile?.lubricentroId) {
      setError('No se encontró información del lubricentro');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Preparar datos para actualizar
      const updateData: Partial<Lubricentro> = {
        fantasyName: lubricentroFormData.fantasyName,
        domicilio: lubricentroFormData.domicilio,
        phone: lubricentroFormData.phone,
        email: lubricentroFormData.email,
        responsable: lubricentroFormData.responsable
      };
      
      // No permitir cambiar el CUIT si no es superadmin
      if (userProfile.role === 'superadmin') {
        updateData.cuit = lubricentroFormData.cuit;
      }
      
      // Actualizar lubricentro en Firebase
      await updateLubricentro(userProfile.lubricentroId, updateData);
      
      // Actualizar estado local
      setLubricentro(prev => prev ? { ...prev, ...updateData } : null);
      
      setSuccess('Información del lubricentro actualizada correctamente');
    } catch (err) {
      console.error('Error al actualizar lubricentro:', err);
      setError('Error al guardar los cambios. Por favor, intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };
  
  // Verificar si el usuario tiene permisos para editar el lubricentro
  const canEditLubricentro = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <PageContainer
      title="Mi Perfil"
      subtitle="Actualiza tu información personal y datos del lubricentro"
    >
      {error && (
        <Alert type="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert type="success" className="mb-6" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Tabs para navegar entre perfiles */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'personal', label: 'Datos Personales' },
          ...(canEditLubricentro && lubricentro ? [{ id: 'lubricentro', label: 'Datos del Lubricentro' }] : [])
        ]}
        className="mb-6"
      />
      
      {/* Perfil personal */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna izquierda: Foto de perfil */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader title="Foto de Perfil" />
              <CardBody>
                <ImageUploader 
                  currentImageUrl={formData.photoURL}
                  onImageUploaded={handleImageUploaded}
                  className="py-4"
                />
              </CardBody>
            </Card>
          </div>
          
          {/* Columna derecha: Datos personales */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Información Personal" />
              <CardBody>
                <form onSubmit={handleSubmitUserProfile} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Input
                      label="Nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                    />
                    
                    <Input
                      label="Apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <Input
                    label="Correo Electrónico"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {}} // No permitir cambios en el email
                    disabled
                    helperText="No es posible cambiar el correo electrónico"
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      color="primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner size="sm" color="white" className="mr-2" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Cambios'
                      )}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
            
            {/* Información de Cuenta */}
            <Card className="mt-6">
              <CardHeader
                title="Información de la Cuenta"
                subtitle="Datos de acceso y seguridad"
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Rol</p>
                    <p className="text-base font-medium capitalize">
                      {userProfile?.role === 'admin' ? 'Administrador' : 
                       userProfile?.role === 'superadmin' ? 'Super Administrador' : 
                       'Usuario'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className="text-base font-medium capitalize">{userProfile?.estado}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Registro</p>
                    <p className="text-base font-medium">
                      {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Último Inicio de Sesión</p>
                    <p className="text-base font-medium">
                      {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Opciones de Seguridad</h3>
                  
                  <Button
                    color="secondary"
                    variant="outline"
                    onClick={() => {
                      // Aquí se podría implementar la funcionalidad para cambiar contraseña
                      // Por ejemplo, redirigiendo a una página específica o mostrando un modal
                      alert('Funcionalidad de cambio de contraseña');
                    }}
                  >
                    Cambiar Contraseña
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
      
      {/* Perfil de lubricentro */}
      {activeTab === 'lubricentro' && lubricentro && (
        <Card>
          <CardHeader
            title="Información del Lubricentro"
            subtitle="Actualiza los datos de tu lubricentro"
          />
          <CardBody>
            <form onSubmit={handleSubmitLubricentro} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Nombre de Fantasía"
                  name="fantasyName"
                  value={lubricentroFormData.fantasyName}
                  onChange={handleLubricentroChange}
                  required
                />
                
                <Input
                  label="Responsable"
                  name="responsable"
                  value={lubricentroFormData.responsable}
                  onChange={handleLubricentroChange}
                  required
                />
              </div>
              
              <Input
                label="Domicilio"
                name="domicilio"
                value={lubricentroFormData.domicilio}
                onChange={handleLubricentroChange}
                required
              />
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Teléfono"
                  name="phone"
                  value={lubricentroFormData.phone}
                  onChange={handleLubricentroChange}
                  required
                />
                
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={lubricentroFormData.email}
                  onChange={handleLubricentroChange}
                  required
                />
              </div>
              
              <Input
                label="CUIT"
                name="cuit"
                value={lubricentroFormData.cuit}
                onChange={handleLubricentroChange}
                disabled={userProfile?.role !== 'superadmin'}
                helperText={userProfile?.role !== 'superadmin' ? "Solo el Super Administrador puede cambiar el CUIT" : ""}
              />
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  color="primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" color="white" className="mr-2" />
                      Guardando...
                    </>
                  ) : (
                    'Actualizar Lubricentro'
                  )}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </PageContainer>
  );
};

export default UserProfilePage;