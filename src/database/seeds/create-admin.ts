// Creates the platform admin. Admins can't sign up through the API.
// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { Worker } from '../../workers/worker.entity';
import { WorkerRole } from '../../workers/enum/worker-role.enum';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  }

  await dataSource.initialize();

  try {
    const repository = dataSource.getRepository(Worker);

    if (await repository.existsBy({ email })) {
      console.log(`Worker with email ${email} already exists, skipping`);
      return;
    }

    await repository.save(
      repository.create({
        name: process.env.ADMIN_NAME ?? 'Admin',
        lastname: process.env.ADMIN_LASTNAME ?? 'Admin',
        phoneNumber: process.env.ADMIN_PHONE ?? '0000000000',
        email,
        password: await bcrypt.hash(password, 10),
        role: WorkerRole.ADMIN,
      }),
    );

    console.log(`Admin ${email} created`);
  } finally {
    await dataSource.destroy();
  }
}

createAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
