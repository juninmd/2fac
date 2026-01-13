export interface TwoFAItem {
    id: string;
    account: string;
    issuer: string;
    secret: string;
    description?: string;
    algorithm?: string;
    digits?: number;
    period?: number;
    encoding?: string;
    type?: string;
}
