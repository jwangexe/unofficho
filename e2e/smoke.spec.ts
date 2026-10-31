import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const DISCLAIMER =
  'An unofficial, independent study resource. Not affiliated with or endorsed by the International Chemistry Olympiad or its organisers.';

const tab = (page: Page, name: string) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name });

test('tab bar reaches every section, and About shows the disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/calc$/);
  await tab(page, 'Book').click();
  await expect(page.getByRole('heading', { name: 'Book', level: 1 })).toBeVisible();
  await expect(page).toHaveTitle('Book · UnoffIChO');
  await tab(page, 'Reagents').click();
  await expect(page.getByRole('navigation', { name: 'Reagent modes' })).toBeVisible();
  await tab(page, 'Progress').click();
  await expect(page.getByRole('heading', { name: 'Progress', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByText(DISCLAIMER).first()).toBeVisible();
});

test('a calculation card shows labelled chips and the keyboard moves the feed', async ({ page }) => {
  await page.goto('/calc');
  const first = page.getByRole('region', { name: 'Question 1' });
  await expect(first.getByRole('button', { name: /=/ }).first()).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByText('Question 2', { exact: true })).toBeAttached();
  // The card that scrolled away is inert, so its buttons leave the tab order.
  await expect(first).toHaveAttribute('inert', '');
});

test('answering in Fast mode is recorded on the Progress screen', async ({ page }) => {
  await page.goto('/reagents');
  await page.getByRole('button', { name: 'Fast' }).click();
  await page.getByRole('region', { name: 'Reagent 1' }).getByRole('button', { name: 'Reducing agent' }).click();
  await expect(page.getByRole('status').first()).toBeVisible();
  await tab(page, 'Progress').click();
  await expect(page.getByText(/^1 answers recorded/)).toBeVisible();
  await expect(page.getByRole('meter', { name: 'Reagents accuracy' })).toBeAttached();
});

test('a book page renders maths and structures, and its quick check responds', async ({ page }) => {
  await page.goto('/book/choosing-a-hydride');
  await expect(page.getByRole('heading', { name: 'Choosing a hydride reducing agent' })).toBeVisible();
  await expect(page.locator('article table')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Keto-ester' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Keto-ester' }).locator('path, line').first()).toBeAttached();
  await page.getByRole('button', { name: 'NaBH₄ in MeOH' }).click();
  await expect(page.getByText(/^Correct\./)).toBeVisible();
  await page.goto('/book/steady-state-pre-equilibrium');
  await expect(page.locator('article .katex-display').first()).toBeVisible();
});

test('Mechanisms mode: pick a rate law, then switch approximations in the derivation', async ({ page }) => {
  await page.goto('/calc?ids=mech%3Amech-lindemann');
  const card = page.getByRole('region', { name: 'Mechanism 1' });
  await expect(card.getByRole('heading', { name: /Lindemann/ })).toBeVisible();
  await card.getByRole('group', { name: 'Rate laws' }).getByRole('button').first().click();
  await expect(card.getByRole('status')).toContainText(/Correct|Not quite/);
  await expect(card.getByRole('region', { name: 'Derivation' }).getByText('Rate law', { exact: true })).toBeVisible();

  // The Book's tool starts from steady state on A*; switching to a pre-equilibrium takes A* over.
  await page.goto('/book/deriving-rate-laws');
  const tool = page.getByRole('figure', { name: /Lindemann/ });
  await expect(tool.getByText('Steady state on')).toBeVisible();
  await tool.getByRole('button', { name: 'Step 1', exact: true }).click();
  await expect(tool.getByText('Fast pre-equilibrium in step 1')).toBeVisible();
  await expect(tool.getByRole('button', { name: '[A*]' })).toBeDisabled();
});

test('installable PWA that works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href;
    return (await fetch(href)).json();
  });
  expect(manifest).toMatchObject({ name: 'UnoffIChO', short_name: 'UnoffIChO', display: 'standalone', start_url: '/' });
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.goto('/book/diels-alder');
  await expect(page.getByRole('heading', { name: 'The Diels–Alder reaction' })).toBeVisible();
  await tab(page, 'Calculations').click();
  await expect(page.getByRole('region', { name: 'Question 1' })).toBeVisible();
  await context.setOffline(false);
});

test.describe('accessibility (axe, WCAG 2.1 AA)', () => {
  for (const [path, theme] of [
    ['/calc', 'dark'],
    ['/reagents', 'dark'],
    ['/book/combining-potentials', 'dark'],
    ['/progress', 'light'],
    ['/book', 'light'],
    ['/about', 'light'],
  ] as const) {
    test(`${path} in ${theme} mode has no serious violations`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('unofficho.theme', t), theme);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }
});
