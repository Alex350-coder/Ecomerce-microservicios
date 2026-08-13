import React, { useState, useEffect } from 'react';
import { MainLayout } from '../templates/MainLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import '../styles/pages/Account.css';

export const Account = () => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    zipCode: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 🆕 Estados para cambiar contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 🆕 Cargar datos del usuario al montar el componente
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (token && user.id) {
      // 🆕 Obtener datos actualizados del usuario
      fetchUserData(user.id);
    } else {
      setError('No hay usuario logueado');
    }
  }, []);

  // 🆕 Obtener datos del usuario desde el user-service
  const fetchUserData = async (userId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3001/users/profile/${userId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del usuario');
      }
      
      const user = await response.json();
      setUserData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      }));
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar datos del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 🆕 Actualizar perfil en el user-service
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3001/users/profile/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }

      const updatedUser = await response.json();
      
      // 🆕 Actualizar localStorage con nuevos datos
      localStorage.setItem('user', JSON.stringify({
        ...user,
        ...updatedUser
      }));
      
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 🆕 Recargar datos originales
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(prev => ({
      ...prev,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || ''
    }));
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // 🆕 Cambiar contraseña
  const handleChangePassword = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3002/auth/${user.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar contraseña');
      }

      setSuccess('Contraseña cambiada correctamente');
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al cambiar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // 🆕 Verificación de email
  const handleVerifyEmail = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3002/auth/${user.id}/verify-email`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Error al verificar email');
      }

      setSuccess('Email verificado correctamente');
      
      // Actualizar estado en localStorage
      const updatedUser = { ...user, emailVerified: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al verificar email');
    } finally {
      setIsLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <MainLayout>
      <div className="account-page">
        <div className="account-header">
          <h1>Mi Cuenta</h1>
          <p>Gestiona tu información personal y preferencias</p>
        </div>

        {/* 🆕 Mensajes de éxito/error */}
        {error && (
          <div className="account-message error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="account-message success-message">
            {success}
          </div>
        )}

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
                  disabled={isLoading}
                >
                  Editar Información
                </Button>
              ) : (
                <div className="edit-actions">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSave}
                    isLoading={isLoading}
                    disabled={isLoading}
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
                  disabled={!isEditing || isLoading}
                />
                <Input
                  label="Apellido"
                  value={userData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  disabled={!isEditing || isLoading}
                />
                <Input
                  label="Correo Electrónico"
                  type="email"
                  value={userData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!isEditing || isLoading}
                />
                <div className="email-verification">
                  <span className={`verification-status ${user.emailVerified ? 'verified' : 'not-verified'}`}>
                    {user.emailVerified ? '✓ Email verificado' : '✗ Email no verificado'}
                  </span>
                  {!user.emailVerified && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleVerifyEmail}
                      disabled={isLoading}
                    >
                      Verificar Email
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* 🆕 Cambiar Contraseña */}
          {showChangePassword ? (
            <Card className="account-section">
              <div className="section-header">
                <h2>Cambiar Contraseña</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowChangePassword(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
              
              <div className="password-change-form">
                <Input
                  label="Contraseña Actual"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({
                    ...prev,
                    currentPassword: e.target.value
                  }))}
                  disabled={isLoading}
                />
                <Input
                  label="Nueva Contraseña"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                  disabled={isLoading}
                />
                <Input
                  label="Confirmar Nueva Contraseña"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                  disabled={isLoading}
                />
                <Button 
                  variant="primary"
                  onClick={handleChangePassword}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  Cambiar Contraseña
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="account-section">
              <h2>Seguridad</h2>
              <div className="security-actions">
                <div className="action-item">
                  <h3>Contraseña</h3>
                  <p>Actualiza tu contraseña de acceso regularmente</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Cambiar Contraseña
                  </Button>
                </div>
              </div>
            </Card>
          )}

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
                <h3>Cerrar Sesión</h3>
                <p>Salir de tu cuenta de forma segura</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                >
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