const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Crear roles predefinidos
    console.log('Creando roles...');
    const roles = ['ADMIN', 'MANAGER', 'USER'];
    const createdRoles = {};
    
    for (const role of roles) {
      const createdRole = await prisma.role.upsert({
        where: { name: role },
        update: {},
        create: { name: role }
      });
      createdRoles[role] = createdRole;
    }
    console.log('✅ Roles creados exitosamente');

    // Crear usuario administrador
    console.log('Creando usuario administrador...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.upsert({
      where: { email: 'admin@operantis.com' },
      update: {},
      create: {
        email: 'admin@operantis.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'Operantis',
        role: 'ADMIN',
        roleId: createdRoles['ADMIN'].id,
        isActive: true
      }
    });
    console.log('✅ Usuario administrador creado exitosamente');

    // Crear algunos productos de ejemplo
    console.log('Creando productos de ejemplo...');
    const products = [
      {
        name: 'Laptop HP',
        description: 'Laptop HP 15.6" Intel Core i5',
        price: 899.99,
        stock: 10,
        sku: 'LAP-001'
      },
      {
        name: 'Monitor Dell',
        description: 'Monitor Dell 24" Full HD',
        price: 199.99,
        stock: 15,
        sku: 'MON-001'
      },
      {
        name: 'Teclado Mecánico',
        description: 'Teclado mecánico RGB',
        price: 79.99,
        stock: 20,
        sku: 'TEC-001'
      }
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product
      });
    }
    console.log('✅ Productos de ejemplo creados exitosamente');

  } catch (error) {
    console.error('Error durante el seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 