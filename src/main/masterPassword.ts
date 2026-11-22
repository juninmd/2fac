export const MIN_MASTER_PASSWORD_LENGTH = 4;
// Upper bound keeps an arbitrary IPC payload from feeding a huge string to the KDF.
const MAX_MASTER_PASSWORD_LENGTH = 1024;

export const isValidMasterPassword = (password: unknown): password is string =>
    typeof password === 'string' &&
    password.length >= MIN_MASTER_PASSWORD_LENGTH &&
    password.length <= MAX_MASTER_PASSWORD_LENGTH;
