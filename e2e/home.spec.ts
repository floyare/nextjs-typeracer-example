import { test, expect } from '@playwright/test';

test('homepage loads and shows Typeracer heading', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText(/Typeracer/i);

    const nicknameInput = page.getByPlaceholder('Nickname');
    await expect(nicknameInput).toBeVisible();

    const playButton = page.getByRole('button', { name: /Play/i });
    await expect(playButton).toBeVisible();
});
