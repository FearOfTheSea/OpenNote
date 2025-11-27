export function validateName(name: string): boolean {
  // Pattern explanation:
  // {1,255}$ - Length between 1 and 255
  // Uses only a-z, A-Z, spaces, dots, dashes and underscores
  const pattern = /^[a-zA-Z0-9._\-\s]{1,255}$/;
  return pattern.test(name);
}

export function randomUUID() {
  return crypto.randomUUID();
}
