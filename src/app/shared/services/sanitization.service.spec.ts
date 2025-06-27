import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SanitizationService } from './sanitization.service';

describe('SanitizationService', () => {
  let service: SanitizationService;
  let sanitizer: jasmine.SpyObj<DomSanitizer>;

  beforeEach(() => {
    const sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustHtml']);

    TestBed.configureTestingModule({
      providers: [
        SanitizationService,
        { provide: DomSanitizer, useValue: sanitizerSpy }
      ]
    });

    service = TestBed.inject(SanitizationService);
    sanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('PATTERNS', () => {
    it('should have all required patterns', () => {
      expect(SanitizationService.PATTERNS.DISCORD_ID).toBeDefined();
      expect(SanitizationService.PATTERNS.DISCORD_USERNAME).toBeDefined();
      expect(SanitizationService.PATTERNS.DISCORD_DISCRIMINATOR).toBeDefined();
      expect(SanitizationService.PATTERNS.GUILD_NAME).toBeDefined();
      expect(SanitizationService.PATTERNS.CHANNEL_NAME).toBeDefined();
      expect(SanitizationService.PATTERNS.CAMPUS_NAME).toBeDefined();
      expect(SanitizationService.PATTERNS.FORMATION_NAME).toBeDefined();
      expect(SanitizationService.PATTERNS.PROMO_NAME).toBeDefined();
      expect(SanitizationService.PATTERNS.EMAIL).toBeDefined();
      expect(SanitizationService.PATTERNS.PASSWORD).toBeDefined();
    });
  });

  describe('sanitizeHtml', () => {
    it('should call sanitizer.bypassSecurityTrustHtml', () => {
      const testHtml = '<p>Test HTML</p>';
      sanitizer.bypassSecurityTrustHtml.and.returnValue('sanitized' as any);

      const result = service.sanitizeHtml(testHtml);

      expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(testHtml);
      expect(result).toBe('sanitized');
    });
  });

  describe('sanitizeText', () => {
    it('should return empty string for null/undefined input', () => {
      expect(service.sanitizeText('')).toBe('');
      expect(service.sanitizeText(null as any)).toBe('');
      expect(service.sanitizeText(undefined as any)).toBe('');
    });

    it('should remove HTML tags', () => {
      expect(service.sanitizeText('<script>alert("test")</script>')).toBe('scriptalert("test")/script');
      expect(service.sanitizeText('<p>Hello</p>')).toBe('pHello/p');
    });

    it('should remove javascript protocol', () => {
      expect(service.sanitizeText('javascript:alert("test")')).toBe('alert("test")');
      expect(service.sanitizeText('JAVASCRIPT:alert("test")')).toBe('alert("test")');
    });

    it('should remove inline events', () => {
      expect(service.sanitizeText('onclick=alert("test")')).toBe('alert("test")');
      expect(service.sanitizeText('onload=alert("test")')).toBe('alert("test")');
      expect(service.sanitizeText('onmouseover=alert("test")')).toBe('alert("test")');
    });

    it('should trim whitespace', () => {
      expect(service.sanitizeText('  test  ')).toBe('test');
    });

    it('should handle normal text', () => {
      expect(service.sanitizeText('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizeDiscordId', () => {
    it('should return empty string for null/undefined input', () => {
      expect(service.sanitizeDiscordId('')).toBe('');
      expect(service.sanitizeDiscordId(null as any)).toBe('');
      expect(service.sanitizeDiscordId(undefined as any)).toBe('');
    });

    it('should keep only digits', () => {
      expect(service.sanitizeDiscordId('123456789012345678')).toBe('123456789012345678');
      expect(service.sanitizeDiscordId('123abc456def789')).toBe('123456789');
      expect(service.sanitizeDiscordId('abc123def456')).toBe('123456');
    });

    it('should handle special characters', () => {
      expect(service.sanitizeDiscordId('123-456_789')).toBe('123456789');
      expect(service.sanitizeDiscordId('123@456#789')).toBe('123456789');
    });
  });

  describe('sanitizeDiscordUsername', () => {
    it('should return empty string for null/undefined input', () => {
      expect(service.sanitizeDiscordUsername('')).toBe('');
      expect(service.sanitizeDiscordUsername(null as any)).toBe('');
      expect(service.sanitizeDiscordUsername(undefined as any)).toBe('');
    });

    it('should keep only allowed characters', () => {
      expect(service.sanitizeDiscordUsername('user123')).toBe('user123');
      expect(service.sanitizeDiscordUsername('user_name')).toBe('user_name');
      expect(service.sanitizeDiscordUsername('user.name')).toBe('user.name');
      expect(service.sanitizeDiscordUsername('user-name')).toBe('user-name');
    });

    it('should remove special characters', () => {
      expect(service.sanitizeDiscordUsername('user@123')).toBe('user123');
      expect(service.sanitizeDiscordUsername('user#123')).toBe('user123');
      expect(service.sanitizeDiscordUsername('user$123')).toBe('user123');
    });

    it('should limit to 32 characters', () => {
      const longUsername = 'a'.repeat(50);
      expect(service.sanitizeDiscordUsername(longUsername).length).toBe(32);
      expect(service.sanitizeDiscordUsername(longUsername)).toBe('a'.repeat(32));
    });
  });

  describe('sanitizeName', () => {
    it('should return empty string for null/undefined input', () => {
      expect(service.sanitizeName('')).toBe('');
      expect(service.sanitizeName(null as any)).toBe('');
      expect(service.sanitizeName(undefined as any)).toBe('');
    });

    it('should keep allowed characters', () => {
      expect(service.sanitizeName('Guild Name')).toBe('Guild Name');
      expect(service.sanitizeName('Guild_Name')).toBe('Guild_Name');
      expect(service.sanitizeName('Guild.Name')).toBe('Guild.Name');
      expect(service.sanitizeName('Guild-Name')).toBe('Guild-Name');
      expect(service.sanitizeName('Guild123')).toBe('Guild123');
    });

    it('should remove special characters', () => {
      expect(service.sanitizeName('Guild@Name')).toBe('GuildName');
      expect(service.sanitizeName('Guild#Name')).toBe('GuildName');
      expect(service.sanitizeName('Guild$Name')).toBe('GuildName');
    });

    it('should limit to 100 characters', () => {
      const longName = 'a'.repeat(150);
      expect(service.sanitizeName(longName).length).toBe(100);
      expect(service.sanitizeName(longName)).toBe('a'.repeat(100));
    });

    it('should trim whitespace', () => {
      expect(service.sanitizeName('  Guild Name  ')).toBe('Guild Name');
    });
  });

  describe('sanitizeEmail', () => {
    it('should return empty string for null/undefined input', () => {
      expect(service.sanitizeEmail('')).toBe('');
      expect(service.sanitizeEmail(null as any)).toBe('');
      expect(service.sanitizeEmail(undefined as any)).toBe('');
    });

    it('should convert to lowercase', () => {
      expect(service.sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
      expect(service.sanitizeEmail('Test@Example.com')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(service.sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should handle normal email', () => {
      expect(service.sanitizeEmail('test@example.com')).toBe('test@example.com');
    });
  });

  describe('validatePattern', () => {
    it('should validate Discord ID pattern', () => {
      const pattern = SanitizationService.PATTERNS.DISCORD_ID;
      
      expect(service.validatePattern('123456789012345678', pattern)).toBe(true);
      expect(service.validatePattern('12345678901234567', pattern)).toBe(true);
      expect(service.validatePattern('1234567890123456789', pattern)).toBe(true);
      
      expect(service.validatePattern('1234567890123456', pattern)).toBe(false); // too short
      expect(service.validatePattern('12345678901234567890', pattern)).toBe(false); // too long
      expect(service.validatePattern('12345678901234567a', pattern)).toBe(false); // contains letter
    });

    it('should validate Discord username pattern', () => {
      const pattern = SanitizationService.PATTERNS.DISCORD_USERNAME;
      
      expect(service.validatePattern('user123', pattern)).toBe(true);
      expect(service.validatePattern('user_name', pattern)).toBe(true);
      expect(service.validatePattern('user.name', pattern)).toBe(true);
      expect(service.validatePattern('user-name', pattern)).toBe(true);
      expect(service.validatePattern('a'.repeat(32), pattern)).toBe(true);
      
      expect(service.validatePattern('a', pattern)).toBe(false); // too short
      expect(service.validatePattern('a'.repeat(33), pattern)).toBe(false); // too long
      expect(service.validatePattern('user@name', pattern)).toBe(false); // invalid character
    });

    it('should validate Discord discriminator pattern', () => {
      const pattern = SanitizationService.PATTERNS.DISCORD_DISCRIMINATOR;
      
      expect(service.validatePattern('1234', pattern)).toBe(true);
      expect(service.validatePattern('0000', pattern)).toBe(true);
      expect(service.validatePattern('9999', pattern)).toBe(true);
      
      expect(service.validatePattern('123', pattern)).toBe(false); // too short
      expect(service.validatePattern('12345', pattern)).toBe(false); // too long
      expect(service.validatePattern('123a', pattern)).toBe(false); // contains letter
    });

    it('should validate guild name pattern', () => {
      const pattern = SanitizationService.PATTERNS.GUILD_NAME;
      
      expect(service.validatePattern('Guild Name', pattern)).toBe(true);
      expect(service.validatePattern('Guild_Name', pattern)).toBe(true);
      expect(service.validatePattern('Guild.Name', pattern)).toBe(true);
      expect(service.validatePattern('Guild-Name', pattern)).toBe(true);
      expect(service.validatePattern('Guild123', pattern)).toBe(true);
      expect(service.validatePattern('a'.repeat(100), pattern)).toBe(true);
      
      expect(service.validatePattern('a', pattern)).toBe(false); // too short
      expect(service.validatePattern('a'.repeat(101), pattern)).toBe(false); // too long
      expect(service.validatePattern('Guild@Name', pattern)).toBe(false); // invalid character
    });

    it('should validate email pattern', () => {
      const pattern = SanitizationService.PATTERNS.EMAIL;
      
      expect(service.validatePattern('test@example.com', pattern)).toBe(true);
      expect(service.validatePattern('user.name@domain.co.uk', pattern)).toBe(true);
      expect(service.validatePattern('test+tag@example.com', pattern)).toBe(true);
      
      expect(service.validatePattern('test@', pattern)).toBe(false); // incomplete
      expect(service.validatePattern('@example.com', pattern)).toBe(false); // no local part
      expect(service.validatePattern('test@example', pattern)).toBe(false); // no domain extension
      expect(service.validatePattern('test example.com', pattern)).toBe(false); // no @
    });

    it('should validate password pattern', () => {
      const pattern = SanitizationService.PATTERNS.PASSWORD;
      
      expect(service.validatePattern('Password123!', pattern)).toBe(true);
      expect(service.validatePattern('MyP@ssw0rd', pattern)).toBe(true);
      expect(service.validatePattern('Str0ng$P@ss', pattern)).toBe(true);
      
      expect(service.validatePattern('password', pattern)).toBe(false); // no uppercase, digit, special char
      expect(service.validatePattern('PASSWORD', pattern)).toBe(false); // no lowercase, digit, special char
      expect(service.validatePattern('Password', pattern)).toBe(false); // no digit, special char
      expect(service.validatePattern('Pass123', pattern)).toBe(false); // no special char
      expect(service.validatePattern('Pass!', pattern)).toBe(false); // no digit, too short
    });
  });
}); 