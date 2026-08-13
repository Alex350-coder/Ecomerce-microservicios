import React, { useState } from 'react';
import { AuthLayout } from '../templates/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/pages/Register.css';

export const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState('');
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar mensajes cuando el usuario empiece a escribir
    if (error) setError('');
    if (success) setSuccess('');
  };

  // 🆕 Verificar si el email ya existe antes de registrar
  const checkEmailExists = async () => {
    // En un sistema completo, aquí harías una petición para verificar
    // Por ahora simulamos que no existe
    return false;
  };

  // 🆕 Iniciar verificación de email
  const initiateEmailVerification = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al enviar email de verificación');
      }

      setSuccess('Email de verificación enviado. Revisa tu bandeja de entrada.');
    } catch (error) {
      console.error('Error en verificación:', error);
      // No mostramos error para no confundir al usuario
    }
  };

  // 🆕 Verificar email inmediatamente (simulación)
  const verifyEmail = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/verify-email`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al verificar email');
      }

      setSuccess('¡Email verificado correctamente!');
      setShowEmailVerification(false);
    } catch (error) {
      console.error('Error en verificación:', error);
      setError('Error al verificar el email. Intenta nuevamente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validaciones mejoradas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      setError('Nombre y apellido son requeridos');
      setIsLoading(false);
      return;
    }

    try {
      // 🆕 Verificar si el email ya existe (simulación)
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setError('Este email ya está registrado. ¿Olvidaste tu contraseña?');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 🆕 Manejo específico de errores del backend
        if (response.status === 409) {
          setError('Este email ya está registrado. ¿Olvidaste tu contraseña?');
        } else if (response.status === 400) {
          setError('Datos inválidos. Verifica la información ingresada.');
        } else {
          throw new Error(data.message || 'Error en el registro');
        }
        setIsLoading(false);
        return;
      }

      // 🆕 Registro exitoso - nuevas funcionalidades
      console.log('Usuario registrado:', data);
      setRegisteredUserId(data.id);

      // 🆕 Mostrar opción de verificación de email
      setShowEmailVerification(true);
      setSuccess('¡Cuenta creada exitosamente! ');

      // 🆕 Iniciar verificación de email automáticamente
      await initiateEmailVerification(data.id);
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error.message || 'Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Navegar al login
  const handleGoToLogin = () => {
    navigate('/login', {
      state: { message: 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.' },
    });
  };

  // 🆕 Reenviar verificación de email
  const handleResendVerification = async () => {
    if (!registeredUserId) return;

    setIsLoading(true);
    setError('');
    await initiateEmailVerification(registeredUserId);
    setIsLoading(false);
  };

  return (
    <AuthLayout>
      <Card className="register-card">
        <div className="register-header">
          <div className="register-logo">
            <div className="logo-icon">E</div>
            <h2>ElectroShop</h2>
          </div>
          <h1>Crear Cuenta</h1>
          <p>Únete a nuestra comunidad</p>
        </div>

        {/* 🆕 Mensaje de éxito */}
        {success && (
          <div className="success-message">
            {success}
            {showEmailVerification && (
              <div className="verification-actions">
                <p>¿No recibiste el email?</p>
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Reenviar verificación'}
                </button>
                <button
                  type="button"
                  className="verify-now-button"
                  onClick={() => verifyEmail(registeredUserId)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Verificando...' : 'Verificar ahora'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 🆕 Mostrar formulario solo si no hay registro exitoso */}
        {!showEmailVerification && (
          <>
            {error && (
              <div className="error-message">
                {error}
                {error.includes('ya está registrado') && (
                  <div className="error-actions">
                    <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                  </div>
                )}
              </div>
            )}

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="name-fields">
                <Input
                  label="Nombre"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Input
                  label="Apellido"
                  type="text"
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled={isLoading}
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />

              <div className="terms-options">
                <label className="accept-terms">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                    required
                    disabled={isLoading}
                  />
                  Acepto los <a href="/terms">términos y condiciones</a>
                </label>
              </div>

              <Button
                type="submit"
                className="register-button"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>
          </>
        )}

        {/* 🆕 Acciones después del registro exitoso */}
        {showEmailVerification && (
          <div className="post-registration-actions">
            <Button onClick={handleGoToLogin} className="login-button">
              Ir a Iniciar Sesión
            </Button>
          </div>
        )}

        <div className="register-footer">
          <p>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};
