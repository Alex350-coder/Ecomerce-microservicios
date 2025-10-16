import React, { useState } from 'react';
import { MainLayout } from '../templates/MainLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import '../styles/pages/Account.css';

export const Account = () => {
  const [userData, setUserData] = useState({
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+1 234 567 8900',
    address: 'Calle Principal 123',
    city: 'Ciudad',
    country: 'País',
    zipCode: '12345'
  });
  
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar en el backend
    console.log('Datos guardados:', userData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Podríamos resetear los datos aquí
    setIsEditing(false);
  };

  return (
    <MainLayout>
      <div className="account-page">
        <div className="account-header">
          <h1>Mi Cuenta</h1>
          <p>Gestiona tu información personal y preferencias</p>
        </div>

        <div className="account-content">
          {/* Información Personal */}
          <Card className="account-section">
            <div className="section-header">
              <h2>Información Personal</h2>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Editar Información
                </Button>
              ) : (
                <div className="edit-actions">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSave}
                  >
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </div>

            <div className="personal-info">
              <div className="info-grid">
                <Input
                  label="Nombre"
                  value={userData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Apellido"
                  value={userData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Correo Electrónico"
                  type="email"
                  value={userData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Teléfono"
                  value={userData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </Card>

          {/* Dirección */}
          <Card className="account-section">
            <h2>Dirección de Envío</h2>
            <div className="address-info">
              <div className="info-grid">
                <Input
                  label="Dirección"
                  value={userData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Ciudad"
                  value={userData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="País"
                  value={userData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Código Postal"
                  value={userData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </Card>

          {/* Acciones de Cuenta */}
          <Card className="account-section">
            <h2>Acciones de Cuenta</h2>
            <div className="account-actions">
              <div className="action-item">
                <h3>Historial de Pedidos</h3>
                <p>Revisa tus pedidos anteriores y su estado</p>
                <Button variant="outline" size="sm">
                  Ver Historial
                </Button>
              </div>
              
              <div className="action-item">
                <h3>Cambiar Contraseña</h3>
                <p>Actualiza tu contraseña de acceso</p>
                <Button variant="outline" size="sm">
                  Cambiar Contraseña
                </Button>
              </div>
              
              <div className="action-item">
                <h3>Cerrar Sesión</h3>
                <p>Salir de tu cuenta de forma segura</p>
                <Button variant="outline" size="sm">
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};