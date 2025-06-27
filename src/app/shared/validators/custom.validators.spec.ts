import { TestBed } from '@angular/core/testing';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { CustomValidators } from './custom.validators';
import { SanitizationService } from '../services/sanitization.service';

describe('CustomValidators', () => {
  let validators: CustomValidators;
  let sanitizer: jasmine.SpyObj<DomSanitizer>;

  beforeEach(() => {
    const sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustHtml']);

    TestBed.configureTestingModule({
      providers: [
        CustomValidators,
        { provide: DomSanitizer, useValue: sanitizerSpy }
      ]
    });

    validators = TestBed.inject(CustomValidators);
    sanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;
  });

  it('should be created', () => {
    expect(validators).toBeTruthy();
  });

  describe('discordId', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.discordId();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = { value: null } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid Discord ID', () => {
      const control = { value: '123456789012345678' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid Discord ID with 17 digits', () => {
      const control = { value: '12345678901234567' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid Discord ID with 19 digits', () => {
      const control = { value: '1234567890123456789' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid Discord ID (too short)', () => {
      const control = { value: '1234567890123456' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscordId: true });
    });

    it('should return error for invalid Discord ID (too long)', () => {
      const control = { value: '12345678901234567890' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscordId: true });
    });

    it('should return error for Discord ID with letters', () => {
      const control = { value: '12345678901234567a' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscordId: true });
    });

    it('should sanitize input before validation', () => {
      const control = { value: '123abc456def789' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscordId: true }); // Should be sanitized to '123456789' which is invalid (too short)
    });
  });

  describe('discordUsername', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.discordUsername();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid username', () => {
      const control = { value: 'user123' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for username with underscore', () => {
      const control = { value: 'user_name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for username with dot', () => {
      const control = { value: 'user.name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for username with dash', () => {
      const control = { value: 'user-name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for username with maximum length', () => {
      const control = { value: 'a'.repeat(32) } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for username too short', () => {
      const control = { value: 'a' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscordUsername: true });
    });

    it('should return error for username too long', () => {
      const control = { value: 'a'.repeat(33) } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscordUsername: true });
    });

    it('should return error for username with invalid characters', () => {
      const control = { value: 'user@name' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscordUsername: true });
    });

    it('should sanitize input before validation', () => {
      const control = { value: 'user@123' } as AbstractControl;
      expect(validator(control)).toBeNull(); // Should be sanitized to 'user123' which is valid
    });
  });

  describe('discordDiscriminator', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.discordDiscriminator();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid discriminator', () => {
      const control = { value: '1234' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for discriminator with zeros', () => {
      const control = { value: '0000' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for discriminator with nines', () => {
      const control = { value: '9999' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for discriminator too short', () => {
      const control = { value: '123' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscriminator: true });
    });

    it('should return error for discriminator too long', () => {
      const control = { value: '12345' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscriminator: true });
    });

    it('should return error for discriminator with letters', () => {
      const control = { value: '123a' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidDiscriminator: true });
    });
  });

  describe('guildName', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.guildName();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid guild name', () => {
      const control = { value: 'Guild Name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for guild name with underscore', () => {
      const control = { value: 'Guild_Name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for guild name with dot', () => {
      const control = { value: 'Guild.Name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for guild name with dash', () => {
      const control = { value: 'Guild-Name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for guild name with numbers', () => {
      const control = { value: 'Guild123' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for guild name with maximum length', () => {
      const control = { value: 'a'.repeat(100) } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for guild name too short', () => {
      const control = { value: 'a' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidGuildName: true });
    });

    it('should return error for guild name too long', () => {
      const control = { value: 'a'.repeat(101) } as AbstractControl;
      expect(validator(control)).toEqual({ invalidGuildName: true });
    });

    it('should return error for guild name with invalid characters', () => {
      const control = { value: 'Guild@Name' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidGuildName: true });
    });

    it('should sanitize input before validation', () => {
      const control = { value: 'Guild@Name' } as AbstractControl;
      expect(validator(control)).toBeNull(); // Should be sanitized to 'GuildName' which is valid
    });
  });

  describe('channelName', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.channelName();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid channel name', () => {
      const control = { value: 'Channel Name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid channel name', () => {
      const control = { value: 'a' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidChannelName: true });
    });
  });

  describe('campusName', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.campusName();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid campus name', () => {
      const control = { value: 'Campus Name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid campus name', () => {
      const control = { value: 'a' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidCampusName: true });
    });
  });

  describe('formationName', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.formationName();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid formation name', () => {
      const control = { value: 'Formation Name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid formation name', () => {
      const control = { value: 'a' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidFormationName: true });
    });
  });

  describe('promoName', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.promoName();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid promo name', () => {
      const control = { value: 'Promo Name' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid promo name', () => {
      const control = { value: 'a' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidPromoName: true });
    });
  });

  describe('email', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.email();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid email', () => {
      const control = { value: 'test@example.com' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for email with subdomain', () => {
      const control = { value: 'user.name@domain.co.uk' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for email with plus tag', () => {
      const control = { value: 'test+tag@example.com' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for incomplete email', () => {
      const control = { value: 'test@' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidEmail: true });
    });

    it('should return error for email without local part', () => {
      const control = { value: '@example.com' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidEmail: true });
    });

    it('should return error for email without domain extension', () => {
      const control = { value: 'test@example' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidEmail: true });
    });

    it('should return error for email without @', () => {
      const control = { value: 'test example.com' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidEmail: true });
    });

    it('should sanitize input before validation', () => {
      const control = { value: '  TEST@EXAMPLE.COM  ' } as AbstractControl;
      expect(validator(control)).toBeNull(); // Should be sanitized to 'test@example.com' which is valid
    });
  });

  describe('password', () => {
    let validator: (control: AbstractControl) => ValidationErrors | null;

    beforeEach(() => {
      validator = validators.password();
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid password', () => {
      const control = { value: 'Password123!' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for password with different special characters', () => {
      const control = { value: 'MyP@ssw0rd' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return null for password with hash symbol', () => {
      const control = { value: 'Str0ng#P@ss' } as AbstractControl;
      expect(validator(control)).toBeNull();
    });

    it('should return error for password without uppercase', () => {
      const control = { value: 'password123!' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidPassword: true });
    });

    it('should return error for password without lowercase', () => {
      const control = { value: 'PASSWORD123!' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidPassword: true });
    });

    it('should return error for password without digit', () => {
      const control = { value: 'Password!' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidPassword: true });
    });

    it('should return error for password without special character', () => {
      const control = { value: 'Password123' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidPassword: true });
    });

    it('should return error for password too short', () => {
      const control = { value: 'Pass!' } as AbstractControl;
      expect(validator(control)).toEqual({ invalidPassword: true });
    });
  });
}); 