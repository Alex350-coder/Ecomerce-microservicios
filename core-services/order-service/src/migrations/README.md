# Migraciones

Directorio para las migraciones TypeORM del servicio order-service.

## Comandos

```bash
# Generar migración desde el estado de las entidades
npm run migration:generate -- src/migrations/MigrationName

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir la última migración
npm run migration:revert
```

## Reglas (ADR-014)

- `synchronize` está desactivado en producción y solo se activa en desarrollo
  con el flag explícito `DB_SYNCHRONIZE=true`.
- Los cambios de esquema se versionan como migraciones en este directorio.
- Las migraciones se ejecutan automáticamente al arrancar el contenedor
  cuando `DB_MIGRATIONS_RUN=true` (por defecto en docker-compose).
