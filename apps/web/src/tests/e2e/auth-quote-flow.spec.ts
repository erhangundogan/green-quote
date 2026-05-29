import { test, expect, type Page } from '@playwright/test';

const TIMESTAMP = Date.now();
const TEST_USER = {
  fullName: `E2E User ${TIMESTAMP}`,
  email: `e2e-${TIMESTAMP}@test.com`,
  password: 'E2eTest1234!',
};

// ── Nav helpers ────────────────────────────────────────────────────────────

// The login page has two "Sign in" elements (navbar + form submit).
// Scoping to <main> targets only the form submit button.
const signInBtn = (page: Page) =>
  page.getByRole('main').getByRole('button', { name: /sign in/i });

// Opens the "Quotes" NavigationMenu trigger in the centre of the top bar.
const openQuotesMenu = async (page: Page) => {
  await page.getByRole('button', { name: /^quotes$/i }).click();
};

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Auth + Quote flow', () => {
  test('register → open Quotes menu → submit New Quote → redirected to detail page', async ({ page }) => {
    // ── Registration ───────────────────────────────────────────────────────
    await page.goto('/register');
    await page.getByLabel('Full name').fill(TEST_USER.fullName);
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL('/quotes');
    await expect(page.getByRole('heading', { name: /my quotes/i })).toBeVisible();

    // ── Navigate to /new-quote via the Quotes nav menu ─────────────────────
    await openQuotesMenu(page);
    await page.getByRole('link', { name: /new quote/i }).click();
    await expect(page).toHaveURL('/new-quote');
    await expect(page.getByRole('heading', { name: /^new quote$/i })).toBeVisible();

    // ── Fill and submit the form ───────────────────────────────────────────
    await page.getByLabel('Installation address').fill('99 Solar Ave, Berlin, DE');
    await page.getByLabel(/monthly consumption/i).fill('320');
    await page.getByLabel(/system size/i).fill('6');
    await page.getByLabel(/down payment/i).fill('1000');
    await page.getByRole('button', { name: /get pre-qualification/i }).click();

    // ── Redirected to quote detail page ────────────────────────────────────
    await expect(page).toHaveURL(/\/quotes\/.+/);
    await expect(page.getByRole('heading', { name: /quote details/i })).toBeVisible();
    await expect(page.getByText('99 Solar Ave')).toBeVisible();
    await expect(page.getByText(/financing offers/i)).toBeVisible();
  });

  test('login → view existing quotes via Quotes menu', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@test.com');
    await page.getByLabel('Password', { exact: true }).fill('User1234!');
    await signInBtn(page).click();

    await expect(page).toHaveURL('/quotes');

    // Quotes menu is visible and My Quotes link works
    await openQuotesMenu(page);
    await expect(page.getByRole('link', { name: /my quotes/i })).toBeVisible();

    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Quotes menu shows All Quotes only for ADMIN', async ({ page }) => {
    // USER — no All Quotes in menu
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@test.com');
    await page.getByLabel('Password', { exact: true }).fill('User1234!');
    await signInBtn(page).click();
    await expect(page).toHaveURL('/quotes');

    await openQuotesMenu(page);
    await expect(page.getByRole('link', { name: /all quotes/i })).not.toBeVisible();
    await page.keyboard.press('Escape');

    // ADMIN — All Quotes present in menu
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password', { exact: true }).fill('Admin1234!');
    await signInBtn(page).click();
    await expect(page).toHaveURL('/quotes');

    await openQuotesMenu(page);
    await expect(page.getByRole('link', { name: /all quotes/i })).toBeVisible();
  });

  test('non-admin cannot access /admin/quotes', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@test.com');
    await page.getByLabel('Password', { exact: true }).fill('User1234!');
    await signInBtn(page).click();
    await expect(page).toHaveURL('/quotes');

    await page.goto('/admin/quotes');
    await expect(page).toHaveURL('/quotes');
  });

  test('admin can reach /admin/quotes via the Quotes nav menu', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password', { exact: true }).fill('Admin1234!');
    await signInBtn(page).click();
    await expect(page).toHaveURL('/quotes');

    await openQuotesMenu(page);
    await page.getByRole('link', { name: /all quotes/i }).click();
    await expect(page).toHaveURL('/admin/quotes');
    await expect(page.getByRole('heading', { name: /all quotes/i })).toBeVisible();
  });

  test('All Quotes table supports column sorting', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password', { exact: true }).fill('Admin1234!');
    await signInBtn(page).click();
    await expect(page).toHaveURL('/quotes');
    await page.goto('/admin/quotes');
    await expect(page.getByRole('heading', { name: /all quotes/i })).toBeVisible();

    // Default: Date column is sorted descending
    const dateHeader = page.getByRole('columnheader', { name: /date/i });
    await expect(dateHeader).toHaveAttribute('aria-sort', 'descending');

    // Click Date → ascending
    await page.getByRole('button', { name: /date/i }).click();
    await expect(dateHeader).toHaveAttribute('aria-sort', 'ascending');

    // Click Date again → descending
    await page.getByRole('button', { name: /date/i }).click();
    await expect(dateHeader).toHaveAttribute('aria-sort', 'descending');

    // Switch to System Size → ascending; Date resets to none
    await page.getByRole('button', { name: /system size/i }).click();
    await expect(page.getByRole('columnheader', { name: /system size/i })).toHaveAttribute('aria-sort', 'ascending');
    await expect(dateHeader).toHaveAttribute('aria-sort', 'none');

    // Click System Size again → descending
    await page.getByRole('button', { name: /system size/i }).click();
    await expect(page.getByRole('columnheader', { name: /system size/i })).toHaveAttribute('aria-sort', 'descending');
  });

  test('admin can access /admin/quotes and filter', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password', { exact: true }).fill('Admin1234!');
    await signInBtn(page).click();
    await expect(page).toHaveURL('/quotes');

    await page.goto('/admin/quotes');
    await expect(page.getByRole('heading', { name: /all quotes/i })).toBeVisible();

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    await page.waitForTimeout(400);
    await expect(page.getByRole('table')).toBeVisible();
  });
});
