import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Roles
const roles = [
  {
    name: 'admin',
    description: 'Administrator role with full access',
    isDefault: false,
  },
  {
    name: 'user',
    description: 'Default user role with limited access',
    isDefault: true,
  },
];

// Permissions focused on GitHub repositories and user management
const permissions = [
  // User management permissions
  {
    name: 'user:read',
    description: 'Can read user information',
    resource: 'user',
    action: 'read',
  },
  {
    name: 'user:write',
    description: 'Can create and update user information',
    resource: 'user',
    action: 'write',
  },
  {
    name: 'user:delete',
    description: 'Can delete users',
    resource: 'user',
    action: 'delete',
  },

  // Role management permissions
  {
    name: 'role:read',
    description: 'Can read role information',
    resource: 'role',
    action: 'read',
  },
  {
    name: 'role:write',
    description: 'Can create and update roles',
    resource: 'role',
    action: 'write',
  },
  {
    name: 'role:delete',
    description: 'Can delete roles',
    resource: 'role',
    action: 'delete',
  },

  // GitHub repository management permissions
  {
    name: 'repository:read',
    description: 'Can view GitHub repositories',
    resource: 'repository',
    action: 'read',
  },
  {
    name: 'repository:write',
    description: 'Can add and update GitHub repositories',
    resource: 'repository',
    action: 'write',
  },
  {
    name: 'repository:delete',
    description: 'Can delete GitHub repositories',
    resource: 'repository',
    action: 'delete',
  },
  {
    name: 'repository:sync',
    description: 'Can trigger repository synchronization',
    resource: 'repository',
    action: 'sync',
  },
  {
    name: 'repository:manage',
    description: 'Can manage repository settings and metadata',
    resource: 'repository',
    action: 'manage',
  },
];

// Map of role names to permissions they should have
const rolePermissionsMap = {
  admin: [
    // Full user management
    'user:read',
    'user:write',
    'user:delete',
    // Full role management
    'role:read',
    'role:write',
    'role:delete',
    // Full repository management
    'repository:read',
    'repository:write',
    'repository:delete',
    'repository:sync',
    'repository:manage',
  ],
  user: [
    // Limited user access
    'user:read',
    // Full repository access for regular users
    'repository:read',
    'repository:write',
    'repository:sync',
    'repository:manage',
  ],
};

