import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SanitizationService } from '../services/sanitization.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomValidators {
  private sanitizationService: SanitizationService;

  constructor(private sanitizer: DomSanitizer) {
    this.sanitizationService = new SanitizationService(this.sanitizer);
  }

  discordId(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const sanitized = this.sanitizationService.sanitizeDiscordId(control.value);
      const isValid = SanitizationService.PATTERNS.DISCORD_ID.test(sanitized);
      return isValid ? null : { invalidDiscordId: true };
    };
  }

  discordUsername(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const sanitized = this.sanitizationService.sanitizeDiscordUsername(control.value);
      const isValid = SanitizationService.PATTERNS.DISCORD_USERNAME.test(sanitized);
      return isValid ? null : { invalidDiscordUsername: true };
    };
  }

  discordDiscriminator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const isValid = SanitizationService.PATTERNS.DISCORD_DISCRIMINATOR.test(control.value);
      return isValid ? null : { invalidDiscriminator: true };
    };
  }

  guildName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const sanitized = this.sanitizationService.sanitizeName(control.value);
      const isValid = SanitizationService.PATTERNS.GUILD_NAME.test(sanitized);
      return isValid ? null : { invalidGuildName: true };
    };
  }

  channelName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const sanitized = this.sanitizationService.sanitizeName(control.value);
      const isValid = SanitizationService.PATTERNS.CHANNEL_NAME.test(sanitized);
      return isValid ? null : { invalidChannelName: true };
    };
  }

  campusName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const sanitized = this.sanitizationService.sanitizeName(control.value);
      const isValid = SanitizationService.PATTERNS.CAMPUS_NAME.test(sanitized);
      return isValid ? null : { invalidCampusName: true };
    };
  }

  formationName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const sanitized = this.sanitizationService.sanitizeName(control.value);
      const isValid = SanitizationService.PATTERNS.FORMATION_NAME.test(sanitized);
      return isValid ? null : { invalidFormationName: true };
    };
  }

  promoName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const sanitized = this.sanitizationService.sanitizeName(control.value);
      const isValid = SanitizationService.PATTERNS.PROMO_NAME.test(sanitized);
      return isValid ? null : { invalidPromoName: true };
    };
  }

  email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const sanitized = this.sanitizationService.sanitizeEmail(control.value);
      const isValid = SanitizationService.PATTERNS.EMAIL.test(sanitized);
      return isValid ? null : { invalidEmail: true };
    };
  }

  password(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const isValid = SanitizationService.PATTERNS.PASSWORD.test(control.value);
      return isValid ? null : { invalidPassword: true };
    };
  }
} 