import { Page, Locator } from 'playwright';
import { BrowserError } from '@job-applier/core';
import { getConfigManager } from '@job-applier/config';

/**
 * Wait options
 */
export interface WaitOptions {
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

/**
 * Click options
 */
export interface ClickOptions {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  force?: boolean;
}

/**
 * Type options
 */
export interface TypeOptions {
  delay?: number;
  clear?: boolean;
}

/**
 * Random delay between min and max milliseconds
 */
export function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Human-like delay based on config
 */
export async function humanDelay(): Promise<void> {
  const config = getConfigManager().getRateLimit();
  const delay = randomDelay(
    config.minDelayBetweenActions,
    config.maxDelayBetweenActions
  );
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Wait for an element to appear
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: WaitOptions = {}
): Promise<Locator> {
  try {
    const locator = page.locator(selector);
    await locator.waitFor({
      timeout: options.timeout ?? 30000,
      state: options.state ?? 'visible',
    });
    return locator;
  } catch (error) {
    throw new BrowserError(
      `Element not found: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Click on an element with human-like delay
 */
export async function clickElement(
  page: Page,
  selector: string,
  options: ClickOptions = {}
): Promise<void> {
  try {
    await humanDelay();
    const locator = await waitForElement(page, selector);
    await locator.click({
      button: options.button ?? 'left',
      clickCount: options.clickCount ?? 1,
      delay: options.delay,
      force: options.force,
    });
  } catch (error) {
    if (error instanceof BrowserError) throw error;
    throw new BrowserError(
      `Failed to click element: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Type text into an element with human-like delay
 */
export async function typeText(
  page: Page,
  selector: string,
  text: string,
  options: TypeOptions = {}
): Promise<void> {
  try {
    await humanDelay();
    const locator = await waitForElement(page, selector);

    if (options.clear) {
      await locator.clear();
    }

    // Type with random delays between characters for human-like behavior
    await locator.pressSequentially(text, {
      delay: options.delay ?? randomDelay(50, 150),
    });
  } catch (error) {
    if (error instanceof BrowserError) throw error;
    throw new BrowserError(
      `Failed to type text in: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fill an input field (faster than typeText)
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  try {
    await humanDelay();
    const locator = await waitForElement(page, selector);
    await locator.fill(value);
  } catch (error) {
    if (error instanceof BrowserError) throw error;
    throw new BrowserError(
      `Failed to fill field: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Select an option from a dropdown
 */
export async function selectOption(
  page: Page,
  selector: string,
  value: string | string[]
): Promise<void> {
  try {
    await humanDelay();
    const locator = await waitForElement(page, selector);
    await locator.selectOption(value);
  } catch (error) {
    if (error instanceof BrowserError) throw error;
    throw new BrowserError(
      `Failed to select option in: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check or uncheck a checkbox
 */
export async function setCheckbox(
  page: Page,
  selector: string,
  checked: boolean
): Promise<void> {
  try {
    await humanDelay();
    const locator = await waitForElement(page, selector);
    await locator.setChecked(checked);
  } catch (error) {
    if (error instanceof BrowserError) throw error;
    throw new BrowserError(
      `Failed to set checkbox: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Upload a file
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
): Promise<void> {
  try {
    await humanDelay();
    const locator = await waitForElement(page, selector);
    await locator.setInputFiles(filePath);
  } catch (error) {
    if (error instanceof BrowserError) throw error;
    throw new BrowserError(
      `Failed to upload file to: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get text content of an element
 */
export async function getTextContent(
  page: Page,
  selector: string
): Promise<string> {
  try {
    const locator = await waitForElement(page, selector);
    const text = await locator.textContent();
    return text ?? '';
  } catch (error) {
    if (error instanceof BrowserError) throw error;
    throw new BrowserError(
      `Failed to get text from: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get an attribute value
 */
export async function getAttribute(
  page: Page,
  selector: string,
  attribute: string
): Promise<string | null> {
  try {
    const locator = await waitForElement(page, selector);
    return await locator.getAttribute(attribute);
  } catch (error) {
    if (error instanceof BrowserError) throw error;
    throw new BrowserError(
      `Failed to get attribute from: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if element exists
 */
export async function elementExists(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ timeout, state: 'attached' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
  page: Page,
  selector: string
): Promise<void> {
  try {
    const locator = await waitForElement(page, selector);
    await locator.scrollIntoViewIfNeeded();
  } catch (error) {
    if (error instanceof BrowserError) throw error;
    throw new BrowserError(
      `Failed to scroll to: ${selector}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Navigate to a URL
 */
export async function navigateTo(
  page: Page,
  url: string,
  options: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' } = {}
): Promise<void> {
  try {
    await page.goto(url, {
      waitUntil: options.waitUntil ?? 'domcontentloaded',
    });
  } catch (error) {
    throw new BrowserError(
      `Failed to navigate to: ${url}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(
  page: Page,
  options: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number } = {}
): Promise<void> {
  try {
    await page.waitForLoadState(options.waitUntil ?? 'domcontentloaded', {
      timeout: options.timeout ?? 30000,
    });
  } catch (error) {
    throw new BrowserError(
      `Navigation timeout. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get all matching elements
 */
export async function getAllElements(
  page: Page,
  selector: string
): Promise<Locator[]> {
  const locator = page.locator(selector);
  const count = await locator.count();
  const elements: Locator[] = [];

  for (let i = 0; i < count; i++) {
    elements.push(locator.nth(i));
  }

  return elements;
}

/**
 * Execute JavaScript in the page context
 */
export async function evaluate<T>(
  page: Page,
  fn: () => T | Promise<T>
): Promise<T> {
  try {
    return await page.evaluate(fn);
  } catch (error) {
    throw new BrowserError(
      `Failed to evaluate script. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
