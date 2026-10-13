import { z } from 'zod';

// Content sanitization and PII redaction
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SEED_PHRASE_REGEX = /\b(?:seed|mnemonic|recovery)\s+(?:phrase|words|key)s?[\s:]+[\w\s]{20,}\b/gi;
const PRIVATE_KEY_REGEX = /\b(?:private|secret)[\s_-]?key[\s:]+[\w\/\+]{20,}\b/gi;
const TOKEN_REGEX = /\b(?:token|bearer|api[_-]?key)[\s:=]+[\w\-\.]{20,}\b/gi;
const CREDIT_CARD_REGEX = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

export function redactSensitiveContent(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  let sanitized = text;
  sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL_REDACTED]');
  sanitized = sanitized.replace(PHONE_REGEX, '[PHONE_REDACTED]');
  sanitized = sanitized.replace(SEED_PHRASE_REGEX, '[SEED_PHRASE_REDACTED]');
  sanitized = sanitized.replace(PRIVATE_KEY_REGEX, '[PRIVATE_KEY_REDACTED]');
  sanitized = sanitized.replace(TOKEN_REGEX, '[TOKEN_REDACTED]');
  sanitized = sanitized.replace(CREDIT_CARD_REGEX, '[CARD_NUMBER_REDACTED]');
  
  return sanitized;
}

export function enforceMaxLength(text: string, maxLength: number = 10000): string {
  if (!text) return text;
  return text.slice(0, maxLength);
}

// AI Model Response Schema
export const AiVerdictSchema = z.object({
  isFakeAccount: z.boolean().default(false),
  riskScore: z.number().min(0).max(100).default(0),
  threatType: z.enum([
    'impersonation_phishing',
    'advance_fee_extortion',
    'fake_support_scam',
    'account_takeover_lure',
    'suspicious_inquiry',
    'benign_collaboration',
    'unknown'
  ]).default('unknown'),
  reasoning: z.string().max(2000).default(''),
  extractedIndicators: z.array(z.string().max(500)).max(50).default([]),
  recommendedAction: z.enum([
    'block_and_takedown',
    'quarantine',
    'mark_safe',
    'investigate'
  ]).default('investigate')
});

export type AiVerdict = z.infer<typeof AiVerdictSchema>;

// Sender Profile Schema
export const SenderProfileSchema = z.object({
  id: z.string().max(200).optional(),
  platform: z.string().max(50),
  username: z.string().min(1).max(200),
  displayName: z.string().max(200).optional(),
  avatarUrl: z.string().max(2000).optional(),
  bio: z.string().max(5000).optional(),
  followerCount: z.number().min(0).max(10000000000).optional(),
  followingCount: z.number().min(0).max(10000000000).optional(),
  isVerifiedBadge: z.boolean().optional(),
  isFakeBadgeEmoji: z.boolean().optional()
});

// Analyze Message Schema
export const AnalyzeMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  sender: SenderProfileSchema,
  brandId: z.string().uuid().optional()
});

// Inbound Save Message Schema
export const InboundSaveSchema = z.object({
  platform: z.string().min(1).max(50),
  content: z.string().min(1).max(10000),
  sender: SenderProfileSchema,
  brandId: z.string().uuid().optional()
});

// Takedown Request Schema
export const TakedownRequestSchema = z.object({
  messageId: z.string().min(1).max(200),
  targetType: z.enum([
    'platform_impersonation',
    'rogue_app',
    'domain_phishing',
    'telegram_abuse'
  ]),
  brandId: z.string().uuid().optional()
});

// Webhook signature validation
export function validateHexSignature(signature: string, expectedLength: number = 64): boolean {
  const hexRegex = new RegExp(`^[0-9a-fA-F]{${expectedLength}}$`);
  return hexRegex.test(signature);
}

// UUID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}
