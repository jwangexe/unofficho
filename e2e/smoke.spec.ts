import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const DISCLAIMER =
  'Unofficial and independent. Not affiliated with the International Chemistry Olympiad, the Royal Society of Chemistry, the University of Cambridge or any exam board.';

// Rad's first-visit tours and the level picker would cover the screen; tests that want them clear these flags.
// IChO is the level with every mode and all content.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('unofficho.level', 'icho');
    localStorage.setItem('unofficho.tutorial.calc', '1');
    localStorage.setItem('unofficho.tutorial.mechanisms', '1');
  });
});

const tab = (page: Page, name: string) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name });

test('tab bar reaches every section, and About shows the disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^I built UnoffIChO/);
  await expect(page.getByRole('img', { name: /Rad/ })).toBeVisible();
  await tab(page, 'Book').click();
  await expect(page.getByRole('heading', { name: 'Book', level: 1 })).toBeVisible();
  await expect(page).toHaveTitle('Book: short chemistry olympiad revision pages · UnoffIChO');
  await tab(page, 'Reagents').click();
  await expect(page.getByRole('navigation', { name: 'Reagent modes' })).toBeVisible();
  await tab(page, 'Progress').click();
  await expect(page.getByRole('heading', { name: 'Progress', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByText(DISCLAIMER).first()).toBeVisible();
});

test('homepage button and sections open the right feature and mode', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Start practising' }).click();
  await expect(page).toHaveURL(/\/calc$/);
  await page.getByRole('link', { name: 'UnoffIChO', exact: true }).click();
  await page.getByRole('region', { name: 'Sections' }).getByRole('link', { name: 'Mechanisms' }).click();
  await expect(page).toHaveURL(/\/calc$/);
  await expect(page.getByRole('navigation', { name: 'Calculation modes' }).getByRole('button', { name: 'Mechanisms' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('What’s new and Credits are reachable from the header and About', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: "What's new" }).click();
  await expect(page.getByRole('heading', { name: "What's new" })).toBeVisible();
  await page.getByRole('link', { name: 'About' }).click();
  await page.getByRole('link', { name: 'reviewers who check the content' }).click();
  await expect(page.getByText('Reviewers will be listed here.')).toBeVisible();
});

test('Rad’s three Calculations hints follow the first question, hide for good, and replay from Settings', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('hint-test')) {
      sessionStorage.setItem('hint-test', '1');
      localStorage.removeItem('unofficho.tutorial.calc');
    }
  });
  await page.goto('/calc');
  const card = page.getByRole('region', { name: 'Question 1' });
  const tip = card.getByRole('complementary', { name: 'Tip from Rad' });
  await expect(tip).toContainText('1 of 3');
  await expect(card).toContainText('Tap a chip to select it, or start an operation.');
  await card.getByRole('button', { name: /=/ }).first().click();
  await expect(tip).toContainText('2 of 3');
  await tip.getByRole('button', { name: 'Hide tips' }).click();
  await expect(tip).toBeHidden();

  await page.reload();
  await expect(page.getByRole('region', { name: 'Question 1' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Tip from Rad' })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /Replay tutorial/ }).click();
  await expect(page).toHaveURL(/\/calc$/);
  await expect(page.getByRole('region', { name: 'Question 1' }).getByRole('complementary', { name: 'Tip from Rad' })).toContainText(
    '1 of 3',
  );
});

test('an unknown address shows the not-found page with a way home', async ({ page }) => {
  await page.goto('/no/such/page');
  await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible();
  await expect(page.getByRole('img', { name: /Rad/ })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: 'Go to the homepage' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^I built UnoffIChO/);
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

test('review mode is password-protected on the live build, then shows the review queue', async ({ page }) => {
  await page.route('**/api/admin/check', (route) =>
    route.fulfill(
      route.request().headers().authorization === 'Bearer right'
        ? { status: 204 }
        : { status: 401, contentType: 'application/json', body: '{"error":"Wrong password."}' },
    ),
  );
  await page.goto('/review');
  const password = page.getByLabel(/Password/);
  await password.fill('wrong');
  await page.getByRole('button', { name: 'Open review mode' }).click();
  await expect(page.getByRole('alert')).toHaveText('Wrong password.');
  await password.fill('right');
  await page.getByRole('button', { name: 'Open review mode' }).click();
  await expect(page.getByRole('list', { name: 'Progress' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Your answer' })).toBeVisible();
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
    ['/calc', 'light'],
    ['/no/such/page', 'light'],
    ['/reagents', 'dark'],
    ['/book/combining-potentials', 'dark'],
    ['/progress', 'light'],
    ['/book', 'light'],
    ['/about', 'light'],
    ['/guides/uk-chemistry-olympiad-round-1', 'light'],
  ] as const) {
    test(`${path} in ${theme} mode has no serious violations`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('unofficho.theme', t), theme);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(
        serious.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(' '))
              .slice(0, 3)
              .join(' | ')}`,
        ),
      ).toEqual([]);
    });
  }
});

test('first launch: the level picker, the placement quiz, and the chip that changes level', async ({ page }) => {
  // First load only: no level chosen yet (the stored choice then wins over the preset above).
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('picker-test')) {
      sessionStorage.setItem('picker-test', '1');
      localStorage.removeItem('unofficho.level');
    }
  });
  await page.goto('/');
  const picker = page.getByRole('dialog', { name: 'What are you preparing for?' });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('button', { name: /^C3L6/ })).toBeVisible();
  const start = picker.getByRole('button', { name: 'Choose a level to start' });
  await expect(start).toBeDisabled();

  // The quiz: five questions, then a recommendation the student can change.
  await picker.getByRole('button', { name: /placement quiz/ }).click();
  const quiz = page.getByRole('dialog', { name: 'Placement quiz' });
  for (let i = 1; i <= 5; i++) {
    await expect(quiz.getByText(`Question ${i} of 5`)).toBeVisible();
    await quiz.getByRole('button', { name: 'I don’t know' }).click();
    await quiz.getByRole('button', { name: i === 5 ? 'See my level' : 'Next' }).click();
  }
  await expect(quiz.getByRole('heading', { name: 'I’d start you on A-Level (AQA)' })).toBeVisible();
  await quiz.getByRole('button', { name: /^A-Level \(AQA\)/ }).click();
  await quiz.getByRole('button', { name: 'Start with A-Level (AQA)' }).click();
  await expect(quiz).toBeHidden();

  // A-level has no Mechanisms or Approach mode; the choice survives a reload.
  await page.getByRole('link', { name: 'Start practising' }).click();
  const modes = page.getByRole('navigation', { name: 'Calculation modes' });
  await expect(modes.getByRole('button', { name: 'Feed' })).toBeVisible();
  await expect(modes.getByRole('button', { name: 'Mechanisms' })).toHaveCount(0);
  await page.getByRole('button', { name: /^Level: A-Level\b/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^IChO/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).last().click();
  await expect(modes.getByRole('button', { name: 'Mechanisms' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /^Level: IChO/ })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'What are you preparing for?' })).toBeHidden();
});

test('level picker has no accessibility violations and fits 320 px', async ({ page }) => {
  // First load only: no level chosen yet (the stored choice then wins over the preset above).
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('picker-test')) {
      sessionStorage.setItem('picker-test', '1');
      localStorage.removeItem('unofficho.level');
    }
  });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'What are you preparing for?' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('a practice page shows a worked example and opens that question in the app', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('unofficho.level'));
  await page.goto('/practice/born-haber-nacl');
  // Public landing page: no level picker over it.
  await expect(page.getByRole('dialog', { name: 'What are you preparing for?' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Born–Haber cycle: lattice enthalpy of NaCl', level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Worked example' })).toContainText('Answer:');
  await expect(page.getByRole('region', { name: 'Common mistakes' })).toContainText('lattice dissociation');
  await page.getByRole('link', { name: 'Practise this with fresh numbers' }).first().click();
  await expect(page).toHaveURL(/\/calc\?/);
  await expect(page.getByText('Focus:')).toBeVisible();
});

test('C3L6 case studies: the stem shows above part (a), and part (b) folds it away', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('unofficho.level', 'c3l6'));
  await page.goto('/calc?mode=case');
  const modes = page.getByRole('navigation', { name: 'Calculation modes' });
  await expect(modes.getByRole('button', { name: 'Case studies' })).toHaveAttribute('aria-current', 'page');
  const first = page.getByRole('region', { name: 'Question 1' });
  await expect(first.getByText(/Case study: .* part \(a\) of 3/)).toBeVisible();
  await expect(first.locator('details')).toHaveAttribute('open', '');
  await page.keyboard.press('ArrowDown');
  const second = page.getByRole('region', { name: 'Question 2' });
  await expect(second.getByText(/part \(b\) of 3/)).toBeVisible();
  await expect(second.locator('details')).not.toHaveAttribute('open', '');
});
