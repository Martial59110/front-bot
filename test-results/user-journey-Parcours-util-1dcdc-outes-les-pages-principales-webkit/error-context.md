# Test info

- Name: Parcours utilisateur complet >> Ajoute une guild, un campus, navigue sur toutes les pages principales
- Location: /home/martial/Desktop/Bot-onboarding/front-bot/e2e/user-journey.spec.ts:4:7

# Error details

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('button.btn-danger').filter({ hasText: 'Ajouter' }).first()
    - locator resolved to <button class="btn btn-danger" _ngcontent-ng-c1042630456="">Ajouter</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

    at /home/martial/Desktop/Bot-onboarding/front-bot/e2e/user-journey.spec.ts:10:84
```

# Page snapshot

```yaml
- complementary:
  - img "Logo Simplon"
  - navigation:
    - list:
      - listitem:
        - link "Dashboard":
          - /url: /
      - listitem:
        - link "Serveurs":
          - /url: /guilds
      - listitem:
        - link "Utilisateurs":
          - /url: /utilisateurs
      - listitem:
        - link "Campus":
          - /url: /campus
      - listitem:
        - link "Formations":
          - /url: /formations
      - listitem:
        - link "Promos":
          - /url: /promos
      - listitem:
        - link "Membres":
          - /url: /membres
      - listitem:
        - link "Canaux":
          - /url: /canaux
      - listitem:
        - link "Identifications":
          - /url: /identifications
- heading "Serveurs" [level=1]
- button ""
- alert:
  - text:  Pour ajouter un nouveau serveur, assurez-vous d'avoir d'abord installé le bot sur celui-ci.
  - link "Cliquez ici pour installer le bot":
    - /url: https://discord.com/oauth2/authorize?client_id=1376536561193189406&permissions=8&integration_type=0&scope=bot+applications.commands
- text: 
- textbox "Rechercher un serveur"
- button "Ajouter"
- table:
  - rowgroup:
    - row "Nom ID Discord Date de création Nombre de membres Actions":
      - cell "Nom"
      - cell "ID Discord"
      - cell "Date de création"
      - cell "Nombre de membres"
      - cell "Actions"
  - rowgroup:
    - row "Bot discord Onboarding 1376536408583311360 26/06/2025 22:25 0 🗑️":
      - cell "Bot discord Onboarding"
      - cell "1376536408583311360"
      - cell "26/06/2025 22:25"
      - cell "0"
      - cell "🗑️":
        - button "🗑️"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Parcours utilisateur complet', () => {
   4 |   test('Ajoute une guild, un campus, navigue sur toutes les pages principales', async ({ page }) => {
   5 |     
   6 |     await page.goto('/guilds');
   7 |     await page.waitForLoadState('domcontentloaded');
   8 |
   9 |   
> 10 |     await page.locator('button.btn-danger').filter({ hasText: 'Ajouter' }).first().click();
     |                                                                                    ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  11 |     await page.getByLabel('ID Discord').fill('1376536408583311360');
  12 |  
  13 |     await page.locator('form button[type="submit"]').click();
  14 |     
  15 |     // Attend pour erreur//
  16 |     await page.waitForTimeout(1000);
  17 |     
  18 |     
  19 |     const errorAlert = page.locator('.alert.alert-danger');
  20 |     if (await errorAlert.isVisible()) {
  21 |       const errorMessage = await errorAlert.textContent();
  22 |       console.log('Erreur lors de l\'ajout de la guild:', errorMessage);
  23 |       throw new Error(`Échec de l'ajout de la guild: ${errorMessage}`);
  24 |     }
  25 |     //............................................................................//
  26 |
  27 |    
  28 |     await expect(page.getByText('1376536408583311360')).toBeVisible({ timeout: 10000 });
  29 |
  30 |
  31 |     await page.getByRole('link', { name: 'Campus' }).click();
  32 |     await page.waitForLoadState('domcontentloaded');
  33 |     
  34 |    
  35 |     await expect(page.locator('h1').filter({ hasText: 'Campus' })).toBeVisible({ timeout: 5000 });
  36 |     
  37 |     const addCampusButton = page.getByRole('button', { name: /ajouter/i });
  38 |     if (await addCampusButton.isVisible()) {
  39 |       await addCampusButton.click();
  40 |       await page.getByLabel('Nom du campus').fill('Campus Test');
  41 |       await page.getByLabel('Serveur Discord').selectOption('1376536408583311360');
  42 |       await page.locator('form button[type="submit"]').click();
  43 |       await expect(page.getByText('Campus Test').first()).toBeVisible({ timeout: 10000 });
  44 |     }
  45 |
  46 |     await page.getByRole('link', { name: 'Canaux' }).click();
  47 |     await page.waitForLoadState('domcontentloaded');
  48 |     
  49 |     await expect(page.locator('h1').filter({ hasText: 'Canaux' })).toBeVisible({ timeout: 5000 });
  50 |
  51 |     await page.getByRole('link', { name: 'Formations' }).click();
  52 |     await page.waitForLoadState('domcontentloaded');
  53 |     
  54 |     await expect(page.locator('h1').filter({ hasText: 'Formations' })).toBeVisible({ timeout: 5000 });
  55 |
  56 |     await page.getByRole('link', { name: 'Promos' }).click();
  57 |     await page.waitForLoadState('domcontentloaded');
  58 |     
  59 |     await expect(page.locator('h1').filter({ hasText: 'Promotions' })).toBeVisible({ timeout: 5000 });
  60 |
  61 |     await page.getByRole('link', { name: 'Membres' }).click();
  62 |     await page.waitForLoadState('domcontentloaded');
  63 |     
  64 |     await expect(page.locator('h1').filter({ hasText: 'Membres' })).toBeVisible({ timeout: 5000 });
  65 |
  66 |     await page.getByRole('link', { name: 'Promos' }).click();
  67 |     await page.waitForLoadState('domcontentloaded');
  68 |     
  69 |     await expect(page.locator('h1').filter({ hasText: 'Promotions' })).toBeVisible({ timeout: 5000 });
  70 |   });
  71 | }); 
```