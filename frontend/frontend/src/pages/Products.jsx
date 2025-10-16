import React, { useState, useEffect } from 'react';
import { MainLayout } from '../templates/MainLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import '../styles/pages/Products.css';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Datos de ejemplo (luego vendrán del backend)
  const sampleProducts = [
    {
      id: 1,
      name: 'iPhone 14 Pro',
      description: 'El último smartphone de Apple con Dynamic Island',
      price: 999,
      originalPrice: 1099,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
      category: 'smartphones',
      stock: 15,
      rating: 4.8,
      reviewCount: 124,
      features: ['128GB', '5G', 'Cámara 48MP', 'iOS 16'],
      isNew: true
    },
    {
      id: 2,
      name: 'Samsung Galaxy S23',
      description: 'Potente Android con Snapdragon 8 Gen 2',
      price: 849,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
      category: 'smartphones',
      stock: 20,
      rating: 4.6,
      reviewCount: 89,
      features: ['256GB', '5G', 'Triple Cámara', 'Android 13'],
      isNew: false
    },
    {
      id: 3,
      name: 'MacBook Pro 14"',
      description: 'Laptop profesional con chip M2 Pro',
      price: 1999,
      originalPrice: 2199,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop',
      category: 'laptops',
      stock: 8,
      rating: 4.9,
      reviewCount: 67,
      features: ['M2 Pro', '16GB RAM', '512GB SSD', 'macOS'],
      isNew: true
    },
    {
      id: 4,
      name: 'Dell XPS 13',
      description: 'Laptop ultrafina con pantalla InfinityEdge',
      price: 1299,
      image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=300&fit=crop',
      category: 'laptops',
      stock: 12,
      rating: 4.5,
      reviewCount: 203,
      features: ['Intel i7', '8GB RAM', '256GB SSD', 'Windows 11'],
      isNew: false
    },
    {
      id: 5,
      name: 'AirPods Pro',
      description: 'Audífonos inalámbricos con cancelación activa de ruido',
      price: 249,
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop',
      category: 'audio',
      stock: 25,
      rating: 4.7,
      reviewCount: 312,
      features: ['Cancelación ruido', 'Resistente agua', '24h batería'],
      isNew: false
    },
    {
      id: 6,
      name: 'Sony WH-1000XM4',
      description: 'Audífonos over-ear con sonido HD',
      price: 349,
      originalPrice: 399,
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop',
      category: 'audio',
      stock: 18,
      rating: 4.8,
      reviewCount: 189,
      features: ['30h batería', 'Touch controls', 'Asistente voz'],
      isNew: true
    },
    {
      id: 7,
      name: 'Apple Watch Series 8',
      description: 'Smartwatch con monitoreo de salud avanzado',
      price: 399,
      image: 'https://images.unsplash.com/photo-1579586337278-3f436c8e5d5a?w=400&h=300&fit=crop',
      category: 'wearables',
      stock: 22,
      rating: 4.6,
      reviewCount: 145,
      features: ['GPS', 'Resistente agua', 'Monitoreo sueño'],
      isNew: false
    },
    {
      id: 8,
      name: 'Samsung Galaxy Watch 5',
      description: 'Reloj inteligente con Body Composition',
      price: 279,
      originalPrice: 329,
      image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=300&fit=crop',
      category: 'wearables',
      stock: 14,
      rating: 4.4,
      reviewCount: 98,
      features: ['Android/iOS', 'GPS', 'NFC payments'],
      isNew: true
    },
    {
      id: 9,
      name: 'iPad Air',
      description: 'Tablet versátil con chip M1',
      price: 599,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
      category: 'tablets',
      stock: 10,
      rating: 4.7,
      reviewCount: 167,
      features: ['M1 Chip', '10.9"', '5G', 'iPadOS'],
      isNew: false
    },
    {
      id: 10,
      name: 'Samsung Galaxy Tab S8',
      description: 'Tablet Android de alto rendimiento',
      price: 699,
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop',
      category: 'tablets',
      stock: 7,
      rating: 4.5,
      reviewCount: 76,
      features: ['Snapdragon 8', '11" AMOLED', 'S Pen incluido'],
      isNew: true
    },
    {
      id: 11,
      name: 'Cargador MagSafe',
      description: 'Cargador magnético para dispositivos Apple',
      price: 39,
      image: 'https://images.unsplash.com/photo-1609592810794-3c6c06a32b9a?w=400&h=300&fit=crop',
      category: 'accessories',
      stock: 50,
      rating: 4.2,
      reviewCount: 89,
      features: ['15W', 'Magnético', 'Compatibilidad universal'],
      isNew: false
    },
    {
      id: 12,
      name: 'Fundas Personalizadas',
      description: 'Fundas protectoras para smartphones',
      price: 25,
      image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=300&fit=crop',
      category: 'accessories',
      stock: 100,
      rating: 4.3,
      reviewCount: 234,
      features: ['Anticaídas', 'Diseños únicos', 'Material premium'],
      isNew: false
    }
  ];

  const categories = [
    { id: 'all', name: 'Todos los Productos' },
    { id: 'smartphones', name: 'Smartphones' },
    { id: 'laptops', name: 'Laptops' },
    { id: 'tablets', name: 'Tablets' },
    { id: 'audio', name: 'Audio' },
    { id: 'wearables', name: 'Wearables' },
    { id: 'accessories', name: 'Accesorios' }
  ];

  // Simular carga desde API
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      setProducts(sampleProducts);
      setFilteredProducts(sampleProducts);
      setLoading(false);
    };

    loadProducts();
  }, []);

  // Filtros y búsqueda
  useEffect(() => {
    let result = products;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.isNew - a.isNew;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(result);
    setCurrentPage(1); // Resetear a primera página al filtrar
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Paginación
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handleAddToCart = (product) => {
    // Aquí iría la lógica para agregar al carrito
    console.log('Agregado al carrito:', product);
    alert(`${product.name} agregado al carrito`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="products-page">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando productos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="products-page">
        {/* Header */}
        <div className="products-header">
          <h1>Nuestros Productos</h1>
          <p>Descubre nuestra amplia gama de tecnología</p>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="products-filters">
          <div className="search-section">
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-section">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Ordenar por nombre</option>
              <option value="price-low">Precio: menor a mayor</option>
              <option value="price-high">Precio: mayor a menor</option>
              <option value="rating">Mejor valorados</option>
              <option value="newest">Más nuevos primero</option>
            </select>
          </div>
        </div>

        {/* Info de resultados */}
        <div className="products-info">
          <p>
            Mostrando {currentProducts.length} de {filteredProducts.length} productos
            {selectedCategory !== 'all' && ` en ${categories.find(c => c.id === selectedCategory)?.name}`}
            {searchTerm && ` para "${searchTerm}"`}
          </p>
        </div>

        {/* Grid de Productos */}
        <div className="products-grid">
          {currentProducts.map((product) => (
            <Card key={product.id} hover className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                {product.isNew && <span className="new-badge">Nuevo</span>}
                {product.originalPrice && (
                  <span className="discount-badge">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              <div className="product-content">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                
                <div className="product-features">
                  {product.features.slice(0, 2).map((feature, index) => (
                    <span key={index} className="feature-tag">{feature}</span>
                  ))}
                  {product.features.length > 2 && (
                    <span className="feature-tag">+{product.features.length - 2} más</span>
                  )}
                </div>

                <div className="product-rating">
                  <span className="stars">{'★'.repeat(Math.floor(product.rating))}</span>
                  <span className="rating-text">({product.rating}) • {product.reviewCount} reviews</span>
                </div>

                <div className="product-footer">
                  <div className="product-prices">
                    <span className="current-price">${product.price}</span>
                    {product.originalPrice && (
                      <span className="original-price">${product.originalPrice}</span>
                    )}
                  </div>
                  
                  <div className="product-stock">
                    <span className={`stock-status ${product.stock > 10 ? 'in-stock' : 'low-stock'}`}>
                      {product.stock > 10 ? 'En stock' : `Solo ${product.stock} left`}
                    </span>
                  </div>
                </div>

                <Button 
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="products-pagination">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Anterior
            </Button>
            
            <div className="pagination-info">
              Página {currentPage} de {totalPages}
            </div>
            
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}

        {/* Sin resultados */}
        {currentProducts.length === 0 && (
          <div className="no-products">
            <h3>No se encontraron productos</h3>
            <p>Intenta con otros filtros o términos de búsqueda</p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};