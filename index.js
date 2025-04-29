const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const getCoordinatesFromShortLink = async (shortUrl) => {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  try {
    if (shortUrl && shortUrl.startsWith("https://maps.app.goo.gl")) {
              await page.goto(shortUrl, { waitUntil: 'networkidle2' , timeout: 30 });
        
              const currentUrl = page.url();
              // console.log("Resolved URL:", currentUrl);
        
              // Regex to extract coordinates from the URL
              const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
              const match = currentUrl.match(regex);
        
              if (match) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[2]);
        
                // Log coordinates (you can store these in your model here)
                console.log(`Coordinates for ${shortUrl}: Latitude: ${lat}, Longitude: ${lng}`);
                return { lat, lng };
              } else {
                console.log("Could not extract coordinates for:", shortUrl);
                return null;
              }
            } else {
              console.log("Invalid Google Maps link:", shortUrl);
              return null;
            }
  } catch (err) {
    console.error("Error extracting coordinates:", err);
    return null;
  } finally {
    await browser.close();
  }
};

// API route
app.post('/get-coordinates', async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required' });

  const coords = await getCoordinatesFromShortLink(url);
  if (coords) {
    res.json(coords);
  } else {
    res.status(404).json({ error: 'Coordinates not found or invalid URL' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
