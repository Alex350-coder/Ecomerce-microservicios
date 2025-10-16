import React, { useState } from 'react';
import { AuthLayout } from '../templates/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import '../styles/pages/Register.css';

export const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }
    
    console.log('Registro attempt:', formData);
    
    setTimeout(() => {
      setIsLoading(false);
      // Aquí manejaríamos el registro real
    }, 1000);
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

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="name-fields">
            <Input
              label="Nombre"
              type="text"
              placeholder="Tu nombre"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              required
            />
            <Input
              label="Apellido"
              type="text"
              placeholder="Tu apellido"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
            />
          </div>
          
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
          
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
          />
          
          <Input
            label="Confirmar Contraseña"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            required
          />
          
          <div className="terms-options">
            <label className="accept-terms">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                required
              />
              Acepto los <a href="/terms">términos y condiciones</a>
            </label>
          </div>

          <Button 
            type="submit" 
            className="register-button"
            isLoading={isLoading}
          >
            Crear Cuenta
          </Button>
        </form>

        <div className="register-footer">
          <p>¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
        </div>
      </Card>
    </AuthLayout>
  );
};