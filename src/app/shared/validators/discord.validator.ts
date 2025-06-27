import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class DiscordValidators {
  static serverId(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.toString();
      const isValid = /^\d{17,19}$/.test(value);

      return isValid ? null : { invalidDiscordId: true };
    };
  }

  static channelId(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.toString();
      const isValid = /^\d{17,19}$/.test(value);

      return isValid ? null : { invalidDiscordChannelId: true };
    };
  }
} 