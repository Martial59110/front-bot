import { test, expect } from '@playwright/test';

test.describe('Parcours utilisateur complet', () => {
  test('Ajoute une guild, un campus, navigue sur toutes les pages principales', async ({ page }) => {
    
    await page.goto('/guilds');
    await page.waitForLoadState('domcontentloaded');

  
    await page.locator('button.btn-danger').filter({ hasText: 'Ajouter' }).first().click();
    await page.getByLabel('ID Discord').fill('1376536408583311360');
 
    await page.locator('form button[type="submit"]').click();
    
    // Attend pour erreur//
    await page.waitForTimeout(1000);
    
    
    const errorAlert = page.locator('.alert.alert-danger');
    if (await errorAlert.isVisible()) {
      const errorMessage = await errorAlert.textContent();
      console.log('Erreur lors de l\'ajout de la guild:', errorMessage);
      throw new Error(`Échec de l'ajout de la guild: ${errorMessage}`);
    }
    //............................................................................//

   
    await expect(page.getByText('1376536408583311360')).toBeVisible({ timeout: 10000 });


    await page.getByRole('link', { name: 'Campus' }).click();
    await page.waitForLoadState('domcontentloaded');
    
   
    await expect(page.locator('h1').filter({ hasText: 'Campus' })).toBeVisible({ timeout: 5000 });
    
    const addCampusButton = page.getByRole('button', { name: /ajouter/i });
    if (await addCampusButton.isVisible()) {
      await addCampusButton.click();
      await page.getByLabel('Nom du campus').fill('Campus Test');
      await page.getByLabel('Serveur Discord').selectOption('1376536408583311360');
      await page.locator('form button[type="submit"]').click();
      await expect(page.getByText('Campus Test').first()).toBeVisible({ timeout: 10000 });
    }

    await page.getByRole('link', { name: 'Canaux' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').filter({ hasText: 'Canaux' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('link', { name: 'Formations' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').filter({ hasText: 'Formations' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('link', { name: 'Promos' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').filter({ hasText: 'Promotions' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('link', { name: 'Membres' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').filter({ hasText: 'Membres' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('link', { name: 'Promos' }).click();
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('h1').filter({ hasText: 'Promotions' })).toBeVisible({ timeout: 5000 });
  });
}); 