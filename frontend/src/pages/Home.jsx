import React from 'react';
import { MainLayout } from '../templates/MainLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import '../styles/pages/Home.css';

export const Home = () => {
  const featuredProducts = [
    {
      id: 1,
      name: 'iPhone 14 Pro',
      price: 999,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
      rating: 4.8,
    },
    {
      id: 2,
      name: 'Samsung Galaxy S23',
      price: 849,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
      rating: 4.6,
    },
    {
      id: 3,
      name: 'MacBook Pro 14"',
      price: 1999,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop',
      rating: 4.9,
    },
  ];

  return (
    <MainLayout>
      <div className="home">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero__content">
            <h1 className="hero__title">
              Descubre la <span className="hero__accent">Tecnología</span> del Futuro
            </h1>
            <p className="hero__description">
              Encuentra los mejores productos electrónicos con precios increíbles y envío rápido.
            </p>
            <div className="hero__actions">
              <Link to="/products">
                <Button size="lg">Comprar Ahora</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Productos Destacados */}
        <section className="featured">
          <h2 className="featured__title">Productos Destacados</h2>
          <div className="featured__grid">
            {featuredProducts.map((product) => (
              <Card key={product.id} hover className="product-card">
                <div className="product-card__image">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="product-card__content">
                  <h3 className="product-card__name">{product.name}</h3>
                  <div className="product-card__rating">
                    {'★'.repeat(5)}
                    <span>({product.rating})</span>
                  </div>
                  <div className="product-card__footer">
                    <span className="product-card__price">${product.price}</span>
                    <Button size="sm">Agregar al Carrito</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};
