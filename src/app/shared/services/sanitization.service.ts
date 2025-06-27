import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SanitizationService {
  constructor(private sanitizer: DomSanitizer) {}

  // Regex patterns
  static readonly PATTERNS = {
    DISCORD_ID: /^\d{17,19}$/,
    DISCORD_USERNAME: /^[\w\d._-]{2,32}$/,
    DISCORD_DISCRIMINATOR: /^\d{4}$/,
    GUILD_NAME: /^[\w\d\s._-]{2,100}$/,
    CHANNEL_NAME: /^[\w\d\s._-]{2,100}$/,
    CAMPUS_NAME: /^[\w\d\s._-]{2,100}$/,
    FORMATION_NAME: /^[\w\d\s._-]{2,100}$/,
    PROMO_NAME: /^[\w\d\s._-]{2,100}$/,
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  };

  // Sanitize HTML
  sanitizeHtml(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }

  // Sanitize text input
  sanitizeText(value: string): string {
    if (!value) return '';
    return value
      .replace(/[<>]/g, '') // Supprime les balises HTML
      .replace(/javascript:/gi, '') // Supprime les protocoles javascript
      .replace(/on\w+=/gi, '') // Supprime les événements inline
      .trim();
  }

  // Sanitize Discord ID
  sanitizeDiscordId(value: string): string {
    if (!value) return '';
    return value.replace(/[^\d]/g, '');
  }

  // Sanitize Discord username
  sanitizeDiscordUsername(value: string): string {
    if (!value) return '';
    return value
      .replace(/[^\w\d._-]/g, '')
      .substring(0, 32);
  }

  // Sanitize guild/channel/campus/formation name
  sanitizeName(value: string): string {
    if (!value) return '';
    return value
      .replace(/[^\w\d\s._-]/g, '')
      .substring(0, 100)
      .trim();
  }

  // Sanitize email
  sanitizeEmail(value: string): string {
    if (!value) return '';
    return value.toLowerCase().trim();
  }

  // Validate against pattern
  validatePattern(value: string, pattern: RegExp): boolean {
    return pattern.test(value);
  }
} 