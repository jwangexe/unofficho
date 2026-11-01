import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const DISCLAIMER =
  'An unofficial, independent study resource. Not affiliated with or endorsed by the International Chemistry Olympiad or its organisers.';

// Rad's first-visit tours would cover the screen; tests that want them clear these flags.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('unofficho.tutorial.calc', '1');
    localStorage.setItem('unofficho.tutorial.mechanisms', '1');
  });
});

const tab = (page: Page, name: string) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name });

test('tab bar reaches every section, and About shows the disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('UnoffIChO');
  await expect(page.getByRole('note', { name: 'About the author' })).toContainText('IChO gold medallist');
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

test('homepage buttons open the right feature and mode', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Derive a rate law' }).click();
  await expect(page).toHaveURL(/\/calc$/);
  await expect(page.getByRole('navigation', { name: 'Calculation modes' }).getByRole('button', { name: 'Mechanisms' })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('link', { name: 'UnoffIChO' }).click();
  await page.getByRole('link', { name: 'Will it react?' }).click();
  await expect(page.getByRole('navigation', { name: 'Reagent modes' }).getByRole('button', { name: 'Will it react?' })).toHaveAttribute('aria-current', 'page');
});

test('Rad’s Calculations tour shows once, spotlights the card, and can be replayed', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('tour-test')) {
      sessionStorage.setItem('tour-test', '1');
      localStorage.removeItem('unofficho.tutorial.calc');
    }
  });
  await page.goto('/calc');
  const tour = page.getByRole('dialog', { name: 'Calculations tutorial' });
  await expect(tour).toBeVisible();
  await expect(tour.getByRole('img', { name: /Rad/ })).toBeVisible();
  await expect(tour.getByRole('heading', { name: 'Hi, I’m Rad' })).toBeVisible();
  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(tour.getByRole('heading', { name: 'Read the question' })).toBeVisible();
  await tour.getByRole('button', { name: 'Skip' }).click();
  await expect(tour).toBeHidden();

  await page.reload();
  await expect(page.getByRole('region', { name: 'Question 1' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'How Calculations works' }).click();
  await expect(page.getByRole('dialog', { name: 'Calculations tutorial' })).toBeVisible();
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
  await card.getByRole('button', { name: 'Pick the rate law' }).click();
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

test('derive it yourself: equations, then solving by substitution', async ({ page }) => {
  // Math.random() = 0 deals the first challenge: steady state on A*.
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/calc?ids=mech%3Amech-lindemann');
  const card = page.getByRole('region', { name: 'Mechanism 1' });
  await card.getByRole('button', { name: 'Derive it' }).click();

  const eqs = card.getByRole('region', { name: 'Write the equations' });
  const coef = (term: string) => eqs.getByRole('group', { name: `Coefficient of ${term}` });
  await coef('k 1 [A][M]').getByRole('button', { name: '+' }).click();
  await coef('k minus 1 [M][A star]').getByRole('button', { name: '+' }).click();
  await eqs.getByRole('button', { name: 'Check equations' }).click();
  await expect(eqs.getByText(/so its term is negative/)).toBeVisible();
  await coef('k minus 1 [M][A star]').getByRole('button', { name: '−' }).click();
  await coef('k 2 [A star]').getByRole('button', { name: '−' }).click();
  await eqs.getByRole('button', { name: 'Check equations' }).click();
  await expect(eqs.getByText('✓ Equations right')).toBeVisible();

  const solve = card.getByRole('region', { name: 'Solve by substitution' });
  await solve.getByRole('button', { name: /Solve for/ }).click();
  const chip = (term: string) => solve.getByRole('button', { name: new RegExp(`^${term.replace(/[[\]]/g, '\\$&')}:`) });
  await chip('k 1 [A][M]').click(); // → numerator
  await chip('k 2').click();
  await chip('k 2').click(); // → denominator
  await chip('k minus 1 [M]').click();
  await chip('k minus 1 [M]').click();
  await solve.getByRole('button', { name: 'Check', exact: true }).click();

  const rate = card.getByRole('region', { name: 'The rate law' });
  await rate.getByRole('button', { name: 'd[P] over dt equals k 1 k 2 [A][M] over k 2 plus k minus 1 [M]' }).click();
  await expect(rate.getByText('✓ Derived')).toBeVisible();
});

test('the suggestion button sends the message, the page and nothing else', async ({ page }) => {
  let sent: unknown = null;
  await page.route('**/api/suggestions', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/book');
  await page.getByRole('button', { name: 'Send a suggestion' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('radio', { name: 'Chemistry error' }).click();
  // Typed key by key, as a person would: focus must stay in the box between keystrokes.
  const box = sheet.getByLabel('Your suggestion');
  await box.click();
  await box.pressSequentially('A typo on the buffers page');
  await expect(box).toBeFocused();
  await expect(box).toHaveValue('A typo on the buffers page');
  await sheet.getByRole('button', { name: 'Send' }).click();
  await expect(sheet.getByText('Thank you!')).toBeVisible();
  expect(sent).toEqual({ kind: 'content-error', message: 'A typo on the buffers page', name: '', page: '/book', website: '' });
});

test('typing a flag note keeps focus in the text box', async ({ page }) => {
  await page.goto('/book/diels-alder');
  await page.getByRole('button', { name: 'Flag as wrong' }).click();
  const note = page.getByRole('dialog').getByRole('textbox');
  await note.click();
  await note.pressSequentially('Endo rule wording');
  await expect(note).toBeFocused();
  await expect(note).toHaveValue('Endo rule wording');
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
    ['/', 'dark'],
    ['/', 'light'],
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
