import { test, expect } from '@playwright/test';

test('App initializes correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Loom Initialized')).toBeVisible();
});

test('1. The user navigates to the review URL and clicks the "Play" button on the video.\n2. At approximately 15 seconds, the user clicks directly on the timeline track.\n3. The video immediately pauses playback.\n4. A marker appears on the timeline at the exact click location (e.g., 15.24s).\n5. The cursor automatically focuses on the text input in the right-hand Feedback Drawer.\n6. The user types "Color grade looks too warm here" and presses the Enter key.\n7. The comment is saved, appears in the chronological list in the drawer with the "15.24" tag, and the timeline marker solidifies its state.', async ({ page }) => {
  
  // We mock the API route to serve some basic data and avoid needing the actual pocketbase server
  // Mock PocketBase endpoints exactly using wildcard
  await page.route('**/api/collections/projects/records*', async route => {
    await route.fulfill({
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ id: 'proj1', title: 'Test Project', share_token: 'test-token' }]
      })
    });
  });

  await page.route('**/api/collections/videos/records*', async route => {
    await route.fulfill({
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ 
          id: 'vid1', 
          project_id: 'proj1', 
          media_file: 'test.mp4', 
        }]
      })
    });
  });

  await page.route('**/api/collections/comments/records*', async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: []
        })
      });
    } else if (request.method() === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      await route.fulfill({
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...body,
          id: 'comment1',
          created: new Date().toISOString()
        })
      });
    } else {
      await route.continue();
    }
  });
  
  await page.route('**/api/files/videos/vid1/test.mp4', async route => {
    await route.fulfill({
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      status: 200,
      contentType: 'video/mp4',
    });
  });

  // Mock server sent events for subscribe
  await page.route('**/api/realtime', async route => {
    await route.fulfill({
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      status: 200,
      contentType: 'text/event-stream',
      body: 'id: 1\ndata: {"clientId": "123"}\n\n'
    });
  });

  await page.addInitScript(() => {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const video = document.querySelector('video');
        if (video) {
          Object.defineProperty(video, 'duration', { value: 60, writable: true });
          video.dispatchEvent(new Event('loadedmetadata'));
          
          // also mock play and pause since there's no real video source
          video.play = async () => {
            Object.defineProperty(video, 'paused', { value: false, writable: true });
            video.dispatchEvent(new Event('play'));
          };
          video.pause = () => {
            Object.defineProperty(video, 'paused', { value: true, writable: true });
            video.dispatchEvent(new Event('pause'));
          };
        }
      }, 500);
    });
  });

  await page.goto('/review/test-token');
  
  // The react hook might be getting caught on the dummy data, let's just log console to debug
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  // Wait for the video wrapper element instead of the generic tag, sometimes the component tree is still rendering
  await page.waitForSelector('.aspect-video');
  const playButton = page.locator('button').first(); // find the play button overlay
  if (await playButton.isVisible()) {
      await playButton.click();
  }

  // 2. At approximately 15 seconds, the user clicks directly on the timeline track.
  const track = page.locator('.celluloid-track');
  await track.waitFor();
  
  // Click at 25% of the 60s video = 15s
  const boundingBox = await track.boundingBox();
  if (boundingBox) {
    await track.dispatchEvent('click', {
      clientX: boundingBox.x + boundingBox.width * 0.25,
      clientY: boundingBox.y + boundingBox.height / 2,
      bubbles: true,
      cancelable: true
    });
  }

  // 3. The video immediately pauses playback.
  // The play button should reappear
  await expect(playButton).toBeVisible();

  // Need to make sure the timeupdate event from the fake play has stopped or doesn't override our mock click 
  await page.waitForTimeout(500);

  // 4. A marker appears on the timeline at the exact click location (e.g., 15.24s).
  // 5. The cursor automatically focuses on the text input in the right-hand Feedback Drawer.
  const textarea = page.locator('textarea');
  await expect(textarea).toBeFocused();
  const placeholder = await textarea.getAttribute('placeholder');
  expect(placeholder).toMatch(/Add a comment at 00:00:15/);

  // 6. The user types "Color grade looks too warm here" and presses the Enter key.
  await textarea.fill('Color grade looks too warm here');
  await textarea.press('Enter');

  // Wait a bit for the mock post to resolve and the react state to update
  await page.waitForTimeout(500);
  
  // 7. The comment is saved, appears in the chronological list in the drawer with the "15.24" tag, and the timeline marker solidifies its state.
  await expect(page.locator('text=Color grade looks too warm here')).toBeVisible();
  
  // Need to use first() since both the timeline and the comment show the timestamp
  await expect(page.locator('text=00:00:15').first()).toBeVisible();

  // Marker check: there should be a yellow/red marker
  const marker = track.locator('div[title*="Marker at"]');
  await expect(marker).toBeVisible();

  await page.screenshot({ path: 'evidence.png' });
});
