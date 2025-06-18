# Operantis - Sistema Integral de Gestión para PYMEs

Sistema ERP moderno y escalable desarrollado con Node.js, Express, PostgreSQL y React.

## 🚀 Características

- 🔐 Autenticación segura con JWT
- 👥 Gestión de usuarios y roles
- 📦 Gestión de productos y stock
- 💰 Gestión de ventas
- 📊 Reportes y visualizaciones
- 📱 API REST documentada con Swagger
- 🐳 Contenedorización con Docker
- 🔄 CI/CD con GitHub Actions

## 🛠️ Requisitos Previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- Git
- Docker y Docker Compose (opcional)

## 📦 Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/operantis.git
   cd operantis
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Editar el archivo `.env` con tus configuraciones.

4. Inicializar la base de datos:
   ```bash
   npx prisma migrate dev
   ```

5. Iniciar el servidor:
   ```bash
   # Desarrollo
   npm run dev

   # Producción
   npm start
   ```

## 🐳 Docker

Para ejecutar con Docker:

```bash
# Construir y ejecutar con Docker Compose
docker-compose up --build
```

## 📚 Documentación de la API

La documentación de la API está disponible en:
- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs.json`

## 🧪 Pruebas

```bash
# Ejecutar pruebas
npm test
```

## 📁 Estructura del Proyecto

```
operantis/
├── src/
│   ├── controllers/    # Controladores de la API
│   ├── middleware/     # Middleware personalizado
│   ├── models/         # Modelos de la base de datos
│   ├── routes/         # Rutas de la API
│   ├── services/       # Lógica de negocio
│   └── utils/          # Funciones auxiliares
├── prisma/            # Esquema y migraciones de la base de datos
├── tests/             # Archivos de prueba
└── docs/              # Documentación
```

## 🔒 Seguridad

- Autenticación basada en JWT
- Cifrado de contraseñas con bcrypt
- Protección contra ataques comunes con helmet
- Validación de datos de entrada
- CORS configurado
- Rate limiting implementado

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📧 Contacto

Tu Nombre - [@tutwitter](https://twitter.com/tutwitter) - email@example.com

Link del Proyecto: [https://github.com/tu-usuario/operantis](https://github.com/tu-usuario/operantis) 