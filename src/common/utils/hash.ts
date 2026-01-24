import * as bcrypt from 'bcrypt';

async function createHash(s: string) {
  const saltOrRounds = 10;
  return await bcrypt.hash(s, saltOrRounds);
}

async function compareWithHash(s: string, hash: string) {
  return await bcrypt.compare(s, hash);
}

export { createHash, compareWithHash };
