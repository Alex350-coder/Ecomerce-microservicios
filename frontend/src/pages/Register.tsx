import { useState, type FormEvent } from 'react';
import { AuthLayout } from '../templates/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, ApiError } from '../api/client';
import '../styles/pages/Register.css';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export const Register = () => {
  const [formData, setFormData] = useState<RegisterForm>({
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
  const navigate = useNavigate();

  const handleChange = <K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const checkEmailExists = async (): Promise<boolean> => {
    return false;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

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

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setIsLoading(false);
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      setError('Nombre y apellido son requeridos');
      setIsLoading(false);
      return;
    }

    try {
      const emailExists = await checkEmailExists();
      if (emailExists) {
        setError('Este email ya está registrado. ¿Olvidaste tu contraseña?');
        setIsLoading(false);
        return;
      }

      const data = await apiClient<{ message?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      setShowEmailVerification(true);
      setSuccess(data.message || '¡Cuenta creada exitosamente!');
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 400) {
        setError('Datos inválidos. Verifica la información ingresada.');
      } else if (err instanceof Error) {
        setError(err.message || 'Error al crear la cuenta. Intenta nuevamente.');
      } else {
        setError('Error al crear la cuenta. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', {
      state: { message: 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.' },
    });
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

        {success && (
          <div className="success-message">
            {success}
            {showEmailVerification && (
              <div className="verification-actions">
                <p>Revisa tu bandeja de entrada para verificar tu email.</p>
              </div>
            )}
          </div>
        )}

        {!showEmailVerification && (
          <>
            {error && (
              <div className="error-message">
                {error}
                <div className="error-actions">
                  <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                </div>
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
                minLength={8}
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
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
