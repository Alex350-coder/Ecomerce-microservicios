import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminFetchProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminFetchCategories,
  type CreateProductInput,
} from '../../api/admin';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import '../../styles/pages/admin/ProductForm.css';

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    description: '',
    price: 0,
    images: [],
    features: [],
    categoryId: '',
    isNew: false,
    isFeatured: false,
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminFetchCategories,
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-edit', id],
    queryFn: () => adminFetchProducts({ limit: 100 }),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && productsData?.data) {
      const product = productsData.data.find((p) => p.id === id);
      if (product) {
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice ?? undefined,
          images: product.images,
          features: product.features,
          categoryId: product.category?.id ?? '',
          isNew: product.isNew,
          isFeatured: product.isFeatured,
        });
      }
    }
  }, [isEdit, id, productsData]);

  const createMutation = useMutation({
    mutationFn: adminCreateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/admin/products');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: CreateProductInput) => adminUpdateProduct(id!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/admin/products');
    },
  });

  const handleChange = <K extends keyof CreateProductInput>(
    field: K,
    value: CreateProductInput[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="admin-page-header">
        <h1>{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h1>
        <p>{isEdit ? 'Actualiza la información del producto' : 'Agrega un producto al catálogo'}</p>
      </div>

      <form className="product-form" onSubmit={handleSubmit}>
        <Input
          label="Nombre del Producto"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          disabled={isPending}
        />

        <div className="input-container" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label className="input-label">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            required
            disabled={isPending}
            className="input"
          />
        </div>

        <div className="product-form__grid">
          <Input
            label="Precio"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
            required
            disabled={isPending}
          />

          <Input
            label="Precio Original (opcional)"
            type="number"
            step="0.01"
            min="0"
            value={formData.originalPrice ?? ''}
            onChange={(e) => handleChange('originalPrice', parseFloat(e.target.value) || undefined)}
            disabled={isPending}
          />
        </div>

        <div className="input-container" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label className="input-label">Categoría</label>
          <select
            className="input"
            value={formData.categoryId}
            onChange={(e) => handleChange('categoryId', e.target.value)}
            disabled={isPending}
          >
            <option value="">Sin categoría</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="product-form__actions">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
