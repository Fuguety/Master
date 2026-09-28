import { writeFile } from 'node:fs/promises';

const targets = await fetch('http://127.0.0.1:9222/json').then((response) => response.json());
const target = targets.find((candidate) => candidate.type === 'page' && candidate.url.startsWith('http://127.0.0.1:4173'));

if (target === undefined)
{
    throw new Error('Atlas Notebook browser target was not found.');
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const browserEvents = [];
let nextCommandId = 1;

await new Promise((resolve, reject) =>
{
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
});

socket.addEventListener('message', (event) =>
{
    const message = JSON.parse(event.data.toString());

    if (typeof message.id === 'number')
    {
        const request = pending.get(message.id);
        pending.delete(message.id);

        if (message.error !== undefined)
        {
            request?.reject(new Error(message.error.message));
        }
        else
        {
            request?.resolve(message.result);
        }

        return;
    }

    if (
        message.method === 'Runtime.consoleAPICalled'
        || message.method === 'Runtime.exceptionThrown'
        || message.method === 'Log.entryAdded'
    )
    {
        browserEvents.push(message);
    }
});

/**
 * Sends one command through the browser DevTools protocol.
 * Used by this local verification harness to inspect the running application.
 */
function send(method, params = {})
{
    const id = nextCommandId;
    nextCommandId += 1;

    return new Promise((resolve, reject) =>
    {
        pending.set(id, { reject, resolve });
        socket.send(JSON.stringify({ id, method, params }));
    });
}



/**
 * Evaluates JavaScript in the Atlas page and returns its serialized value.
 * Used for real DOM interactions and computed-style inspection.
 */
async function evaluate(expression)
{
    const result = await send('Runtime.evaluate', {
        awaitPromise: true,
        expression,
        returnByValue: true,
    });

    if (result.exceptionDetails !== undefined)
    {
        throw new Error(result.exceptionDetails.text);
    }

    return result.result.value;
}

await Promise.all([
    send('Runtime.enable'),
    send('Log.enable'),
    send('Page.enable'),
]);
const navigateUrl = process.env.ATLAS_NAVIGATE_URL;

if (navigateUrl === undefined)
{
    await send('Page.reload', { ignoreCache: true });
}
else
{
    await send('Page.navigate', { url: navigateUrl });
}

await new Promise((resolve) => setTimeout(resolve, 5_000));
browserEvents.length = 0;

const scenario = process.argv[2] ?? 'initial';

if (scenario === 'popup')
{
    await evaluate(`(() => {
        const companyButton = [...document.querySelectorAll('button')]
            .find((button) => button.textContent?.includes('company:'));
        companyButton?.focus();
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 80));
}

if (scenario.startsWith('create'))
{
    await evaluate(`(() => {
        const createButton = [...document.querySelectorAll('button')]
            .find((button) => button.getAttribute('aria-label') === 'Create Tag');
        createButton?.click();
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const canvasBounds = await evaluate(`(() => {
        const canvas = document.querySelector('.maplibregl-canvas');
        const bounds = canvas?.getBoundingClientRect();
        return bounds === undefined ? null : { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
    })()`);

    if (canvasBounds !== null)
    {
        const candidates = [[0.2, 0.65], [0.8, 0.65], [0.8, 0.25], [0.5, 0.2]];

        for (const [horizontal, vertical] of candidates)
        {
            const x = canvasBounds.left + canvasBounds.width * horizontal;
            const y = canvasBounds.top + canvasBounds.height * vertical;
            await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, x, y });
            await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x, y });
            await new Promise((resolve) => setTimeout(resolve, 250));
            const chooserIsOpen = await evaluate(`[...document.querySelectorAll('button')]
                .some((button) => button.textContent?.trim().startsWith('CompanyPayment'))`);

            if (chooserIsOpen)
            {
                break;
            }

            await evaluate(`(() => {
                const detailClose = [...document.querySelectorAll('button')]
                    .find((button) => button.getAttribute('aria-label')?.startsWith('Close '));
                detailClose?.click();
            })()`);
        }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
    await evaluate(`(() => {
        const companyButton = [...document.querySelectorAll('button')]
            .find((button) => button.textContent?.trim().startsWith('Company'));
        companyButton?.click();
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (scenario !== 'create')
    {
        if (scenario !== 'create-empty')
        {
            const names = {
                'create-normal': 'Browser Verified Company',
                'create-duplicate': 'Northstar Analytics',
                'create-special': 'R&D <Atlas> O\'Reilly & Co. \u6771\u4eac',
            };
            const recordName = names[scenario] ?? 'Browser Verified Company';
            await evaluate(`(() => {
                const setValue = (element, value) => {
                    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
                    setter?.call(element, value);
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                };
                const name = document.querySelector('#company-name');
                const city = document.querySelector('input[placeholder="Search cities"]');
                const country = document.querySelector('input[placeholder="Search countries"]');
                const countryCode = document.querySelector('#company-country-code');
                if (name instanceof HTMLInputElement) setValue(name, ${JSON.stringify(recordName)});
                if (city instanceof HTMLInputElement) setValue(city, 'S\u00e3o Paulo');
                if (country instanceof HTMLInputElement) setValue(country, 'Brazil');
                if (countryCode instanceof HTMLInputElement) setValue(countryCode, 'BRA');
            })()`);
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        await evaluate(`(() => {
            const submitButton = [...document.querySelectorAll('button')]
                .find((button) => button.textContent?.trim() === 'Create tag');
            submitButton?.click();
        })()`);
        await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
}

const pageState = await evaluate(`(() => ({
    bodyText: document.body.innerText.slice(0, 2000),
    buttons: ${scenario === 'initial' || scenario === 'popup' || scenario === 'create' ? `[...document.querySelectorAll('button')].map((button) => ({
        ariaLabel: button.getAttribute('aria-label'),
        text: button.textContent?.trim(),
    }))` : '[]'},
    rootChildren: document.querySelector('#root')?.childElementCount ?? -1,
    form: ${scenario === 'create' || scenario === 'create-empty' ? "document.querySelector('form')?.outerHTML.slice(0, 5000) ?? null" : 'null'},
    popup: (() => {
        const popup = document.querySelector('.atlas-tag-preview');
        const content = popup?.querySelector('.maplibregl-popup-content');
        const body = popup?.querySelector('.atlas-tag-preview__body');
        if (!(popup instanceof HTMLElement) || !(content instanceof HTMLElement)) return null;
        const popupStyle = getComputedStyle(popup);
        const contentStyle = getComputedStyle(content);
        const bodyStyle = body instanceof HTMLElement ? getComputedStyle(body) : null;
        const popupBounds = popup.getBoundingClientRect();
        const contentBounds = content.getBoundingClientRect();
        return {
            contentBounds: { height: contentBounds.height, width: contentBounds.width, x: contentBounds.x, y: contentBounds.y },
            contentOverflow: contentStyle.overflow,
            contentMaxWidth: contentStyle.maxWidth,
            contentTransform: contentStyle.transform,
            innerText: content.innerText,
            outerHTML: popup.outerHTML,
            popupBounds: { height: popupBounds.height, width: popupBounds.width, x: popupBounds.x, y: popupBounds.y },
            popupMaxWidth: popupStyle.maxWidth,
            popupTransform: popupStyle.transform,
            animationName: bodyStyle?.animationName ?? 'none',
            animationDuration: bodyStyle?.animationDuration ?? '0s',
        };
    })(),
    title: document.title,
}))()`);

if (scenario.startsWith('create'))
{
    pageState.storedCompanies = await evaluate(`new Promise((resolve, reject) => {
        const request = indexedDB.open('atlas-notebook');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const database = request.result;
            const transaction = database.transaction('companies', 'readonly');
            const records = transaction.objectStore('companies').getAll();
            records.onerror = () => reject(records.error);
            records.onsuccess = () => resolve(records.result.map((record) => ({ id: record.id, name: record.name })));
        };
    })`);
}
const screenshot = await send('Page.captureScreenshot', { format: 'png' });
await writeFile(`browser-${scenario}.png`, Buffer.from(screenshot.data, 'base64'));

console.log(JSON.stringify({ browserEvents, pageState }, null, 2));
socket.close();