// Default admin user
const adminUser = {
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  password: 'Admin@123', // This will be hashed before saving
};

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  console.log('👥 Creating roles...');
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    console.log(`✅ Role created: ${role.name}`);
  }

  // Create permissions
  console.log('🔐 Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
    console.log(`✅ Permission created: ${permission.name}`);
  }

  // Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...');
  for (const [roleName, permissionNames] of Object.entries(rolePermissionsMap)) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      console.error(`❌ Role ${roleName} not found`);
      continue;
    }

    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        console.error(`❌ Permission ${permissionName} not found`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(`✅ Permissions assigned to ${roleName}`);
  }

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await hashPassword(adminUser.password);

  const user = await prisma.user.upsert({
    where: { email: adminUser.email },
    update: {},
    create: {
      email: adminUser.email,
      passwordHash: hashedPassword,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    },
  });
  console.log(`✅ Admin user created: ${user.email}`);

  // Assign admin role to admin user
  console.log('🔗 Assigning admin role to admin user...');
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  if (user && adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });
    console.log('✅ Admin role assigned to user');

    // Create sample GitHub repositories
    console.log('📁 Creating sample GitHub repositories...');
    await prisma.gitHubRepository.createMany({
      data: [
        {
          githubPath: 'nestjs/nest',
          repositoryUrl: 'https://github.com/nestjs/nest',
          name: 'NestJS',
          description: 'A progressive Node.js framework for building efficient, scalable, and enterprise-grade server-side applications with TypeScript/JavaScript 🚀',
          owner: 'nestjs',
          stars: 67000,
          forks: 7800,
          openIssues: 45,
          syncStatus: 'completed',
          lastSyncAt: new Date(),
          addedByUserId: user.id,
          createdAtGitHub: new Date('2017-02-07T21:00:13Z'),
        },
        {
          githubPath: 'facebook/react',
          repositoryUrl: 'https://github.com/facebook/react',
          name: 'React',
          description: 'The library for web and native user interfaces.',
          owner: 'facebook',
          stars: 228000,
          forks: 46000,
          openIssues: 1200,
          syncStatus: 'completed',
          lastSyncAt: new Date(),
          addedByUserId: user.id,
          createdAtGitHub: new Date('2013-05-24T16:15:54Z'),
        },
        {
          githubPath: 'microsoft/typescript',
          repositoryUrl: 'https://github.com/microsoft/typescript',
          name: 'TypeScript',
          description: 'TypeScript is a superset of JavaScript that compiles to clean JavaScript output.',
          owner: 'microsoft',
          stars: 100000,
          forks: 12000,
          openIssues: 5600,
          syncStatus: 'pending',
          addedByUserId: user.id,
          createdAtGitHub: new Date('2012-10-01T15:59:36Z'),
        },
        {
          githubPath: 'vercel/next.js',
          repositoryUrl: 'https://github.com/vercel/next.js',
          name: 'Next.js',
          description: 'The React Framework for Production',
          owner: 'vercel',
          stars: 125000,
          forks: 26000,
          openIssues: 2800,
          syncStatus: 'failed',
          syncError: 'Rate limit exceeded',
          addedByUserId: user.id,
          createdAtGitHub: new Date('2016-10-05T00:12:42Z'),
        },
        {
          githubPath: 'prisma/prisma',
          repositoryUrl: 'https://github.com/prisma/prisma',
          name: 'Prisma',
          description: 'Next-generation Node.js and TypeScript ORM',
          owner: 'prisma',
          stars: 39000,
          forks: 1500,
          openIssues: 3200,
          syncStatus: 'completed',
          lastSyncAt: new Date(),
          addedByUserId: user.id,
          createdAtGitHub: new Date('2016-05-11T13:24:13Z'),
        },
        {
          githubPath: 'nodejs/node',
          repositoryUrl: 'https://github.com/nodejs/node',
          name: 'Node.js',
          description: 'Node.js JavaScript runtime ✨🐢🚀✨',
          owner: 'nodejs',
          stars: 107000,
          forks: 29000,
          openIssues: 1800,
          syncStatus: 'completed',
          lastSyncAt: new Date(),
          addedByUserId: user.id,
          createdAtGitHub: new Date('2014-11-26T19:33:14Z'),
        },
        {
          githubPath: 'expressjs/express',
          repositoryUrl: 'https://github.com/expressjs/express',
          name: 'Express',
          description: 'Fast, unopinionated, minimalist web framework for node.',
          owner: 'expressjs',
          stars: 65000,
          forks: 15000,
          openIssues: 250,
          syncStatus: 'completed',
          lastSyncAt: new Date(),
          addedByUserId: user.id,
          createdAtGitHub: new Date('2009-06-26T18:56:23Z'),
        },
        {
          githubPath: 'microsoft/vscode',
          repositoryUrl: 'https://github.com/microsoft/vscode',
          name: 'Visual Studio Code',
          description: 'Visual Studio Code',
          owner: 'microsoft',
          stars: 163000,
          forks: 29000,
          openIssues: 9000,
          syncStatus: 'pending',
          addedByUserId: user.id,
          createdAtGitHub: new Date('2015-09-03T20:23:51Z'),
        },
      ],
    });
    console.log('✅ Sample GitHub repositories created');
  }

  console.log('🎉 Seeding completed successfully!');

  // Show summary
  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();
  const userCount = await prisma.user.count();
  const repoCount = await prisma.gitHubRepository.count();

  console.log('\n📊 Database Summary:');
  console.log(`   👥 Roles: ${roleCount}`);
  console.log(`   🔐 Permissions: ${permissionCount}`);
  console.log(`   👤 Users: ${userCount}`);
  console.log(`   📁 Repositories: ${repoCount}`);
}

main()
  .catch((e) => {
    console.error('💥 Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
  });
