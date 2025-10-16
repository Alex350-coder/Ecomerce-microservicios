import React from 'react';
import { MainLayout } from '../../templates/MainLayout';
import { Card } from '../../components/ui/Card';
import '../../styles/pages/FastLinks/About.css';

export const About = () => {
  return (
    <MainLayout>
      <div className="about-page">
        <div className="about-header">
          <h1>Sobre Nosotros</h1>
          <p>Conoce más sobre ElectroShop y nuestra misión</p>
        </div>

        <div className="about-content">
          <Card className="about-section">
            <h2>Nuestra Historia</h2>
            <p>
              ElectroShop nació en 2020 con la visión de revolucionar la forma en que 
              las personas compran tecnología. Empezamos como una pequeña tienda online 
              y hoy somos líderes en venta de productos electrónicos en Latinoamérica.
            </p>
          </Card>

          <Card className="about-section">
            <h2>Nuestra Misión</h2>
            <p>
              Hacer la tecnología accesible para todos, ofreciendo productos de calidad 
              a precios competitivos, con un servicio al cliente excepcional y envíos 
              rápidos a todo el país.
            </p>
          </Card>

          <div className="stats-grid">
            <Card className="stat-card">
              <h3>50,000+</h3>
              <p>Clientes satisfechos</p>
            </Card>
            <Card className="stat-card">
              <h3>100+</h3>
              <p>Marcas asociadas</p>
            </Card>
            <Card className="stat-card">
              <h3>24/7</h3>
              <p>Soporte al cliente</p>
            </Card>
            <Card className="stat-card">
              <h3>5★</h3>
              <p>Calificación promedio</p>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};